import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { supabase } from "../../utils/supabase";

export default function UpdatePassword() {
  const [token, setToken] = useState(""); // Para sa 6-digit OTP code
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  // Dawaton ang email gikan sa login screen
  const params = useLocalSearchParams();
  const email = params.email as string;

  const handleVerifyAndUpdate = async () => {
    if (!token || token.length < 6) {
      Alert.alert("Error", "Please enter the valid 6-digit token.");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      // 1. I-verify ang OTP token sulod sa app para ma-authenticate ang session
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        email: email,
        token: token,
        type: "recovery", // Importante: 'recovery' ang tipo para sa password reset
      });

      if (verifyError) throw verifyError;

      // 2. Kon malampuson ang verification, naa na kay saktong session!
      // Mahimo na nimo i-update ang password nga walay error.
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      Alert.alert("Success", "Nailisan na ang imong password!", [
        { 
          text: "Log In Karon", 
          onPress: async () => {
            await supabase.auth.signOut(); 
            router.replace("/login"); 
          } 
        }
      ]);

    } catch (error: any) {
      Alert.alert("Error", error.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Your Password</Text>
      <Text style={styles.subtitle}>Email: {email}</Text>
      
      <TextInput
        placeholder="Enter 6-digit recovery code"
        placeholderTextColor="#aaa"
        keyboardType="number-pad"
        value={token}
        onChangeText={setToken}
        style={styles.input}
        maxLength={6}
        editable={!loading}
      />

      <TextInput
        placeholder="Enter new password"
        placeholderTextColor="#aaa"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
        style={styles.input}
        editable={!loading}
      />

      <Pressable 
        onPress={handleVerifyAndUpdate} 
        disabled={loading} 
        style={[styles.button, loading && { opacity: 0.5 }]}
      >
        <Text style={styles.buttonText}>
          {loading ? "Verifying..." : "Verify & Update Password"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 30, backgroundColor: "white" },
  title: { fontSize: 22, fontWeight: "700", color: "#111", marginBottom: 5 },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 25 },
  input: { borderWidth: 1, borderColor: "#e0e0e0", borderRadius: 12, padding: 14, fontSize: 16, backgroundColor: "#f9f9f9", marginBottom: 15 },
  button: { backgroundColor: "#007AFF", padding: 14, borderRadius: 25, alignItems: "center", marginTop: 10 },
  buttonText: { color: "white", fontSize: 16, fontWeight: "600" }
});