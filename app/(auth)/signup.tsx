import { Image } from "expo-image";
import { useRouter } from "expo-router";
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

export default function Signup() {
  const router = useRouter();
  
  // State for form inputs
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Independent eye-toggle states for both password fields
  const [isPasswordSecure, setIsPasswordSecure] = useState(true);
  const [isConfirmPasswordSecure, setIsConfirmPasswordSecure] = useState(true);

  const handleSignup = () => {
    if (!fullName || !email || !password || !confirmPassword) {
      alert("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    
    console.log("Signing up with:", fullName, email, password);
  };

  const handleFacebookLogin = () => {
    console.log("Facebook sign up callback initiated");
  };

  const handleGoogleLogin = () => {
    console.log("Google sign up callback initiated");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        
        {/* Header Section matching Login layout */}
        <View style={styles.headerContainer}>
          <Text style={styles.welcomeTitle}>
            Join <Text style={styles.brandBlue}>Receipt</Text><Text style={styles.brandAccent}>Lens</Text>
          </Text>
          <Text style={styles.welcomeSubtitle}>Create account and start your expense journey.</Text>
        </View>

        {/* Inputs Form */}
        <View style={styles.formContainer}>
          {/* Full Name */}
          <View>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              placeholder="Enter your full name"
              placeholderTextColor="#aaa"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              style={styles.input}
            />
          </View>

          {/* Email */}
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

          {/* Password */}
          <View>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                placeholder="Create a password"
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

          {/* Confirm Password */}
          <View>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                placeholder="Confirm your password"
                placeholderTextColor="#aaa"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={isConfirmPasswordSecure}
                autoCapitalize="none"
                style={styles.passwordInput}
              />
              <Pressable 
                onPress={() => setIsConfirmPasswordSecure(!isConfirmPasswordSecure)}
                style={styles.eyeIconContainer}
              >
                <Image
                  source={
                    isConfirmPasswordSecure
                      ? require("../../assets/images/eye-off.png")
                      : require("../../assets/images/eye.png")
                  }
                  style={styles.eyeIcon}
                />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Main Sign Up Button */}
        <Pressable
          onPress={handleSignup}
          style={({ pressed }) => [
            styles.signupButton,
            pressed && styles.signupButtonPressed,
          ]}
        >
          <Text style={styles.signupButtonText}>Sign Up</Text>
        </Pressable>

        {/* Social Authentication Section */}
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

          {/* Google Button */}
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

        {/* Footer Navigation */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Pressable onPress={() => router.replace("/login")}>
            <Text style={styles.logInText}>Log In</Text>
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
    marginBottom: 30,
  },
  image: {
    width: 120,
    height: 120,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111111", // Keeps the word "Join " deep charcoal/black
    textAlign: "center",
    letterSpacing: -0.5,
  },
  brandBlue: {
    color: "#007AFF", // Elegant brand blue for "Receipt"
  },
  brandAccent: {
    color: "#6366F1", // Vivid blue-purple for "Lens"
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
  signupButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 25,
    marginTop: 30,
    alignItems: "center",
    width: "100%",
  },
  signupButtonPressed: {
    opacity: 0.8,
  },
  signupButtonText: {
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
    marginBottom: 10,
  },
  footerText: {
    color: "#666",
    fontSize: 14,
  },
  logInText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
});