import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    console.log("Logging in with:", email, password);
    // Add your authentication logic here
  };

  return (
    // KeyboardAvoidingView prevents the keyboard from hiding input fields on mobile
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 30 }}>
        
        {/* Logo Section */}
        <View style={{ alignItems: "center", marginBottom: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: "#1a1a1a", marginTop: 10 }}>
            Welcome Back
          </Text>
          <Text style={{ fontSize: 14, color: "#666", marginTop: 5 }}>
            Sign in to continue
          </Text>
        </View>

        {/* Form Section */}
        <View style={{ gap: 15, width: "100%" }}>
          <View>
            <Text style={{ fontSize: 14, fontWeight: "500", color: "#444", marginBottom: 6 }}>Email</Text>
            <TextInput
              placeholder="Enter your email"
              placeholderTextColor="#aaa"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={{
                borderWidth: 1,
                borderColor: "#e0e0e0",
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 16,
                fontSize: 16,
                backgroundColor: "#f9f9f9",
              }}
            />
          </View>

          <View>
            <Text style={{ fontSize: 14, fontWeight: "500", color: "#444", marginBottom: 6 }}>Password</Text>
            <TextInput
              placeholder="Enter your password"
              placeholderTextColor="#aaa"
              value={password}
              onChangeText={setPassword}
              secureTextEntry // Hides the password text
              autoCapitalize="none"
              style={{
                borderWidth: 1,
                borderColor: "#e0e0e0",
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 16,
                fontSize: 16,
                backgroundColor: "#f9f9f9",
              }}
            />
          </View>

          {/* Forgot Password Link */}
          <Pressable onPress={() => console.log("Forgot password pressed")} style={{ alignSelf: "flex-end" }}>
            <Text style={{ color: "#007AFF", fontSize: 14, fontWeight: "500" }}>
              Forgot Password?
            </Text>
          </Pressable>
        </View>

        {/* Login Button */}
        <Pressable
          onPress={handleLogin}
          style={({ pressed }) => ({
            backgroundColor: "#007AFF",
            paddingVertical: 14,
            borderRadius: 25,
            marginTop: 30,
            opacity: pressed ? 0.8 : 1,
            alignItems: "center",
            width: "100%",
          })}
        >
          <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
            Log In
          </Text>
        </Pressable>

        {/* Footer / Sign Up Link */}
        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 25, gap: 5 }}>
          <Text style={{ color: "#666", fontSize: 14 }}>Don't have an account?</Text>
          <Pressable onPress={() => console.log("Navigate to Register")}>
            <Text style={{ color: "#007AFF", fontSize: 14, fontWeight: "600" }}>Sign Up</Text>
          </Pressable>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}