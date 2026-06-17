import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { supabase } from "../../utils/supabase"; // adjust path as needed

export default function UpdatePassword() {
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    
    // Supabase automatically extracts the recovery token from the URL in the background
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Success", "Your password has been updated successfully!", [
        { text: "OK", onPress: () => router.replace("/login") }
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create New Password</Text>
      <TextInput
        placeholder="Enter new password"
        placeholderTextColor="#aaa"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
        style={styles.input}
      />
      <Pressable 
        onPress={handleUpdatePassword} 
        disabled={loading} 
        style={styles.button}
      >
        <Text style={styles.buttonText}>
          {loading ? "Updating..." : "Update Password"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 30, backgroundColor: "white" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20, color: "#111" },
  input: { borderWidth: 1, borderColor: "#e0e0e0", borderRadius: 12, padding: 14, fontSize: 16, backgroundColor: "#f9f9f9", marginBottom: 20 },
  button: { backgroundColor: "#007AFF", padding: 14, borderRadius: 25, alignItems: "center" },
  buttonText: { color: "white", fontSize: 16, fontWeight: "600" }
});