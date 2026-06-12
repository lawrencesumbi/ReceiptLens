import { Ionicons } from "@expo/vector-icons";
import base64js from "base64-js";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing"; // Gidugang para sa Export Data share prompt
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
  Text,
  TextInput,
  UIManager,
  View,
} from "react-native";
import { supabase } from "../../utils/supabase";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function Profile() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null); 
  const [theme, setTheme] = useState("system");
  const [language, setLanguage] = useState("ceb"); // Default to Cebuano
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

  // --- FUNCTION PARA SA PAG-PICK UG PAG-UPLOAD OG PROFILE PICTURE ---
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
    if (!password || password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: password });
    setLoading(false);

    if (error) {
      Alert.alert("Update Failed", error.message);
    } else {
      Alert.alert("Success", "Your password has been securely updated.");
      setPassword(""); 
      setExpandedSection(null);
    }
  };

  // --- FUNCTION PARA SA EXPORT DATA (CSV GENERATOR & SHARE) ---
  const handleExportData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user found.");

      // Pagkuha sa tanang transactions sa user
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("created_at, merchant, amount, category, payment_method")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!transactions || transactions.length === 0) {
        Alert.alert("Export Data", "Wala kay transaksyon nga pwedeng i-export karon.");
        return;
      }

      // Pag-construct sa CSV String content
      let csvContent = "Date,Merchant,Amount,Category,Payment Method\n";
      transactions.forEach((tx) => {
        const dateStr = tx.created_at ? new Date(tx.created_at).toLocaleDateString() : "";
        const merchantClean = tx.merchant ? `"${tx.merchant.replace(/"/g, '""')}"` : "Unknown";
        const categoryClean = tx.category ? `"${tx.category.replace(/"/g, '""')}"` : "";
        csvContent += `${dateStr},${merchantClean},${tx.amount || 0},${categoryClean},${tx.payment_method || ""}\n`;
      });

      // Pag-save sa file ngadto sa temporary local storage sa phone
      const fileUri = `${FileSystem.documentDirectory}Payton_Transactions_Export.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: "utf8" });

      // Trigger sa standard share layout dialog window sa operating system
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Export Data", `Na-save na ang imong file sa: ${fileUri}`);
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
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.headerTitle}>Account Settings</Text>

        {/* --- Profile Header Avatar Block --- */}
        <View style={styles.profileHeaderCard}>
          <Pressable style={styles.avatarContainer} onPress={handlePickAvatar} disabled={loading}>
            <View style={styles.avatarCircle}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
              ) : (
                <Ionicons name="person" size={32} color="#ffffff" />
              )}
            </View>
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={10} color="#ffffff" />
            </View>
          </Pressable>

          <View style={styles.profileInfoTextContainer}>
            <Text style={styles.userEmailText}>{fullName || email || "Active User"}</Text>
            {fullName ? <Text style={styles.userSubEmailText}>{email}</Text> : null}
            
          </View>
        </View>

        {/* --- Main Settings Container --- */}
        <View style={styles.settingsGroupCard}>
          
          {/* 1. Account Information */}
          <View style={styles.rowWrapper}>
            <Pressable style={styles.menuRow} onPress={() => toggleSection("profile")}>
              <View style={styles.rowLeft}>
                <Ionicons name="person-outline" size={22} color="#111111" />
                <Text style={styles.rowTitle}>Account Information</Text>
              </View>
              <Ionicons 
                name={expandedSection === "profile" ? "chevron-down" : "chevron-forward"} 
                size={18} 
                color="#8E8E93" 
              />
            </Pressable>
            
            {expandedSection === "profile" && (
              <View style={styles.expandedContent}>
                <TextInput
                  placeholder="Enter your full name"
                  placeholderTextColor="#aaa"
                  value={fullName}
                  onChangeText={setFullName}
                  style={styles.input}
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
          <View style={styles.rowWrapper}>
            <Pressable style={styles.menuRow} onPress={() => toggleSection("password")}>
              <View style={styles.rowLeft}>
                <Ionicons name="key-outline" size={22} color="#111111" />
                <Text style={styles.rowTitle}>Change Password</Text>
              </View>
              <Ionicons 
                name={expandedSection === "password" ? "chevron-down" : "chevron-forward"} 
                size={18} 
                color="#8E8E93" 
              />
            </Pressable>

            {expandedSection === "password" && (
              <View style={styles.expandedContent}>
                <TextInput
                  placeholder="Enter new secure password"
                  placeholderTextColor="#aaa"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  style={styles.input}
                />
                <Pressable 
                  onPress={handleUpdatePassword}
                  disabled={loading}
                  style={[styles.actionButton, styles.passwordButtonColor, loading && styles.disabledButton]}
                >
                  <Text style={styles.buttonText}>Update Password</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* 3. Appearance */}
          <View style={styles.rowWrapper}>
            <Pressable style={styles.menuRow} onPress={() => toggleSection("appearance")}>
              <View style={styles.rowLeft}>
                <Ionicons name="sunny-outline" size={22} color="#111111" />
                <Text style={styles.rowTitle}>Appearance</Text>
              </View>
              <Ionicons 
                name={expandedSection === "appearance" ? "chevron-down" : "chevron-forward"} 
                size={18} 
                color="#8E8E93" 
              />
            </Pressable>

            {expandedSection === "appearance" && (
              <View style={styles.expandedContent}>
                <View style={styles.segmentedControl}>
                  <Pressable 
                    style={[styles.segment, theme === "light" && styles.activeSegment]} 
                    onPress={() => setTheme("light")}
                  >
                    <Text style={[styles.segmentText, theme === "light" && styles.activeSegmentText]}>Light</Text>
                  </Pressable>
                  <Pressable 
                    style={[styles.segment, theme === "dark" && styles.activeSegment]} 
                    onPress={() => setTheme("dark")}
                  >
                    <Text style={[styles.segmentText, theme === "dark" && styles.activeSegmentText]}>Dark</Text>
                  </Pressable>
                  <Pressable 
                    style={[styles.segment, theme === "system" && styles.activeSegment]} 
                    onPress={() => setTheme("system")}
                  >
                    <Text style={[styles.segmentText, theme === "system" && styles.activeSegmentText]}>System</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          {/* 4. Language */}
          <View style={styles.rowWrapper}>
            <Pressable style={styles.menuRow} onPress={() => toggleSection("language")}>
              <View style={styles.rowLeft}>
                <Ionicons name="language-outline" size={22} color="#111111" />
                <Text style={styles.rowTitle}>Language</Text>
              </View>
              <Ionicons 
                name={expandedSection === "language" ? "chevron-down" : "chevron-forward"} 
                size={18} 
                color="#8E8E93" 
              />
            </Pressable>

            {expandedSection === "language" && (
              <View style={styles.expandedContent}>
                <View style={styles.segmentedControl}>
                  <Pressable 
                    style={[styles.segment, language === "en" && styles.activeSegment]} 
                    onPress={() => setLanguage("en")}
                  >
                    <Text style={[styles.segmentText, language === "en" && styles.activeSegmentText]}>English</Text>
                  </Pressable>
                  <Pressable 
                    style={[styles.segment, language === "ceb" && styles.activeSegment]} 
                    onPress={() => setLanguage("ceb")}
                  >
                    <Text style={[styles.segmentText, language === "ceb" && styles.activeSegmentText]}>Cebuano</Text>
                  </Pressable>
                  <Pressable 
                    style={[styles.segment, language === "tl" && styles.activeSegment]} 
                    onPress={() => setLanguage("tl")}
                  >
                    <Text style={[styles.segmentText, language === "tl" && styles.activeSegmentText]}>Tagalog</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          {/* 5. Export Data */}
          <View style={styles.rowWrapper}>
            <Pressable style={styles.menuRow} onPress={() => toggleSection("export")}>
              <View style={styles.rowLeft}>
                <Ionicons name="download-outline" size={22} color="#111111" />
                <Text style={styles.rowTitle}>Export Data</Text>
              </View>
              <Ionicons 
                name={expandedSection === "export" ? "chevron-down" : "chevron-forward"} 
                size={18} 
                color="#8E8E93" 
              />
            </Pressable>

            {expandedSection === "export" && (
              <View style={styles.expandedContent}>
                <Text style={styles.descriptionText}>
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

          {/* 6. About */}
          <View style={[styles.rowWrapper, { borderBottomWidth: 0 }]}>
            <Pressable style={styles.menuRow} onPress={() => toggleSection("about")}>
              <View style={styles.rowLeft}>
                <Ionicons name="information-circle-outline" size={22} color="#111111" />
                <Text style={styles.rowTitle}>About</Text>
              </View>
              <Ionicons 
                name={expandedSection === "about" ? "chevron-down" : "chevron-forward"} 
                size={18} 
                color="#8E8E93" 
              />
            </Pressable>

            {expandedSection === "about" && (
              <View style={styles.expandedContent}>
                <View style={styles.aboutContent}>
                  <View style={styles.aboutRow}>
                    <Text style={styles.aboutLabel}>Application</Text>
                    <Text style={styles.aboutValue}>ReceiptLens</Text>
                  </View>
                  <View style={styles.aboutRow}>
                    <Text style={styles.aboutLabel}>Version</Text>
                    <Text style={styles.aboutValue}>1.0.0 (Beta)</Text>
                  </View>
                  <View style={styles.aboutRow}>
                    <Text style={styles.aboutLabel}>Powered By</Text>
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
          <Text style={styles.logoutText}>Log Out from Payton</Text>
        </Pressable>

      </ScrollView>

      {loading && (
        <View style={styles.loadingVeil}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 15,
    paddingBottom: 120,
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: "700", 
    color: "#111111", 
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  profileHeaderCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row", // Gi-row para ma-left side ang pic ug right side ang text details
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    marginBottom: 25,
    gap: 18, // Saktong distansya tali sa avatar ug sa text block
  },
  avatarContainer: {
    position: "relative",
    // Gikuhaan gamay og margin kay row na ang iyang alignment flow
  },
  avatarCircle: {
    width: 68, // Gi-adjust gamay ang gidak-on para proportional sa row container look
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
    borderColor: "#ffffff",
  },
  profileInfoTextContainer: {
    flex: 1, // Mo-occupy sa tibuok nahabiling space sa right side nga hapsay
    flexDirection: "column",
    justifyContent: "center",
  },
  userEmailText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111111",
    letterSpacing: -0.3,
  },
  userSubEmailText: {
    fontSize: 13,
    color: "#666666",
    marginTop: 2,
  },
  badgeWrapperRow: {
    flexDirection: "row", // Nagsiguro nga ang badge dili mo-stretch og full width sa right layout container bounds
    marginTop: 8,
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: "600",
    color: "#34C759",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: "hidden",
  },
  settingsGroupCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    marginBottom: 25,
    overflow: "hidden",
  },
  rowWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F3F6",
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
    color: "#1F1F29",
  },
  expandedContent: {
    paddingBottom: 18,
    paddingHorizontal: 4,
  },
  descriptionText: {
    fontSize: 13,
    color: "#666666",
    lineHeight: 18,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    backgroundColor: "#f9f9f9",
    color: "#111111",
    marginBottom: 12,
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
    backgroundColor: "#F1F1F6",
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
    backgroundColor: "#ffffff",
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
  activeSegmentText: {
    color: "#111111",
  },
  aboutContent: {
    gap: 8,
    backgroundColor: "#F8F9FA",
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
    color: "#666666",
    fontWeight: "500",
  },
  aboutValue: {
    fontSize: 13,
    color: "#111111",
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
    backgroundColor: "#ffffff",
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
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
});