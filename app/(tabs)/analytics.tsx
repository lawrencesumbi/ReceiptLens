import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../utils/supabase";

const { width } = Dimensions.get("window");

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

// 🛠️ Mga kapilian para sa filter range
type FilterRange = "this_month" | "last_month" | "this_week" | "last_week";

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [totalSpending, setTotalSpending] = useState(0);
  const [receiptCount, setReceiptCount] = useState(0);
  const [topCategory, setTopCategory] = useState({ name: "None", amount: 0 });
  const [categories, setCategories] = useState<CategoryData[]>([]);

  // 🛠️ MGA BAG-ONG STATE PARA SA ANALYTICS DROPDOWN
  const [filterRange, setFilterRange] = useState<FilterRange>("this_month");
  const [showDropdown, setShowDropdown] = useState(false);

  // Category Color Mapper para sa Limpyo nga UI UX
  const getCategoryColor = (cat: string): string => {
    const colors: { [key: string]: string } = {
      "Food & Drinks": "#FF9500", // Orange
      "Utilities": "#007AFF",     // Blue
      "Shopping": "#FF2D55",      // Pink
      "Transportation": "#5856D6",// Purple
      "Miscellaneous": "#8E8E93"  // Gray
    };
    return colors[cat] || "#34C759"; // Default Green
  };

  // 🛠️ LABING LABAW NGA LOGIC SA TIME-RANGE CALCULATION
  const fetchAnalyticsData = async (range: FilterRange = filterRange) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      let startDate = new Date();
      let endDate = new Date();

      switch (range) {
        case "this_month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
          break;
        case "last_month":
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
          break;
        case "this_week":
          const currentDay = now.getDay(); // 0 is Sunday
          startDate.setDate(now.getDate() - currentDay);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "last_week":
          const prevDay = now.getDay();
          const startOfThisWeek = new Date(now);
          startOfThisWeek.setDate(now.getDate() - prevDay);
          
          startDate = new Date(startOfThisWeek);
          startDate.setDate(startOfThisWeek.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
          break;
      }

      // 1. Fetch transactions nga nasulod sa filter dates range
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("amount, category")
        .eq("user_id", user.id)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      if (error) throw error;

      if (transactions && transactions.length > 0) {
        const total = transactions.reduce((sum, item) => sum + (item.amount || 0), 0);
        setTotalSpending(total);
        setReceiptCount(transactions.length);

        // 2. I-group ug i-calculate ang kada kategorya
        const group: { [key: string]: number } = {};
        transactions.forEach(item => {
          const cat = item.category || "Miscellaneous";
          group[cat] = (group[cat] || 0) + (item.amount || 0);
        });

        // 3. I-format para sa state list ug pangitaon ang Top Category
        let highestCatName = "None";
        let highestCatAmount = 0;

        const formattedCategories: CategoryData[] = Object.keys(group).map(key => {
          const amt = group[key];
          if (amt > highestCatAmount) {
            highestCatAmount = amt;
            highestCatName = key;
          }
          return {
            category: key,
            amount: amt,
            percentage: total > 0 ? (amt / total) * 100 : 0,
            color: getCategoryColor(key)
          };
        }).sort((a, b) => b.amount - a.amount);

        setCategories(formattedCategories);
        setTopCategory({ name: highestCatName, amount: highestCatAmount });
      } else {
        // I-reset ang data kung walay nakit-an nga records sa maong filter period
        setTotalSpending(0);
        setReceiptCount(0);
        setCategories([]);
        setTopCategory({ name: "None", amount: 0 });
      }
    } catch (e) {
      console.error("Error fetching analytics:", e);
    } finally {
      setLoading(false);
    }
  };

  // 🛠️ Mo-reload matag usab sa dropdown configuration state
  useEffect(() => {
    fetchAnalyticsData(filterRange);
  }, [filterRange]);

  const handleSelectRange = (range: FilterRange) => {
    setFilterRange(range);
    setShowDropdown(false);
  };

  // Label UI formatter base sa active token identifier
  const getRangeLabel = (range: FilterRange) => {
    switch (range) {
      case "this_month": return "This Month";
      case "last_month": return "Last Month";
      case "this_week": return "This Week";
      case "last_week": return "Last Week";
    }
  };

  if (loading && !showDropdown) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Analyzing Records...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* 🛠️ COMPACT DROPDOWN SELECTOR BAR CODES */}
        <View style={styles.dropdownSectionContainer}>
          <Text style={styles.pageTitleText}>Expense Analytics</Text>
          <View style={styles.dropdownWrapper}>
            <Pressable style={styles.dropdownTriggerBtn} onPress={() => setShowDropdown(!showDropdown)}>
              <Text style={styles.dropdownTriggerLabel}>{getRangeLabel(filterRange)}</Text>
              <Ionicons name={showDropdown ? "chevron-up" : "chevron-down"} size={14} color="#007AFF" />
            </Pressable>

            {showDropdown && (
              <View style={styles.dropdownFloaterBox}>
                <Pressable style={[styles.dropdownOption, filterRange === "this_month" && styles.activeOption]} onPress={() => handleSelectRange("this_month")}>
                  <Text style={[styles.optionText, filterRange === "this_month" && styles.activeOptionText]}>This Month</Text>
                </Pressable>
                <Pressable style={[styles.dropdownOption, filterRange === "last_month" && styles.activeOption]} onPress={() => handleSelectRange("last_month")}>
                  <Text style={[styles.optionText, filterRange === "last_month" && styles.activeOptionText]}>Last Month</Text>
                </Pressable>
                <View style={styles.menuDividerLine} />
                <Pressable style={[styles.dropdownOption, filterRange === "this_week" && styles.activeOption]} onPress={() => handleSelectRange("this_week")}>
                  <Text style={[styles.optionText, filterRange === "this_week" && styles.activeOptionText]}>This Week</Text>
                </Pressable>
                <Pressable style={[styles.dropdownOption, filterRange === "last_week" && styles.activeOption]} onPress={() => handleSelectRange("last_week")}>
                  <Text style={[styles.optionText, filterRange === "last_week" && styles.activeOptionText]}>Last Week</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>

        {/* HEADER SUMMARY CARD */}
        <View style={styles.headerCard}>
          <Text style={styles.headerLabel}>Tracked Spending ({getRangeLabel(filterRange)})</Text>
          <Text style={styles.headerAmount}>₱{totalSpending.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
        </View>

        {/* MODERN BENTO GRID ROW */}
        <View style={styles.bentoGridRow}>
          {/* Card 1: Top Category Box */}
          <View style={[styles.bentoCard, { flex: 1.3 }]}>
            <View style={styles.bentoIconWrapper}>
              <Ionicons name="pie-chart-outline" size={20} color="#5856D6" />
            </View>
            <Text style={styles.bentoLabel}>Top Category</Text>
            <Text style={styles.bentoMainVal} numberOfLines={1}>{topCategory.name}</Text>
            <Text style={styles.bentoSubVal}>₱{topCategory.amount.toFixed(2)}</Text>
          </View>

          {/* Card 2: Scanned Count Box */}
          <View style={[styles.bentoCard, { flex: 1 }]}>
            <View style={styles.bentoIconWrapper}>
              <Ionicons name="document-text-outline" size={20} color="#007AFF" />
            </View>
            <Text style={styles.bentoLabel}>Transactions</Text>
            <Text style={[styles.bentoMainVal, { fontSize: 32 }]}>{receiptCount}</Text>
            <Text style={styles.bentoSubVal}>Total Logs</Text>
          </View>
        </View>

        {/* CATEGORY BREAKDOWN LIST CONTAINER */}
        <View style={styles.breakdownSection}>
          <Text style={styles.sectionTitle}>Category Breakdown</Text>
          
          {categories.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="folder-open-outline" size={36} color="#8E8E93" style={{ marginBottom: 8 }} />
              <Text style={styles.emptyText}>No transactions recorded during this period.</Text>
            </View>
          ) : (
            categories.map((item, index) => (
              <View key={index} style={styles.categoryRowItem}>
                <View style={styles.catLabelRow}>
                  <View style={styles.catIndicatorGroup}>
                    <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                    <Text style={styles.catNameText}>{item.category}</Text>
                  </View>
                  <Text style={styles.catValueText}>₱{item.amount.toFixed(2)}</Text>
                </View>

                {/* Custom Dynamic Progress Bar */}
                <View style={styles.progressBarOuter}>
                  <View 
                    style={[
                      styles.progressBarInner, 
                      { backgroundColor: item.color, width: `${item.percentage}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.percentageText}>{item.percentage.toFixed(1)}% of total</Text>
              </View>
            ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  scrollContainer: {paddingHorizontal: 24,
      paddingTop: Platform.OS === "ios" ? 60 : 15,
      paddingBottom: 120,},
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8F9FA" },
  loadingText: { marginTop: 10, color: "#666", fontSize: 14 },
  
  // 🛠️ STYLING SA DROPDOWN SELECTOR LAYOUT
  dropdownSectionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    zIndex: 99, // Importante aron molataw ang dropdown options list
  },
  pageTitleText: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1C1C1E",
    letterSpacing: -0.4,
  },
  dropdownWrapper: {
    position: "relative",
  },
  dropdownTriggerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  dropdownTriggerLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#007AFF",
  },
  dropdownFloaterBox: {
    position: "absolute",
    top: 40,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    width: 140,
    padding: 4,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    zIndex: 100,
    borderWidth: 1,
    borderColor: "#F2F2F7",
  },
  dropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  activeOption: {
    backgroundColor: "#F0F7FF",
  },
  optionText: {
    fontSize: 13,
    color: "#1C1C1E",
    fontWeight: "500",
  },
  activeOptionText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  menuDividerLine: {
    height: 1,
    backgroundColor: "#F2F2F7",
    marginVertical: 4,
  },

  // Header Style Card
  headerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  headerLabel: { fontSize: 13, color: "#8E8E93", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3 },
  headerAmount: { fontSize: 34, fontWeight: "700", color: "#1C1C1E", marginTop: 8 },

  // Bento Grid System Layout
  bentoGridRow: { flexDirection: "row", gap: 14, marginBottom: 20 },
  bentoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    minHeight: 140,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  bentoIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center"
  },
  bentoLabel: { fontSize: 13, color: "#8E8E93", fontWeight: "500", marginTop: 8 },
  bentoMainVal: { fontSize: 20, fontWeight: "700", color: "#1C1C1E", marginVertical: 2 },
  bentoSubVal: { fontSize: 12, color: "#636366", fontWeight: "500" },

  // Breakdown List Styles
  breakdownSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1C1C1E", marginBottom: 16 },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
  },
  emptyText: { color: "#8E8E93", fontSize: 13, textAlign: "center", fontWeight: "500" },
  categoryRowItem: { marginBottom: 16 },
  catLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  catIndicatorGroup: { flexDirection: "row", alignItems: "center", gap: 8 },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  catNameText: { fontSize: 15, fontWeight: "600", color: "#3A3A3C" },
  catValueText: { fontSize: 15, fontWeight: "700", color: "#1C1C1E" },
  progressBarOuter: { height: 8, backgroundColor: "#E5E5EA", borderRadius: 4, overflow: "hidden" },
  progressBarInner: { height: "100%", borderRadius: 4 },
  percentageText: { fontSize: 11, color: "#8E8E93", marginTop: 4, textAlign: "right" }
});