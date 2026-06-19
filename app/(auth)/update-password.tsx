import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { supabase } from "../../utils/supabase";

export default function UpdatePassword() {
  const [userInputToken, setUserInputToken] = useState(""); 
  const [newPassword, setNewPassword] = useState("");
  const [isPasswordSecure, setIsPasswordSecure] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  // Destructure route params sent from login.tsx
  const params = useLocalSearchParams();
  const email = (params.email as string) || "";
  const correctOtp = (params.correctOtp as string) || "";

const handleVerifyAndUpdate = async () => {
  if (!userInputToken || userInputToken.length < 6) {
    Alert.alert("Error", "Please enter a valid 6-digit verification code.");
    return;
  }

  if (newPassword.length < 6) {
    Alert.alert("Error", "Password must be at least 6 characters long.");
    return;
  }

  setLoading(true);

  try {
    // STEP 1: Verify using the 'recovery' type for password resets
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      email: email,
      token: userInputToken.trim(),
      type: 'recovery' // 👈 Change this from 'magiclink' to 'recovery'
    });

    if (verifyError) throw verifyError;

    // STEP 2: Update the password now that the session is verified
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) throw updateError;

    // STEP 3: Clear session out and redirect
    await supabase.auth.signOut();

    Alert.alert("Success", "Your password has been successfully updated!", [
      { 
        text: "Log In Now", 
        onPress: () => {
          router.replace("/(auth)/login"); 
        } 
      }
    ]);

  } catch (error: any) {
    Alert.alert("Error", error.message || "Failed to complete password update.");
  } finally {
    setLoading(false);
  }
};

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Reset Your Password</Text>
        <Text style={styles.subtitle}>We sent a verification code to <Text style={styles.emailHighlight}>{email}</Text></Text>
        
        <View style={styles.formContainer}>
          <View>
            <Text style={styles.label}>Recovery Code</Text>
            <TextInput
              placeholder="Enter 6-digit code"
              placeholderTextColor="#aaa"
              keyboardType="number-pad"
              value={userInputToken}
              onChangeText={setUserInputToken}
              style={styles.input}
              maxLength={6}
              editable={!loading}
            />
          </View>

          <View>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                placeholder="Enter new password"
                placeholderTextColor="#aaa"
                secureTextEntry={isPasswordSecure}
                value={newPassword}
                onChangeText={setNewPassword}
                style={styles.passwordInput}
                editable={!loading}
                autoCapitalize="none"
              />
              <Pressable 
                onPress={() => setIsPasswordSecure(!isPasswordSecure)}
                style={styles.eyeIconContainer}
              >
                <Image
                  source={
                    isPasswordSecure
                      ? require("../../assets/images/eye-off.png")
                      : require("../../assets/images/eye.png")
                  }
                  style={styles.eyeIcon}
                />
              </Pressable>
            </View>
          </View>
        </View>

        <Pressable 
          onPress={handleVerifyAndUpdate} 
          disabled={loading} 
          style={({ pressed }) => [
            styles.button,
            (pressed || loading) && styles.buttonPressed
          ]}
        >
          <Text style={styles.buttonText}>
            {loading ? "Verifying..." : "Verify & Update Password"}
          </Text>
        </Pressable>

        <Pressable onPress={() => router.replace("/(auth)/login")} disabled={loading} style={styles.cancelContainer}>
          <Text style={styles.cancelText}>Back to Log In</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Keep your existing layout stylesheet definitions identical below
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  scrollContainer: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 30, paddingVertical: 40 },
  title: { fontSize: 24, fontWeight: "700", color: "#111", marginBottom: 6, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 30, lineHeight: 20 },
  emailHighlight: { fontWeight: "600", color: "#111" },
  formContainer: { gap: 15, width: "100%" },
  label: { fontSize: 14, fontWeight: "500", color: "#444", marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#e0e0e0", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, fontSize: 16, backgroundColor: "#f9f9f9" },
  passwordInputContainer: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#e0e0e0", borderRadius: 12, backgroundColor: "#f9f9f9" },
  passwordInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 16, fontSize: 16 },
  eyeIconContainer: { paddingHorizontal: 14, justifyContent: "center", alignItems: "center" },
  eyeIcon: { width: 22, height: 22, resizeMode: "contain", tintColor: "#8E8E93" },
  button: { backgroundColor: "#007AFF", paddingVertical: 14, borderRadius: 25, alignItems: "center", marginTop: 30, width: "100%" },
  buttonPressed: { opacity: 0.8 },
  buttonText: { color: "white", fontSize: 16, fontWeight: "600" },
  cancelContainer: { marginTop: 20, alignSelf: "center" },
  cancelText: { color: "#8E8E93", fontSize: 14, fontWeight: "500" }
});