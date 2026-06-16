import { useTheme } from "@/context/ThemeContext"; // 💡 Gi-consume imong Theme Hook
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../utils/supabase";

interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  category: string;
  created_at: string;
}

type TrackingPeriod = "weekly" | "monthly";

export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme(); // 💡 Gi-extract ang values para sa dark utility mapping
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Developer");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [totalSpent, setTotalSpent] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  
  const [trackingPeriod, setTrackingPeriod] = useState<TrackingPeriod>("monthly");
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchHomeData = async (period: TrackingPeriod = trackingPeriod) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const emailName = user.email?.split("@")[0] || "User";
      setUserName(user.user_metadata?.full_name || emailName.charAt(0).toUpperCase() + emailName.slice(1));
      setAvatarUrl(user.user_metadata?.avatar_url || null);

      const now = new Date();
      let filterStartDate = new Date();

      if (period === "weekly") {
        const currentDay = now.getDay(); 
        filterStartDate.setDate(now.getDate() - currentDay);
        filterStartDate.setHours(0, 0, 0, 0);
      } else {
        filterStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("id, merchant, amount, category, created_at")
        .eq("user_id", user.id)
        .gte("created_at", filterStartDate.toISOString()) 
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (transactions) {
        setRecentTransactions(transactions.slice(0, 3));
        const total = transactions.reduce((sum, item) => sum + (item.amount || 0), 0);
        setTotalSpent(total);
      }
    } catch (e) {
      console.error("Error loading filtered dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData(trackingPeriod);
  }, [trackingPeriod]);

  const togglePeriodSelection = (period: TrackingPeriod) => {
    setTrackingPeriod(period);
    setShowDropdown(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Food & Drinks": return "fast-food-outline";
      case "Utilities": return "water-outline";
      case "Shopping": return "cart-outline";
      case "Transportation": return "car-outline";
      default: return "receipt-outline";
    }
  };

  if (loading && !showDropdown) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary || "#007AFF"} />
        <Text style={[styles.loadingText, { color: colors.text + "99" }]}>Updating Data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* 1. GREETING HEADER */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.subGreeting, { color: colors.text + "80" }]}>Welcome Back,</Text>
            <Text style={[styles.mainGreeting, { color: colors.text }]}>{userName}! 👋</Text>
          </View>
          
          <Pressable style={styles.profileBadge} onPress={() => router.push("/profile")}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarFallbackCircle, { backgroundColor: colors.primary || "#007AFF" }]}>
                <Ionicons name="person" size={18} color="#ffffff" />
              </View>
            )}
          </Pressable>
        </View>

        {/* 2. BENTO MAIN WALLET / SUMMARY CARD */}
        <View style={[styles.walletCard, { backgroundColor: colors.primary || "#007AFF" }]}>
          <View style={styles.walletHeader}>
            
            {/* DROPDOWN TRIGGER BUTTON */}
            <Pressable style={styles.dropdownTrigger} onPress={() => setShowDropdown(!showDropdown)}>
              <Text style={styles.walletTitle}>
                {trackingPeriod === "weekly" ? "Weekly" : "Monthly"} Expense Tracker
              </Text>
              <Ionicons 
                name={showDropdown ? "chevron-up" : "chevron-down"} 
                size={14} 
                color="#FFFFFF" 
                style={{ opacity: 0.9 }} 
              />
            </Pressable>

            <Ionicons name="wallet-outline" size={20} color="#FFFFFF" style={{ opacity: 0.8 }} />
          </View>

          {/* FLOATING DROPDOWN LIST OPTION BOX */}
          {showDropdown && (
            <View style={[styles.dropdownMenuBox, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: isDark ? 1 : 0 }]}>
              <Pressable 
                style={[styles.dropdownItem, trackingPeriod === "weekly" && { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#F0F7FF" }]}
                onPress={() => togglePeriodSelection("weekly")}
              >
                <Ionicons name="calendar-outline" size={16} color={trackingPeriod === "weekly" ? (colors.primary || "#007AFF") : (colors.text + "99")} />
                <Text style={[styles.dropdownItemText, { color: colors.text }, trackingPeriod === "weekly" && { color: colors.primary || "#007AFF", fontWeight: "600" }]}>Weekly Tracking</Text>
              </Pressable>
              
              <View style={[styles.dropdownDivider, { backgroundColor: colors.border }]} />

              <Pressable 
                style={[styles.dropdownItem, trackingPeriod === "monthly" && { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#F0F7FF" }]}
                onPress={() => togglePeriodSelection("monthly")}
              >
                <Ionicons name="apps-outline" size={16} color={trackingPeriod === "monthly" ? (colors.primary || "#007AFF") : (colors.text + "99")} />
                <Text style={[styles.dropdownItemText, { color: colors.text }, trackingPeriod === "monthly" && { color: colors.primary || "#007AFF", fontWeight: "600" }]}>Monthly Tracking</Text>
              </Pressable>
            </View>
          )}

          <Text style={styles.walletAmount}>
            ₱{totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
          
          <View style={styles.walletFooter}>
            <View style={styles.liveIndicatorContainer}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>
                Showing records for this {trackingPeriod === "weekly" ? "week" : "month"}
              </Text>
            </View>
          </View>
        </View>

        {/* 3. QUICK ACTIONS GRID SECTION */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <Pressable style={[styles.actionButton, { backgroundColor: colors.card }]} onPress={() => router.push("/scan")}>
            <View style={[styles.actionIconCircle, { backgroundColor: isDark ? "rgba(0,122,255,0.15)" : "#EEF7FF" }]}>
              <Ionicons name="camera" size={24} color="#007AFF" />
            </View>
            <Text style={[styles.actionLabel, { color: colors.text + "E6" }]}>Scan Receipt</Text>
          </Pressable>

          <Pressable style={[styles.actionButton, { backgroundColor: colors.card }]} onPress={() => router.push("/analytics")}>
            <View style={[styles.actionIconCircle, { backgroundColor: isDark ? "rgba(88,86,214,0.15)" : "#F5EEFF" }]}>
              <Ionicons name="bar-chart" size={24} color="#5856D6" />
            </View>
            <Text style={[styles.actionLabel, { color: colors.text + "E6" }]}>Analytics</Text>
          </Pressable>

          <Pressable style={[styles.actionButton, { backgroundColor: colors.card }]} onPress={() => fetchHomeData(trackingPeriod)}>
            <View style={[styles.actionIconCircle, { backgroundColor: isDark ? "rgba(52,199,89,0.15)" : "#EFFFFA" }]}>
              <Ionicons name="refresh" size={24} color="#34C759" />
            </View>
            <Text style={[styles.actionLabel, { color: colors.text + "E6" }]}>Refresh</Text>
          </Pressable>
        </View>

        {/* 4. RECENT TRANSACTIONS ACTIVITY */}
        <View style={styles.recentSectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
          <Pressable onPress={() => router.push("/transaction")}>
            <Text style={[styles.viewAllText, { color: colors.primary || "#007AFF" }]}>View All</Text>
          </Pressable>
        </View>

        {recentTransactions.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
            <Ionicons name="duplicate-outline" size={44} color={colors.text + "33"} />
            <Text style={[styles.emptyText, { color: colors.text + "80" }]}>No logs found for this period. Scan a receipt to begin tracking!</Text>
          </View>
        ) : (
          recentTransactions.map((item) => (
            <View key={item.id} style={[styles.transactionItemCard, { backgroundColor: colors.card }]}>
              <View style={styles.itemLeftGroup}>
                <View style={[styles.itemIconBox, { backgroundColor: colors.background }]}>
                  <Ionicons name={getCategoryIcon(item.category)} size={22} color={colors.text + "CC"} />
                </View>
                <View style={styles.itemMeta}>
                  <Text style={[styles.itemMerchantTitle, { color: colors.text }]} numberOfLines={1}>{item.merchant}</Text>
                  <Text style={[styles.itemCategorySub, { color: colors.text + "80" }]}>{item.category}</Text>
                </View>
              </View>
              <Text style={styles.itemCostValue}>- ₱{item.amount.toFixed(2)}</Text>
            </View>
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { padding: 20 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 14 },

  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  subGreeting: { fontSize: 14, fontWeight: "500" },
  mainGreeting: { fontSize: 26, fontWeight: "700", marginTop: 2 },
  
  profileBadge: { width: 40, height: 40, borderRadius: 20, overflow: "hidden" },
  avatarImage: { width: "100%", height: "100%" },
  avatarFallbackCircle: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },

  walletCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 26,
    position: "relative", 
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  walletHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 30,
    gap: 6,
  },
  walletTitle: { 
    color: "#FFFFFF", 
    fontSize: 12, 
    fontWeight: "700", 
    textTransform: "uppercase", 
    letterSpacing: 0.5 
  },
  dropdownMenuBox: {
    position: "absolute",
    top: 55,
    left: 24,
    borderRadius: 14,
    width: 180,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 99,
    padding: 4,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  dropdownItemText: {
    fontSize: 13,
    fontWeight: "500",
  },
  dropdownDivider: {
    height: 1,
    marginVertical: 2,
  },

  walletAmount: { color: "#FFFFFF", fontSize: 36, fontWeight: "700", marginTop: 16, marginBottom: 16 },
  walletFooter: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.2)", paddingTop: 12 },
  liveIndicatorContainer: { flexDirection: "row", alignItems: "center" },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#34C759", marginRight: 6 },
  liveText: { color: "#FFFFFF", fontSize: 12, fontWeight: "500", opacity: 0.9 },

  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 14 },
  recentSectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, marginBottom: 12 },
  viewAllText: { fontSize: 14, fontWeight: "600" },

  actionsGrid: { flexDirection: "row", justifyContent: "space-between", marginBottom: 26, gap: 12 },
  actionButton: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  actionIconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  actionLabel: { fontSize: 12, fontWeight: "600" },

  transactionItemCard: {
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.01,
    shadowRadius: 3,
    elevation: 1,
  },
  itemLeftGroup: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  itemIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  itemMeta: { flex: 1 },
  itemMerchantTitle: { fontSize: 15, fontWeight: "600" },
  itemCategorySub: { fontSize: 12, marginTop: 2, fontWeight: "500" },
  itemCostValue: { fontSize: 15, fontWeight: "700", color: "#FF3B30" },

  emptyContainer: { borderRadius: 20, padding: 30, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 13, textAlign: "center", lineHeight: 18, fontWeight: "500" }
});