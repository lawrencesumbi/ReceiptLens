import { Ionicons } from "@expo/vector-icons";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { supabase } from "../../utils/supabase"; // Siguroha nga husto ang path sa imong supabase client setup

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState<"off" | "on">("off");
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="camera-outline" size={64} color="#8E8E93" style={{ marginBottom: 16 }} />
        <Text style={styles.permissionText}>ReceiptLens needs access to your camera to scan receipts.</Text>
        <Pressable style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Camera Permission</Text>
        </Pressable>
      </View>
    );
  }

  const toggleFlash = () => {
    setFlash((current) => (current === "off" ? "on" : "off"));
  };

  // --- INTEGRATION FUNCTION: PROCESS WITH AI OCR ---
  const processReceiptWithAI = async (imageUrl: string, userId: string) => {
    try {
      // 1. I-call ang live Supabase Edge Function aron basahon ni Gemini ang resibo
      const { data, error } = await supabase.functions.invoke('process-receipt', {
        body: { image_url: imageUrl },
        headers: {
          "X-Region": "ap-southeast-1"
        }
      });

      if (error) throw error;
      if (!data) throw new Error("You did not receive any data from the AI.");
      if (data.error) throw new Error(data.error);

      console.log("Real Data from Gemini:", data);

      // 2. I-save sa database ang TINUOD nga gi-extract sa AI (gikan sa data variable)
      const { error: insertError } = await supabase
        .from("transactions")
        .insert([
          {
            user_id: userId,
            merchant: data.merchant || "Unknown Merchant",
            amount: parseFloat(data.amount) || 0,
            category: data.category || "Utilities", // Default to Utilities para sa mga bayranan
            payment_method: data.payment_method || "Cash",
            receipt_url: imageUrl, 
          },
        ]);

      if (insertError) throw insertError;

      // 3. I-pop up ang tinuod nga resulta sa screen
      Alert.alert(
        "AI OCR Success!", 
        `Extracted:\n🛒 ${data.merchant}\n💰 ₱${Number(data.amount).toFixed(2)}\n📂 ${data.category}\n💳 ${data.payment_method}`
      );

    } catch (error: any) {
      console.error("AI processing error:", error);
      
      // 🛠️ DEBUG ALERT: Atong kuhaon ang tinuod nga unod sa crash gikan sa Supabase Server
      let serverErrorMessage = "The AI could not read your receipt.";
      
      if (error?.context?.message) {
        serverErrorMessage = error.context.message;
      } else if (error?.message) {
        serverErrorMessage = error.message;
      } else {
        serverErrorMessage = JSON.stringify(error);
      }
      
      Alert.alert(
        "Server Detail Error", 
        `This is the real reason for the crash:\n\n${serverErrorMessage}`
      );
    }
  };

  // --- MAIN CAPTURE & UPLOAD ROUTINE ---
  // --- MAIN CAPTURE & UPLOAD ROUTINE (FIXED BASE64 VERSION) ---
  const handleCaptureAndUpload = async () => {
    if (!cameraRef.current || isProcessing) return;

    try {
      setIsProcessing(true);
      
      // 1. Pagkuha sa litrato gikan sa camera (Gi-compress ngadto sa 0.4 para paspas)
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.4,
        base64: true, // <-- Atong gi-force nga i-return sab ang base64 representation sa image!
      });

      if (!photo?.uri || !photo?.base64) {
        throw new Error("Failed to capture image or generate Base64 content.");
      }

      console.log("Photo captured successfully. Ready to decode and upload.");

      // 2. Pagkuha sa kasamtangang naka-login nga user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user found.");

      const fileExtension = photo.uri.split('.').pop() || 'jpg';
      const fileName = `${user.id}/${Date.now()}.${fileExtension}`;

      // 🛠️ FIX: I-import ang Buffer gikan sa "base-64" helper o mogamit og Uint8Array
      // para ma-decode ang base64 ngadto sa ArrayBuffer nga dawat sa Supabase Storage.
      const { decode } = require('base-64');
      const strToBuffer = (str: string) => {
        const binaryString = decode(str);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
      };

      const arrayBuffer = strToBuffer(photo.base64);

      // 3. I-upload ang ArrayBuffer dretso sa Supabase "receipts" Storage Bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(fileName, arrayBuffer, {
          contentType: `image/${fileExtension}`,
          upsert: true
        });

      if (uploadError) throw uploadError;

      // 4. I-generate ang Public Web URL sa resibo
      const { data: { publicUrl } } = supabase.storage
        .from("receipts")
        .getPublicUrl(fileName);

      console.log("Public Receipt URL Generated:", publicUrl);

      // 5. I-pasa ang URL ngadto sa AI para sugdan ang OCR Extraction
      await processReceiptWithAI(publicUrl, user.id);

    } catch (error: any) {
      console.error("Scanning process failed:", error);
      Alert.alert("Scanning Error", error.message || "Something went wrong while scanning.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Kani self-closing tag na siya, wala nay sulod */}
      <CameraView 
        ref={cameraRef} 
        style={StyleSheet.absoluteFillObject} 
        facing={facing}
        enableTorch={flash === "on"}
      />

      {/* Kani ang overlay panel, absolute position na siya sa ibabaw sa camera view */}
      <View style={[styles.overlayContainer, StyleSheet.absoluteFillObject]}>
        
        {/* Top Control Header Bar */}
        <View style={styles.topBar}>
          <Text style={styles.scanHeaderTitle}>Scan Receipt</Text>
          
        </View>

        {/* Central Transparent Framing Box */}
        <View style={styles.viewfinderContainer}>
          <View style={styles.receiptTargetBox}>
            <View style={[styles.cornerMarker, styles.topLeftCorner]} />
            <View style={[styles.cornerMarker, styles.topRightCorner]} />
            <View style={[styles.cornerMarker, styles.bottomLeftCorner]} />
            <View style={[styles.cornerMarker, styles.bottomRightCorner]} />
            
            {isProcessing ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>AI is reading receipt...</Text>
              </View>
            ) : (
              <Text style={styles.guideHelperText}>Position receipt inside frame</Text>
            )}
          </View>
        </View>

        {/* Bottom Controls Shutter Panel Area */}
        <View style={styles.bottomBarContainer}>
          <View style={styles.shutterRow}>
            <Pressable style={styles.secondaryActionCircle} onPress={toggleFlash} disabled={isProcessing}>
              <Ionicons 
                name={flash === "on" ? "flash" : "flash-off-outline"} 
                size={20} 
                color={flash === "on" ? "#FFCC00" : "#ffffff"} 
              />
            </Pressable>
            <Pressable 
              style={[styles.mainShutterOuter, isProcessing && { opacity: 0.5 }]} 
              onPress={handleCaptureAndUpload}
              disabled={isProcessing}
            >
              <View style={styles.mainShutterInner}>
                {isProcessing && <ActivityIndicator size="small" color="#007AFF" />}
              </View>
            </Pressable>

            <Pressable 
              style={styles.secondaryActionCircle} 
              onPress={() => setFacing(current => current === "back" ? "front" : "back")}
              disabled={isProcessing}
            >
              <Ionicons name="camera-reverse-outline" size={24} color="#ffffff" />
            </Pressable>
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8F9FA", paddingHorizontal: 32 },
  permissionText: { fontSize: 15, color: "#666666", textAlign: "center", marginBottom: 24, lineHeight: 22 },
  permissionBtn: { backgroundColor: "#007AFF", paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12 },
  permissionBtnText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
  overlayContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.25)", justifyContent: "space-between" },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingTop: Platform.OS === "android" ? 40 : 16 },
  scanHeaderTitle: { fontSize: 22, fontWeight: "700", color: "#ffffff", textShadowColor: "rgba(0, 0, 0, 0.4)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  iconActionCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.15)" },
  viewfinderContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  receiptTargetBox: { width: SCREEN_WIDTH * 0.75, height: SCREEN_HEIGHT * 0.45, borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.25)", borderRadius: 16, backgroundColor: "rgba(255, 255, 255, 0.03)", justifyContent: "center", alignItems: "center", position: "relative" },
  cornerMarker: { position: "absolute", width: 24, height: 24, borderColor: "#007AFF" },
  topLeftCorner: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 12 },
  topRightCorner: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 12 },
  bottomLeftCorner: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 12 },
  bottomRightCorner: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 12 },
  guideHelperText: { color: "rgba(255, 255, 255, 0.6)", fontSize: 13, fontWeight: "500", position: "absolute", bottom: 20, textShadowColor: "#000000", textShadowRadius: 2 },
  loadingBox: { alignItems: "center", gap: 12 },
  loadingText: { color: "#ffffff", fontSize: 14, fontWeight: "600", textShadowColor: "#000", textShadowRadius: 3 },
  bottomBarContainer: { backgroundColor: "rgba(0, 0, 0, 0.65)", paddingTop: 24, paddingBottom: 110, paddingHorizontal: 32, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  shutterRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  mainShutterOuter: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: "#ffffff", justifyContent: "center", alignItems: "center", backgroundColor: "transparent" },
  mainShutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#ffffff", justifyContent: "center", alignItems: "center" },
  secondaryActionCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
});