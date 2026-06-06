import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../utils/supabase";

const { width } = Dimensions.get("window");

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [totalSpending, setTotalSpending] = useState(0);
  const [receiptCount, setReceiptCount] = useState(0);
  const [topCategory, setTopCategory] = useState({ name: "None", amount: 0 });
  const [categories, setCategories] = useState<CategoryData[]>([]);

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

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch tanan transactions sa user
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("amount, category")
        .eq("user_id", user.id);

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
        }).sort((a, b) => b.amount - a.amount); // I-sort gikan sa pinakadako

        setCategories(formattedCategories);
        setTopCategory({ name: highestCatName, amount: highestCatAmount });
      }
    } catch (e) {
      console.error("Error fetching analytics:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading Analytics Data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* HEADER SUMMARY CARD */}
        <View style={styles.headerCard}>
          <Text style={styles.headerLabel}>Total Tracked Spending</Text>
          <Text style={styles.headerAmount}>₱{totalSpending.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
          <View style={styles.trendRow}>
            <Ionicons name="trending-up" size={16} color="#34C759" />
            <Text style={styles.trendText}>Live updates from receipt data</Text>
          </View>
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
            <Text style={styles.bentoLabel}>Scanned</Text>
            <Text style={[styles.bentoMainVal, { fontSize: 32 }]}>{receiptCount}</Text>
            <Text style={styles.bentoSubVal}>Receipts total</Text>
          </View>

        </View>

        {/* CATEGORY BREAKDOWN LIST CONTAINER */}
        <View style={styles.breakdownSection}>
          <Text style={styles.sectionTitle}>Category Breakdown</Text>
          
          {categories.length === 0 ? (
            <Text style={styles.emptyText}>No category history data available yet.</Text>
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
  scrollContainer: { padding: 20 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8F9FA" },
  loadingText: { marginTop: 10, color: "#666", fontSize: 14 },
  
  // Header Style Card
  headerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  headerLabel: { fontSize: 14, color: "#8E8E93", fontWeight: "600", textTransform: "uppercase" },
  headerAmount: { fontSize: 36, fontWeight: "700", color: "#1C1C1E", marginVertical: 8 },
  trendRow: { flexDirection: "row", alignItems: "center" },
  trendText: { fontSize: 13, color: "#34C759", marginLeft: 4, fontWeight: "500" },

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
    shadowOpacity: 0.05,
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
  bentoMainVal: { fontSize: 22, fontWeight: "700", color: "#1C1C1E", marginVertical: 2 },
  bentoSubVal: { fontSize: 13, color: "#636366", fontWeight: "500" },

  // Breakdown List Styles
  breakdownSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1C1C1E", marginBottom: 16 },
  emptyText: { color: "#8E8E93", textAlign: "center", marginVertical: 20 },
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