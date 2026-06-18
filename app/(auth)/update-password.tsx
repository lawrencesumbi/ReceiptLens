import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { supabase } from "../../utils/supabase"; // Siguroha nga sakto ang path

export default function UpdatePassword() {
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isReadyToUpdate, setIsReadyToUpdate] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Paminawon sa app kung gikan ba ka sa usa ka PASSWORD_RECOVERY nga link
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth Event Na-trigger:", event);
      
      if (event === "PASSWORD_RECOVERY" || session) {
        // Kon nakita sa Supabase ang session gikan sa link, tugutan na siya mag-update
        setIsReadyToUpdate(true);
      }
    });

    // Susiha usab kung daan na ba nga naay session nga napasa sa background
    const checkCurrentSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setIsReadyToUpdate(true);
      }
    };
    checkCurrentSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleUpdatePassword = async () => {
    if (!isReadyToUpdate) {
      Alert.alert("Error", "Dili pa pwede mausab ang password. Siguroha nga ni-click ka sa link gikan sa email.");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    
    // Karon, kay gi-validate na sa listener ang session, mogana na kini
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Success", "Nailisan na ang imong password!", [
        { 
          text: "Log In Karon", 
          onPress: async () => {
            await supabase.auth.signOut(); // Limpyohan ang recovery session
            router.replace("/login"); 
          } 
        }
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create New Password</Text>
      
      {!isReadyToUpdate && (
        <Text style={styles.warningText}>
          Nag-verify pa sa imong link... Palihug hulata kadiyot.
        </Text>
      )}

      <TextInput
        placeholder="Enter new password"
        placeholderTextColor="#aaa"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
        style={styles.input}
        editable={!loading && isReadyToUpdate}
      />
      <Pressable 
        onPress={handleUpdatePassword} 
        disabled={loading || !isReadyToUpdate} 
        style={[
          styles.button, 
          (loading || !isReadyToUpdate) && { opacity: 0.5 }
        ]}
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
  warningText: { color: "#E63946", fontSize: 14, marginBottom: 15, fontWeight: "500" },
  input: { borderWidth: 1, borderColor: "#e0e0e0", borderRadius: 12, padding: 14, fontSize: 16, backgroundColor: "#f9f9f9", marginBottom: 20 },
  button: { backgroundColor: "#007AFF", padding: 14, borderRadius: 25, alignItems: "center" },
  buttonText: { color: "white", fontSize: 16, fontWeight: "600" }
});