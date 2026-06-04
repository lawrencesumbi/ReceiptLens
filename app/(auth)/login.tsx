import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert, // 1. Import Alert for user feedback
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
// 2. Import your configured supabase client from your utils folder
import { supabase } from "../../utils/supabase";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Track loading status to disable interaction during requests
  const [loading, setLoading] = useState(false);
  const [isPasswordSecure, setIsPasswordSecure] = useState(true);

  // 3. Convert handleLogin to an asynchronous function hitting Supabase Auth
  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    setLoading(true); // Turn button loading state ON

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    setLoading(false); // Turn button loading state OFF

    if (error) {
      Alert.alert("Login Failed", error.message);
    } else {
      console.log("Logged in successfully. User ID:", data.user?.id);
      
      // 4. Redirect your user to your main layout or homepage path
      // Replace '/(tabs)' with whatever your actual main home layout path is named
      router.replace("/home");
    }
  };

  const handleFacebookLogin = () => {
    console.log("Facebook login pressed");
  };

  const handleGoogleLogin = () => {
    console.log("Google/Gmail login pressed");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* Header Section with matching styled nested text colors */}
        <View style={styles.headerContainer}>
          <Image
            source={require("../../assets/images/receipt.png")}
            style={styles.image}
          />
          <Text style={styles.welcomeTitle}>
            Welcome to <Text style={styles.brandBlue}>Receipt</Text><Text style={styles.brandAccent}>Lens</Text>
          </Text>
          <Text style={styles.welcomeSubtitle}>Snap, track, and manage your expenses instantly.</Text>
        </View>

        {/* Form Inputs */}
        <View style={styles.formContainer}>
          <View>
            <Text style={styles.label}>Email</Text>
            <TextInput
              placeholder="Enter your email"
              placeholderTextColor="#aaa"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
          </View>

          <View>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                placeholder="Enter your password"
                placeholderTextColor="#aaa"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={isPasswordSecure}
                autoCapitalize="none"
                style={styles.passwordInput}
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

          <Pressable
            onPress={() => console.log("Forgot password pressed")}
            style={styles.forgotPasswordContainer}
          >
            <Text style={styles.forgotPasswordText}>
              Forgot Password?
            </Text>
          </Pressable>
        </View>

        {/* Main Log In Button updated with dynamic loading state */}
        <Pressable
          onPress={handleLogin}
          disabled={loading} // Blocker to prevent double execution requests
          style={({ pressed }) => [
            styles.loginButton,
            (pressed || loading) && styles.loginButtonPressed,
          ]}
        >
          <Text style={styles.loginButtonText}>
            {loading ? "Logging in..." : "Log In"}
          </Text>
        </Pressable>

        {/* --- Social Login Section --- */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialContainer}>
          {/* Facebook Button */}
          <Pressable
            onPress={handleFacebookLogin}
            style={({ pressed }) => [
              styles.socialButton,
              pressed && styles.socialButtonPressed,
            ]}
          >
            <Image
              source={require("../../assets/images/facebook.png")}
              style={styles.socialIcon}
            />
            <Text style={styles.socialButtonText}>Facebook</Text>
          </Pressable>

          {/* Google / Gmail Button */}
          <Pressable
            onPress={handleGoogleLogin}
            style={({ pressed }) => [
              styles.socialButton,
              pressed && styles.socialButtonPressed,
            ]}
          >
            <Image
              source={require("../../assets/images/google.png")}
              style={styles.socialIcon}
            />
            <Text style={styles.socialButtonText}>Google</Text>
          </Pressable>
        </View>

        {/* Footer Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Don't have an account?
          </Text>
          <Pressable onPress={() => router.replace("/signup")}>
            <Text style={styles.signUpText}>Sign Up</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 35,
  },
  image: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111111",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  brandBlue: {
    color: "#007AFF",
  },
  brandAccent: {
    color: "#6366F1",
  },
  welcomeSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#8E8E93",
    textAlign: "center",
    marginTop: 6,
    letterSpacing: 0.3,
  },
  formContainer: {
    gap: 15,
    width: "100%",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#444",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    backgroundColor: "#f9f9f9",
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  eyeIconContainer: {
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  eyeIcon: {
    width: 22,
    height: 22,
    resizeMode: "contain",
    tintColor: "#8E8E93",
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
  },
  forgotPasswordText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
  },
  loginButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 25,
    marginTop: 30,
    alignItems: "center",
    width: "100%",
  },
  loginButtonPressed: {
    opacity: 0.8,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  dividerText: {
    marginHorizontal: 10,
    color: "#8E8E93",
    fontSize: 13,
    fontWeight: "500",
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    width: "100%",
  },
  socialButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    gap: 8,
  },
  socialButtonPressed: {
    backgroundColor: "#f5f5f5",
  },
  socialIcon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
    gap: 5,
  },
  footerText: {
    color: "#666",
    fontSize: 14,
  },
  signUpText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
});