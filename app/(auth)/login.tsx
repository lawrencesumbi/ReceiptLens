import { Image } from "expo-image";
import { useRouter } from "expo-router"; // 1. Import the router
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function Login() {
  const router = useRouter(); // 2. Initialize the router
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // New state to toggle password visibility
  const [isPasswordSecure, setIsPasswordSecure] = useState(true);

  const handleLogin = () => {
    console.log("Logging in with:", email, password);
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
        
        {/* Header Section with Logo, Welcome Title, and Subtitle */}
        <View style={styles.headerContainer}>
          <Image
            source={require("../../assets/images/receipt.png")}
            style={styles.image}
          />
          <Text style={styles.welcomeTitle}>Welcome to ReceiptLens</Text>
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
            {/* Wrapper view to position the eye icon inside the input field */}
            <View style={styles.passwordInputContainer}>
              <TextInput
                placeholder="Enter your password"
                placeholderTextColor="#aaa"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={isPasswordSecure} // Controlled by our state toggle
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
                      ? require("../../assets/images/eye-off.png") // Icon for hidden state
                      : require("../../assets/images/eye.png")     // Icon for visible state
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

        {/* Main Log In Button */}
        <Pressable
          onPress={handleLogin}
          style={({ pressed }) => [
            styles.loginButton,
            pressed && styles.loginButtonPressed,
          ]}
        >
          <Text style={styles.loginButtonText}>Log In</Text>
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
  /* Password Input specific styles to dock the eye button seamlessly */
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
    tintColor: "#8E8E93", // Soft subtle grey color matching your subtitle
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