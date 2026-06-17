import { useTheme } from "@/context/ThemeContext"; // 💡 Gi-import ang imong Theme hook
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../utils/supabase";

const { width } = Dimensions.get("window");

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

type FilterRange = "this_month" | "last_month" | "this_week" | "last_week";

export default function AnalyticsScreen() {
  const { colors } = useTheme(); // 💡 Gi-consume ang custom design theme elements
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // 🔄 State para sa pull-to-refresh
  const [totalSpending, setTotalSpending] = useState(0);
  const [receiptCount, setReceiptCount] = useState(0);
  const [topCategory, setTopCategory] = useState({ name: "None", amount: 0 });
  const [categories, setCategories] = useState<CategoryData[]>([]);

  const [filterRange, setFilterRange] = useState<FilterRange>("this_month");
  const [showDropdown, setShowDropdown] = useState(false);

  // Category Color Mapper - Nindot nga Accent Mix
  const getCategoryColor = (cat: string): string => {
    const customColors: { [key: string]: string } = {
      "Food & Drinks": "#FF9500", // Orange
      "Utilities": "#007AFF",     // Blue
      "Shopping": "#FF2D55",      // Pink
      "Transportation": "#5856D6",// Purple
      "Miscellaneous": "#8E8E93"  // Gray
    };
    return customColors[cat] || "#34C759"; // Default Green
  };

  const fetchAnalyticsData = async (range: FilterRange = filterRange, isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true); // Ayaw ipakita ang full screen loader kung nag-pull-to-refresh lang
      
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
          const currentDay = now.getDay();
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

        const group: { [key: string]: number } = {};
        transactions.forEach(item => {
          const cat = item.category || "Miscellaneous";
          group[cat] = (group[cat] || 0) + (item.amount || 0);
        });

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
        setTotalSpending(0);
        setReceiptCount(0);
        setCategories([]);
        setTopCategory({ name: "None", amount: 0 });
      }
    } catch (e) {
      console.error("Error fetching analytics:", e);
    } finally {
      setLoading(false);
      setRefreshing(false); // 🔄 Iundang ang loading animation sa refresh control
    }
  };

  // 🔄 Trigger function inig scroll-down-to-refresh sa user
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAnalyticsData(filterRange, true);
  }, [filterRange]);

  useEffect(() => {
    fetchAnalyticsData(filterRange);
  }, [filterRange]);

  const handleSelectRange = (range: FilterRange) => {
    setFilterRange(range);
    setShowDropdown(false);
  };

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
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary || "#007AFF"} />
        <Text style={[styles.loadingText, { color: colors.text + "B3" }]}>Analyzing Records...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={colors.primary || "#007AFF"} // Para sa iOS loader color
            colors={[colors.primary || "#007AFF"]} // Para sa Android loader color
          />
        }
      >
        
        {/* DROPDOWN SELECTOR BAR CODES */}
        <View style={styles.dropdownSectionContainer}>
          <Text style={[styles.pageTitleText, { color: colors.text }]}>Expense Analytics</Text>
          <View style={styles.dropdownWrapper}>
            <Pressable 
              style={[styles.dropdownTriggerBtn, { backgroundColor: colors.card, borderColor: colors.border }]} 
              onPress={() => setShowDropdown(!showDropdown)}
            >
              <Text style={[styles.dropdownTriggerLabel, { color: colors.primary || "#007AFF" }]}>
                {getRangeLabel(filterRange)}
              </Text>
              <Ionicons name={showDropdown ? "chevron-up" : "chevron-down"} size={14} color={colors.primary || "#007AFF"} />
            </Pressable>

            {showDropdown && (
              <View style={[styles.dropdownFloaterBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {(["this_month", "last_month", "this_week", "last_week"] as FilterRange[]).map((range, idx) => {
                  const isActive = filterRange === range;
                  return (
                    <React.Fragment key={range}>
                      {idx === 2 && <View style={[styles.menuDividerLine, { backgroundColor: colors.border }]} />}
                      <Pressable 
                        style={[styles.dropdownOption, isActive && { backgroundColor: (colors.primary || "#007AFF") + "1A" }]} 
                        onPress={() => handleSelectRange(range)}
                      >
                        <Text style={[styles.optionText, { color: colors.text }, isActive && { color: colors.primary || "#007AFF", fontWeight: "600" }]}>
                          {getRangeLabel(range)}
                        </Text>
                      </Pressable>
                    </React.Fragment>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* HEADER SUMMARY CARD */}
        <View style={[styles.headerCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.headerLabel, { color: colors.text + "80" }]}>Tracked Spending ({getRangeLabel(filterRange)})</Text>
          <Text style={[styles.headerAmount, { color: colors.text }]}>
            ₱{totalSpending.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
        </View>

        {/* MODERN BENTO GRID ROW */}
        <View style={styles.bentoGridRow}>
          {/* Card 1: Top Category Box */}
          <View style={[styles.bentoCard, { flex: 1.3, backgroundColor: colors.card }]}>
            <View style={[styles.bentoIconWrapper, { backgroundColor: colors.background }]}>
              <Ionicons name="pie-chart-outline" size={20} color="#5856D6" />
            </View>
            <View>
              <Text style={[styles.bentoLabel, { color: colors.text + "80" }]}>Top Category</Text>
              <Text style={[styles.bentoMainVal, { color: colors.text }]} numberOfLines={1}>{topCategory.name}</Text>
              <Text style={[styles.bentoSubVal, { color: colors.text + "B3" }]}>₱{topCategory.amount.toFixed(2)}</Text>
            </View>
          </View>

          {/* Card 2: Scanned Count Box */}
          <View style={[styles.bentoCard, { flex: 1, backgroundColor: colors.card }]}>
            <View style={[styles.bentoIconWrapper, { backgroundColor: colors.background }]}>
              <Ionicons name="document-text-outline" size={20} color="#007AFF" />
            </View>
            <View>
              <Text style={[styles.bentoLabel, { color: colors.text + "80" }]}>Transactions</Text>
              <Text style={[styles.bentoMainVal, { fontSize: 32, color: colors.text }]}>{receiptCount}</Text>
              <Text style={[styles.bentoSubVal, { color: colors.text + "B3" }]}>Total Logs</Text>
            </View>
          </View>
        </View>

        {/* CATEGORY BREAKDOWN LIST CONTAINER */}
        <View style={[styles.breakdownSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Category Breakdown</Text>
          
          {categories.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="folder-open-outline" size={36} color={colors.text + "4D"} style={{ marginBottom: 8 }} />
              <Text style={[styles.emptyText, { color: colors.text + "66" }]}>No transactions recorded during this period.</Text>
            </View>
          ) : (
            categories.map((item, index) => (
              <View key={index} style={styles.categoryRowItem}>
                <View style={styles.catLabelRow}>
                  <View style={styles.catIndicatorGroup}>
                    <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                    <Text style={[styles.catNameText, { color: colors.text }]}>{item.category}</Text>
                  </View>
                  <Text style={[styles.catValueText, { color: colors.text }]}>₱{item.amount.toFixed(2)}</Text>
                </View>

                {/* Custom Dynamic Progress Bar */}
                <View style={[styles.progressBarOuter, { backgroundColor: colors.background }]}>
                  <View 
                    style={[
                      styles.progressBarInner, 
                      { backgroundColor: item.color, width: `${item.percentage}%` }
                    ]} 
                  />
                </View>
                <Text style={[styles.percentageText, { color: colors.text + "80" }]}>{item.percentage.toFixed(1)}% of total</Text>
              </View>
            ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 15,
    paddingBottom: 30,
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 14 },
  
  dropdownSectionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    zIndex: 99, 
  },
  pageTitleText: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  dropdownWrapper: {
    position: "relative",
  },
  dropdownTriggerBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
  },
  dropdownTriggerLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  dropdownFloaterBox: {
    position: "absolute",
    top: 40,
    right: 0,
    borderRadius: 12,
    width: 140,
    padding: 4,
    
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    zIndex: 100,
    borderWidth: 1,
  },
  dropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  optionText: {
    fontSize: 13,
    fontWeight: "500",
  },
  menuDividerLine: {
    height: 1,
    marginVertical: 4,
  },

  headerCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    
  },
  headerLabel: { fontSize: 13, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3 },
  headerAmount: { fontSize: 34, fontWeight: "700", marginTop: 8 },

  bentoGridRow: { flexDirection: "row", gap: 14, marginBottom: 20 },
  bentoCard: {
    borderRadius: 20,
    padding: 16,
    minHeight: 140,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    
  },
  bentoIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center"
  },
  bentoLabel: { fontSize: 13, fontWeight: "500", marginTop: 4 },
  bentoMainVal: { fontSize: 20, fontWeight: "700", marginVertical: 1 },
  bentoSubVal: { fontSize: 12, fontWeight: "500" },

  breakdownSection: {
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
  },
  emptyText: { fontSize: 13, textAlign: "center", fontWeight: "500" },
  categoryRowItem: { marginBottom: 16 },
  catLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  catIndicatorGroup: { flexDirection: "row", alignItems: "center", gap: 8 },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  catNameText: { fontSize: 15, fontWeight: "600" },
  catValueText: { fontSize: 15, fontWeight: "700" },
  progressBarOuter: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressBarInner: { height: "100%", borderRadius: 4 },
  percentageText: { fontSize: 11, marginTop: 4, textAlign: "right" }
});