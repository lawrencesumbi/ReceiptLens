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
      // NOTE: Para sa tinuod nga AI, mas maayo nga maghimo ka og Supabase Edge Function
      // para adto nimo ibutang imong Gemini/OpenAI API key aron dili makawat sa front-end.
      
      // Kani nga block mao ang ehemplo sa pag-call sa imong umaabot nga Edge Function:
      /*
      const { data, error } = await supabase.functions.invoke('process-receipt', {
        body: { image_url: imageUrl }
      });
      */

      // 👇 MOCK AI RESPONSE (Kini ang porma sa i-return sa AI unya):
      // Atong gi-simulate nga ang AI nakabasa og resibo gikan sa Jollibee
      const mockAIResponse = {
        merchant: "Jollibee Minglanilla (Scanned)",
        amount: 458.50,
        category: "Food & Drinks",
        payment_method: "Cash",
      };

      // I-save dretso ang gi-extract sa AI ngadto sa `transactions` table sa Supabase
      const { error: insertError } = await supabase
        .from("transactions")
        .insert([
          {
            user_id: userId,
            merchant: mockAIResponse.merchant,
            amount: mockAIResponse.amount,
            category: mockAIResponse.category,
            payment_method: mockAIResponse.payment_method,
            receipt_url: imageUrl, // Gi-save ang public URL sa resibo gikan sa Storage bucket
          },
        ]);

      if (insertError) throw insertError;

      Alert.alert(
        "AI OCR Success!", 
        `Extracted:\n🛒 ${mockAIResponse.merchant}\n💰 ₱${mockAIResponse.amount.toFixed(2)}\n📂 ${mockAIResponse.category}`
      );

    } catch (error: any) {
      console.error("AI processing error:", error);
      Alert.alert("OCR Error", "The AI failed to process and extract data from the receipt.");
    }
  };

  // --- MAIN CAPTURE & UPLOAD ROUTINE ---
  const handleCaptureAndUpload = async () => {
    if (!cameraRef.current || isProcessing) return;

    try {
      setIsProcessing(true);
      
      // 1. Pagkuha sa litrato gikan sa camera
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.6, // Gi-ubos gamit gamay para paspas i-upload sa network
      });

      if (!photo?.uri) throw new Error("Failed to capture image local path.");

      // 2. Pagkuha sa kasamtangang naka-login nga user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user found.");

      // 3. I-convert ang file path ngadto sa Blob para ma-upload sa Supabase
      const response = await fetch(photo.uri);
      const blob = await response.blob();

      const fileExtension = photo.uri.split('.').pop() || 'jpg';
      const fileName = `${user.id}/${Date.now()}.${fileExtension}`; // I-grupo kada user ID ang folders sa storage

      // 4. I-upload ang Blob sa Supabase "receipts" Storage Bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(fileName, blob, {
          contentType: `image/${fileExtension}`,
          upsert: true
        });

      if (uploadError) throw uploadError;

      // 5. I-generate ang Public Web URL sa resibo
      const { data: { publicUrl } } = supabase.storage
        .from("receipts")
        .getPublicUrl(fileName);

      console.log("Public Receipt URL:", publicUrl);

      // 6. I-pasa ang URL ngadto sa AI para sugdan ang OCR Extraction
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
      <CameraView 
        ref={cameraRef} 
        style={StyleSheet.absoluteFillObject} 
        facing={facing}
        enableTorch={flash === "on"}
      >
        <View style={styles.overlayContainer}>
          
          {/* Top Control Header Bar */}
          <View style={styles.topBar}>
            <Text style={styles.scanHeaderTitle}>Scan Receipt</Text>
            <Pressable style={styles.iconActionCircle} onPress={toggleFlash} disabled={isProcessing}>
              <Ionicons 
                name={flash === "on" ? "flash" : "flash-off-outline"} 
                size={20} 
                color={flash === "on" ? "#FFCC00" : "#ffffff"} 
              />
            </Pressable>
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
              <View style={styles.secondaryActionCircle} />

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
      </CameraView>
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