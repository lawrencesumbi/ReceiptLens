import { Ionicons } from "@expo/vector-icons";
import base64js from "base64-js";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  UIManager,
} from "react-native";

import { Text, TextInput, View } from "../../components/Themed";
import { useTheme } from "../../context/ThemeContext"; // 💡 Imported the theme hook
import { supabase } from "../../utils/supabase";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function Profile() {
  const router = useRouter();
  const { colors, theme: activeTheme, setTheme: setActiveTheme } = useTheme(); // 💡 Consume dynamic values
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false); 
  const [showNewPassword, setShowNewPassword] = useState(false); 
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null); 
  const [language, setLanguage] = useState("ceb"); 
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || "");
        setFullName(user.user_metadata?.full_name || "");
        setAvatarUrl(user.user_metadata?.avatar_url || null); 
      }
    };
    fetchUser();
  }, []);

  const handlePickAvatar = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Denied", "You need to allow gallery access to update your profile picture.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], 
      quality: 0.5, 
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const pickedImage = result.assets[0];
      await uploadAvatar(pickedImage.uri);
    }
  };

  const uploadAvatar = async (fileUri: string) => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user logged in.");

      const base64Data = await FileSystem.readAsStringAsync(fileUri, {
        encoding: "base64",
      });

      const arrayBuffer = base64js.toByteArray(base64Data);
      const fileExt = fileUri.split('.').pop()?.toLowerCase() || "jpg";
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt === "png" ? "png" : "jpeg"}`,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      Alert.alert("Success", "Profile picture updated successfully!");
    } catch (error: any) {
      console.error("Detailed upload error:", error);
      Alert.alert("Upload Error", error.message || "Something went wrong during the upload.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  const handleUpdateProfileData = async () => {
    if (!fullName.trim()) {
      Alert.alert("Error", "Please enter your full name.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName.trim() }
    });
    setLoading(false);

    if (error) {
      Alert.alert("Update Failed", error.message);
    } else {
      Alert.alert("Success", "Your profile name has been updated successfully!");
      setExpandedSection(null);
    }
  };

  const handleUpdatePassword = async () => {
    if (!oldPassword) {
      Alert.alert("Error", "Please enter your old password.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      Alert.alert("Error", "New password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    
    // Step 1: Verify the old password by re-authenticating the email
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: oldPassword,
    });

    if (signInError) {
      setLoading(false);
      Alert.alert("Authentication Failed", "The old password you entered is incorrect.");
      return;
    }

    // Step 2: Update to the new secure password
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (updateError) {
      Alert.alert("Update Failed", updateError.message);
    } else {
      Alert.alert("Success", "Your password has been securely updated. You will now be logged out.", [
        {
          text: "OK",
          onPress: async () => {
            setLoading(true);
            await supabase.auth.signOut();
            setLoading(false);
            setOldPassword(""); 
            setNewPassword(""); 
            setExpandedSection(null);
            router.replace("/login");
          }
        }
      ]);
    }
  };

  const handleExportData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user found.");

      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("created_at, merchant, amount, category, payment_method")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!transactions || transactions.length === 0) {
        Alert.alert("Export Data", "You don't have any transactions to export right now.");
        return;
      }

      let csvContent = "Date,Merchant,Amount,Category,Payment Method\n";
      transactions.forEach((tx) => {
        const dateStr = tx.created_at ? new Date(tx.created_at).toLocaleDateString() : "";
        const merchantClean = tx.merchant ? `"${tx.merchant.replace(/"/g, '""')}"` : "Unknown";
        const categoryClean = tx.category ? `"${tx.category.replace(/"/g, '""')}"` : "";
        csvContent += `${dateStr},${merchantClean},${tx.amount || 0},${categoryClean},${tx.payment_method || ""}\n`;
      });

      const fileUri = `${FileSystem.documentDirectory}Payton_Transactions_Export.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: "utf8" });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Export Data", `File saved to: ${fileUri}`);
      }
    } catch (err: any) {
      console.error("Export error:", err);
      Alert.alert("Export Failed", err.message || "Something went wrong while exporting your data.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace("/login");
        },
      },
    ]);
  };

  return (
    <View style={styles.container} themeColorType="background">
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.headerTitle}>Account Settings</Text>

        {/* --- Profile Header Avatar Block --- */}
        <View style={[styles.profileHeaderCard, { borderColor: colors.border, borderWidth: 0 }]} themeColorType="card">
          <Pressable style={styles.avatarContainer} onPress={handlePickAvatar} disabled={loading}>
            <View style={styles.avatarCircle}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
              ) : (
                <Ionicons name="person" size={32} color="#ffffff" />
              )}
            </View>
            <View style={[styles.cameraBadge, { borderColor: colors.card }]}>
              <Ionicons name="camera" size={10} color="#ffffff" />
            </View>
          </Pressable>

          <View style={styles.profileInfoTextContainer} themeColorType="card">
            <Text style={styles.userEmailText}>{fullName || email || "Active User"}</Text>
            {fullName ? <Text style={[styles.userSubEmailText, { color: colors.text + '99' }]}>{email}</Text> : null}
          </View>
        </View>

        {/* --- Main Settings Container --- */}
        <View style={[styles.settingsGroupCard, { borderColor: colors.border,borderWidth: 0 }]} themeColorType="card">
          
          {/* 1. Account Information */}
          <View style={[styles.rowWrapper, { borderBottomColor: colors.border }]}themeColorType="card" >
            <Pressable style={styles.menuRow} onPress={() => toggleSection("profile")}>
              <View style={styles.rowLeft} themeColorType="card">
                <Ionicons name="person-outline" size={22} color={colors.text} />
                <Text style={styles.rowTitle}>Account Information</Text>
              </View>
              <Ionicons 
                name={expandedSection === "profile" ? "chevron-down" : "chevron-forward"} 
                size={18} 
                color={colors.text + '60'} 
              />
            </Pressable>
            
            {expandedSection === "profile" && (
              <View style={styles.expandedContent} themeColorType="card" >
                <TextInput
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.text + '60'}
                  value={fullName}
                  onChangeText={setFullName}
                  style={[styles.input, { borderColor: colors.border, marginBottom: 12 }]}
                />
                <Pressable 
                  onPress={handleUpdateProfileData} 
                  disabled={loading}
                  style={[styles.actionButton, styles.nameButtonColor, loading && styles.disabledButton]}
                >
                  <Text style={styles.buttonText}>Update Full Name</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* 2. Change Password */}
          <View style={[styles.rowWrapper, { borderBottomColor: colors.border }]} themeColorType="card">
            <Pressable style={styles.menuRow} onPress={() => toggleSection("password")}>
              <View style={styles.rowLeft} themeColorType="card">
                <Ionicons name="key-outline" size={22} color={colors.text} />
                <Text style={styles.rowTitle}>Change Password</Text>
              </View>
              <Ionicons 
                name={expandedSection === "password" ? "chevron-down" : "chevron-forward"} 
                size={18} 
                color={colors.text + '60'} 
              />
            </Pressable>

            {expandedSection === "password" && (
              <View style={styles.expandedContent} themeColorType="card">
                
                {/* Old Password Input */}
                <View style={styles.passwordInputContainer} themeColorType="card">
                  <TextInput
                    placeholder="Enter old password"
                    placeholderTextColor={colors.text + '60'}
                    value={oldPassword}
                    onChangeText={setOldPassword}
                    secureTextEntry={!showOldPassword}
                    style={[styles.input, { marginBottom: 0, paddingRight: 45, borderColor: colors.border }]}
                  />
                  <Pressable 
                    style={styles.eyeIconContainer} 
                    onPress={() => setShowOldPassword(!showOldPassword)}
                  >
                    <Ionicons 
                      name={showOldPassword ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color={colors.text + '80'} 
                    />
                  </Pressable>
                </View>

                {/* New Password Input */}
                <View style={[styles.passwordInputContainer, { marginTop: 12 }]} themeColorType="card">
                  <TextInput
                    placeholder="Enter new password"
                    placeholderTextColor={colors.text + '60'}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    style={[styles.input, { marginBottom: 0, paddingRight: 45, borderColor: colors.border }]}
                  />
                  <Pressable 
                    style={styles.eyeIconContainer} 
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    <Ionicons 
                      name={showNewPassword ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color={colors.text + '80'} 
                    />
                  </Pressable>
                </View>

                <Pressable 
                  onPress={handleUpdatePassword}
                  disabled={loading}
                  style={[styles.actionButton, styles.passwordButtonColor, { marginTop: 12 }, loading && styles.disabledButton]}
                >
                  <Text style={styles.buttonText}>Update Password</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* 3. Appearance */}
          <View style={[styles.rowWrapper, { borderBottomColor: colors.border }]} themeColorType="card">
            <Pressable style={styles.menuRow} onPress={() => toggleSection("appearance")}>
              <View style={styles.rowLeft} themeColorType="card">
                <Ionicons name="sunny-outline" size={22} color={colors.text} />
                <Text style={styles.rowTitle}>Appearance</Text>
              </View>
              <Ionicons 
                name={expandedSection === "appearance" ? "chevron-down" : "chevron-forward"} 
                size={18} 
                color={colors.text + '60'} 
              />
            </Pressable>

            {expandedSection === "appearance" && (
              <View style={styles.expandedContent} themeColorType="card">
                <View style={[styles.segmentedControl, { backgroundColor: colors.border }]}>
                  <Pressable 
                    style={[styles.segment, activeTheme === "light" && [styles.activeSegment, { backgroundColor: colors.card }]]} 
                    onPress={() => setActiveTheme("light")}
                  >
                    <Text style={[styles.segmentText, activeTheme === "light" && { color: colors.text }]}>Light</Text>
                  </Pressable>
                  <Pressable 
                    style={[styles.segment, activeTheme === "dark" && [styles.activeSegment, { backgroundColor: colors.card }]]} 
                    onPress={() => setActiveTheme("dark")}
                  >
                    <Text style={[styles.segmentText, activeTheme === "dark" && { color: colors.text }]}>Dark</Text>
                  </Pressable>
                  <Pressable 
                    style={[styles.segment, activeTheme === "system" && [styles.activeSegment, { backgroundColor: colors.card }]]} 
                    onPress={() => setActiveTheme("system")}
                  >
                    <Text style={[styles.segmentText, activeTheme === "system" && { color: colors.text }]}>System</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          

          {/* 4. Export Data */}
          <View style={[styles.rowWrapper, { borderBottomColor: colors.border }]} themeColorType="card">
            <Pressable style={styles.menuRow} onPress={() => toggleSection("export")}>
              <View style={styles.rowLeft} themeColorType="card">
                <Ionicons name="download-outline" size={22} color={colors.text} />
                <Text style={styles.rowTitle}>Export Data</Text>
              </View>
              <Ionicons 
                name={expandedSection === "export" ? "chevron-down" : "chevron-forward"} 
                size={18} 
                color={colors.text + '60'} 
              />
            </Pressable>

            {expandedSection === "export" && (
              <View style={styles.expandedContent} themeColorType="card">
                <Text style={[styles.descriptionText, { color: colors.text + 'b3' }]}>
                  Download the complete list of your transactions and expenses into a structured CSV spreadsheet file.
                </Text>
                <Pressable 
                  onPress={handleExportData} 
                  disabled={loading}
                  style={[styles.actionButton, styles.exportButtonColor, loading && styles.disabledButton]}
                >
                  <Ionicons name="cloud-download-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.buttonText}>Generate & Share CSV</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* 5. About */}
          <View style={[styles.rowWrapper, { borderBottomWidth: 0 }]}themeColorType="card" >
            <Pressable style={styles.menuRow} onPress={() => toggleSection("about")}>
              <View style={styles.rowLeft} themeColorType="card">
                <Ionicons name="information-circle-outline" size={22} color={colors.text} />
                <Text style={styles.rowTitle}>About</Text>
              </View>
              <Ionicons 
                name={expandedSection === "about" ? "chevron-down" : "chevron-forward"} 
                size={18} 
                color={colors.text + '60'} 
              />
            </Pressable>

            {expandedSection === "about" && (
              <View style={styles.expandedContent} themeColorType="card">
                <View style={[styles.aboutContent, { backgroundColor: colors.card + '50' }]}>
                  <View style={styles.aboutRow} themeColorType="card">
                    <Text style={[styles.aboutLabel, { color: colors.text + '99' }]}>Application</Text>
                    <Text style={styles.aboutValue}>Payton</Text>
                  </View>
                  <View style={styles.aboutRow} themeColorType="card">
                    <Text style={[styles.aboutLabel, { color: colors.text + '99' }]}>Version</Text>
                    <Text style={styles.aboutValue}>1.0.0 (Beta)</Text>
                  </View>
                  <View style={styles.aboutRow} themeColorType="card">
                    <Text style={[styles.aboutLabel, { color: colors.text + '99' }]}>Powered By</Text>
                    <Text style={styles.aboutValue}>Supabase & Expo</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

        </View>

        {/* Danger Zone / Logout Action */}
        <Pressable 
          onPress={handleLogout}
          style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>

      </ScrollView>

      {loading && (
        <View style={[styles.loadingVeil, { backgroundColor: colors.background + 'B3' }]}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 45,
    paddingBottom: 10,
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: "700", 
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  profileHeaderCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: "row", 
    alignItems: "center",
    borderWidth: 1,
    marginBottom: 25,
    gap: 18, 
  },
  avatarContainer: {
    position: "relative",
  },
  avatarCircle: {
    width: 68, 
    height: 68,
    borderRadius: 34,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden", 
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  cameraBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#007AFF",
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  profileInfoTextContainer: {
    flex: 1, 
    flexDirection: "column",
    justifyContent: "center",
  },
  textRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  userEmailText: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  userSubEmailText: {
    fontSize: 13,
    marginTop: 2,
  },
  settingsGroupCard: {
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    marginBottom: 25,
    overflow: "hidden",
  },
  rowWrapper: {
    borderBottomWidth: 1,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "500",
  },
  expandedContent: {
    paddingBottom: 18,
    paddingHorizontal: 4,
  },
  passwordInputContainer: {
    position: "relative",
    justifyContent: "center",
  },
  eyeIconContainer: {
    position: "absolute",
    right: 14,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  actionButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  nameButtonColor: {
    backgroundColor: "#4CAF50",
  },
  passwordButtonColor: {
    backgroundColor: "#6366F1",
  },
  exportButtonColor: {
    backgroundColor: "#0284C7",
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  segmentedControl: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  activeSegment: {
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666666",
  },
  aboutContent: {
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  aboutLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  aboutValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#FF3B30",
    borderRadius: 14,
    paddingVertical: 14,
  },
  logoutButtonPressed: {
    backgroundColor: "#FFEBEB",
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FF3B30",
  },
  loadingVeil: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
});