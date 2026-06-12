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

// 🛠️ Type para sa tracking periods
type TrackingPeriod = "weekly" | "monthly";

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Developer");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [totalSpent, setTotalSpent] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  
  // 🛠️ KINI NGA MGA BAG-ONG STATE PARA SA DROPDOWN SWITCHER
  const [trackingPeriod, setTrackingPeriod] = useState<TrackingPeriod>("monthly");
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchHomeData = async (period: TrackingPeriod = trackingPeriod) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. User profile data binding
      const emailName = user.email?.split("@")[0] || "User";
      setUserName(user.user_metadata?.full_name || emailName.charAt(0).toUpperCase() + emailName.slice(1));
      setAvatarUrl(user.user_metadata?.avatar_url || null);

      // 2. 🛠️ PAG-CALCULATE SA TIMESTAMPS PARA SA FILTERING
      const now = new Date();
      let filterStartDate = new Date();

      if (period === "weekly") {
        // Kuhaon ang sinugdanan ning semanaha (ex: Sunday)
        const currentDay = now.getDay(); 
        filterStartDate.setDate(now.getDate() - currentDay);
        filterStartDate.setHours(0, 0, 0, 0);
      } else {
        // Kuhaon ang sinugdanan ning bulana (1st day of the month)
        filterStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      // 3. PANAWAG SA SUPABASE (Gi-filter gamit ang .gte para sa petsa)
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("id, merchant, amount, category, created_at")
        .eq("user_id", user.id)
        .gte("created_at", filterStartDate.toISOString()) // Filter start date base sa napili
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (transactions) {
        // I-display gihapon ang pinaka-recent 3 kabuok activity logs
        setRecentTransactions(transactions.slice(0, 3));
        
        // I-calculate ang total base sa na-filter nga period
        const total = transactions.reduce((sum, item) => sum + (item.amount || 0), 0);
        setTotalSpent(total);
      }
    } catch (e) {
      console.error("Error loading filtered dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  // 🛠️ Mo-trigger inig usab sa trackingPeriod state
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Updating Data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* 1. GREETING HEADER */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.subGreeting}>Welcome Back,</Text>
            <Text style={styles.mainGreeting}>{userName}! 👋</Text>
          </View>
          
          <Pressable style={styles.profileBadge} onPress={() => router.push("/profile")}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallbackCircle}>
                <Ionicons name="person" size={18} color="#ffffff" />
              </View>
            )}
          </Pressable>
        </View>

        {/* 2. BENTO MAIN WALLET / SUMMARY CARD */}
        <View style={styles.walletCard}>
          <View style={styles.walletHeader}>
            
            {/* 🛠️ DROPDOWN TRIGGER BUTTON */}
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

          {/* 🛠️ FLOATING DROPDOWN LIST OPTION BOX */}
          {showDropdown && (
            <View style={styles.dropdownMenuBox}>
              <Pressable 
                style={[styles.dropdownItem, trackingPeriod === "weekly" && styles.activeDropdownItem]}
                onPress={() => togglePeriodSelection("weekly")}
              >
                <Ionicons name="calendar-outline" size={16} color={trackingPeriod === "weekly" ? "#007AFF" : "#48484A"} />
                <Text style={[styles.dropdownItemText, trackingPeriod === "weekly" && styles.activeDropdownItemText]}>Weekly Tracking</Text>
              </Pressable>
              
              <View style={styles.dropdownDivider} />

              <Pressable 
                style={[styles.dropdownItem, trackingPeriod === "monthly" && styles.activeDropdownItem]}
                onPress={() => togglePeriodSelection("monthly")}
              >
                <Ionicons name="apps-outline" size={16} color={trackingPeriod === "monthly" ? "#007AFF" : "#48484A"} />
                <Text style={[styles.dropdownItemText, trackingPeriod === "monthly" && styles.activeDropdownItemText]}>Monthly Tracking</Text>
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
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <Pressable style={styles.actionButton} onPress={() => router.push("/scan")}>
            <View style={[styles.actionIconCircle, { backgroundColor: "#EEF7FF" }]}>
              <Ionicons name="camera" size={24} color="#007AFF" />
            </View>
            <Text style={styles.actionLabel}>Scan Receipt</Text>
          </Pressable>

          <Pressable style={styles.actionButton} onPress={() => router.push("/analytics")}>
            <View style={[styles.actionIconCircle, { backgroundColor: "#F5EEFF" }]}>
              <Ionicons name="bar-chart" size={24} color="#5856D6" />
            </View>
            <Text style={styles.actionLabel}>Analytics</Text>
          </Pressable>

          <Pressable style={styles.actionButton} onPress={() => fetchHomeData(trackingPeriod)}>
            <View style={[styles.actionIconCircle, { backgroundColor: "#EFFFFA" }]}>
              <Ionicons name="refresh" size={24} color="#34C759" />
            </View>
            <Text style={styles.actionLabel}>Refresh</Text>
          </Pressable>
        </View>

        {/* 4. RECENT TRANSACTIONS ACTIVITY */}
        <View style={styles.recentSectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Pressable onPress={() => router.push("/analytics")}>
            <Text style={styles.viewAllText}>View All</Text>
          </Pressable>
        </View>

        {recentTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="duplicate-outline" size={44} color="#C7C7CC" />
            <Text style={styles.emptyText}>No logs found for this period. Scan a receipt to begin tracking!</Text>
          </View>
        ) : (
          recentTransactions.map((item) => (
            <View key={item.id} style={styles.transactionItemCard}>
              <View style={styles.itemLeftGroup}>
                <View style={styles.itemIconBox}>
                  <Ionicons name={getCategoryIcon(item.category)} size={22} color="#48484A" />
                </View>
                <View style={styles.itemMeta}>
                  <Text style={styles.itemMerchantTitle} numberOfLines={1}>{item.merchant}</Text>
                  <Text style={styles.itemCategorySub}>{item.category}</Text>
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
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  scrollContainer: { padding: 20 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8F9FA" },
  loadingText: { marginTop: 10, color: "#666", fontSize: 14 },

  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  subGreeting: { fontSize: 14, color: "#8E8E93", fontWeight: "500" },
  mainGreeting: { fontSize: 26, fontWeight: "700", color: "#1C1C1E", marginTop: 2 },
  
  profileBadge: { width: 40, height: 40, borderRadius: 20, overflow: "hidden" },
  avatarImage: { width: "100%", height: "100%" },
  avatarFallbackCircle: { width: "100%", height: "100%", backgroundColor: "#007AFF", justifyContent: "center", alignItems: "center" },

  // Wallet Card Dashboard Layout
  walletCard: {
    backgroundColor: "#007AFF", 
    borderRadius: 24,
    padding: 24,
    marginBottom: 26,
    position: "relative", // 🛠️ Kinahanglan aron mo-float ang Dropdown box sa sulod niini
    zIndex: 10,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  walletHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  
  // 🛠️ CUSTOM ACCENT DROPDOWN STYLING
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
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
    backgroundColor: "#FFFFFF",
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
  activeDropdownItem: {
    backgroundColor: "#F0F7FF",
  },
  dropdownItemText: {
    fontSize: 13,
    color: "#1C1C1E",
    fontWeight: "500",
  },
  activeDropdownItemText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: "#F2F2F7",
    marginVertical: 2,
  },

  walletAmount: { color: "#FFFFFF", fontSize: 36, fontWeight: "700", marginTop: 16, marginBottom: 16 },
  walletFooter: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.15)", paddingTop: 12 },
  liveIndicatorContainer: { flexDirection: "row", alignItems: "center" },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#34C759", marginRight: 6 },
  liveText: { color: "#FFFFFF", fontSize: 12, fontWeight: "500", opacity: 0.9 },

  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1C1C1E", marginBottom: 14 },
  recentSectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  viewAllText: { fontSize: 14, color: "#007AFF", fontWeight: "600" },

  actionsGrid: { flexDirection: "row", justifyContent: "space-between", marginBottom: 26, gap: 12 },
  actionButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  actionIconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  actionLabel: { fontSize: 12, fontWeight: "600", color: "#3A3A3C" },

  transactionItemCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  itemLeftGroup: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  itemIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#F2F2F7", justifyContent: "center", alignItems: "center" },
  itemMeta: { flex: 1 },
  itemMerchantTitle: { fontSize: 15, fontWeight: "600", color: "#1C1C1E" },
  itemCategorySub: { fontSize: 12, color: "#8E8E93", marginTop: 2, fontWeight: "500" },
  itemCostValue: { fontSize: 15, fontWeight: "700", color: "#FF3B30" },

  emptyContainer: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 30, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 13, color: "#8E8E93", textAlign: "center", lineHeight: 18, fontWeight: "500" }
});