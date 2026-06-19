import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { supabase } from "../../utils/supabase";

import * as WebBrowser from 'expo-web-browser';


import * as AuthSession from 'expo-auth-session';

import * as QueryParams from 'expo-auth-session/build/QueryParams';

// Ibutang ni sa gawas sa imong function
WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [isPasswordSecure, setIsPasswordSecure] = useState(true);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    setLoading(false);

    if (error) {
      Alert.alert("Login Failed", error.message);
    } else {
      console.log("Logged in successfully. User ID:", data.user?.id);
      router.replace("/home");
    }
  };

const handleForgotPassword = async () => {
  if (!email.trim()) {
    Alert.alert("Error", "Please enter your email address first.");
    return;
  }

  setLoading(true);

  try {
    // This explicitly tells Supabase to start a Password Reset flow
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());

    if (error) throw error;

    Alert.alert(
      "Code Sent Successfully!", 
      "Please check your email inbox for the 6-digit verification code.",
      [
        {
          text: "OK",
          onPress: () => {
            router.push({
              pathname: "/(auth)/update-password",
              params: { email: email.trim() }
            });
          }
        }
      ]
    );
  } catch (error: any) {
    Alert.alert("Error", error.message || "Failed to send verification code.");
  } finally {
    setLoading(false);
  }
};

  const handleFacebookLogin = async () => {
    setLoading(true);
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'receiptlens', // Matches your app.json scheme
    });

    // 1. Request the OAuth URL from Supabase for Facebook
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: { 
        redirectTo: redirectUri, 
        skipBrowserRedirect: true 
      },
    });

    if (error) { 
      Alert.alert("Error", error.message); 
      setLoading(false); 
      return; 
    }

    // 2. Open the Web Browser to let the user authenticate
    const result = await WebBrowser.openAuthSessionAsync(
      data.url, 
      redirectUri,
      { showInRecents: true }
    );

    // 3. Parse the tokens back if login succeeds
    if (result.type === 'success') {
      const { url } = result;
      const { params } = QueryParams.getQueryParams(url);
      const { access_token, refresh_token } = params;

      // 4. Establish session in Supabase storage
      const { error: sessionError } = await supabase.auth.setSession({ 
        access_token, 
        refresh_token 
      });
      
      if (sessionError) Alert.alert("Auth Error", sessionError.message);
    }
    
    setLoading(false);
  };

const handleGoogleLogin = async () => {
  setLoading(true);
  const redirectUri = AuthSession.makeRedirectUri({
  scheme: 'receiptlens', // This MUST match the "scheme" in app.json
});

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: redirectUri, skipBrowserRedirect: true },
  });

  if (error) { Alert.alert("Error", error.message); setLoading(false); return; }

  const result = await WebBrowser.openAuthSessionAsync(
  data.url, 
  redirectUri,
  {
    // These options help prevent the "Failed to launch" error
    showInRecents: true,
  }
);

  if (result.type === 'success') {
    const { url } = result;
    const { params } = QueryParams.getQueryParams(url);
    const { access_token, refresh_token } = params;

    // This is the trigger that saves the session to AsyncStorage
    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
    
    if (error) Alert.alert("Auth Error", error.message);
    // No need to redirect manually! Your _layout.tsx listener will see the 
    // session update and redirect automatically.
  }
  setLoading(false);
};

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
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
              editable={!loading} // Disable inputs during network operations
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
                editable={!loading}
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

          {/* --- Updated Forgot Password Container --- */}
          <Pressable
            onPress={handleForgotPassword}
            disabled={loading}
            style={({ pressed }) => [
              styles.forgotPasswordContainer,
              pressed && { opacity: 0.6 }
            ]}
          >
            <Text style={styles.forgotPasswordText}>
              Forgot Password?
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={handleLogin}
          disabled={loading}
          style={({ pressed }) => [
            styles.loginButton,
            (pressed || loading) && styles.loginButtonPressed,
          ]}
        >
          <Text style={styles.loginButtonText}>
            {loading ? "Please wait..." : "Log In"}
          </Text>
        </Pressable>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialContainer}>
          <Pressable
            onPress={handleFacebookLogin}
            disabled={loading}
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

          <Pressable
            onPress={handleGoogleLogin}
            disabled={loading}
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

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Don't have an account?
          </Text>
          <Pressable onPress={() => router.replace("/signup")} disabled={loading}>
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