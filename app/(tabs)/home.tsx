import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";

// Mock data structure for recent scans
const RECENT_RECEIPTS = [
  { id: "1", merchant: "Starbucks", date: "June 04", amount: "₱185.00", status: "Processed" },
  { id: "2", merchant: "SM Supermarket", date: "June 03", amount: "₱2,450.50", status: "Processed" },
  { id: "3", merchant: "Grab Car", date: "May 31", amount: "₱320.00", status: "Pending" },
];

export default function Home() {
  const [userName, setUserName] = useState("User"); // This will eventually pull from your profiles table

  const handleScanReceipt = () => {
    console.log("Trigger camera / scan mechanics");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* --- Welcome Greeting Header --- */}
        <View style={styles.welcomeSection}>
          <View>
            <Text style={styles.greetingText}>Hello,</Text>
            <Text style={styles.nameText}>{userName} 👋</Text>
          </View>
          <Pressable style={styles.profileCircle}>
            <Ionicons name="person" size={20} color="#007AFF" />
          </Pressable>
        </View>

        {/* --- Financial Summary Bento Card --- */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Total Tracked This Month</Text>
            <Ionicons name="trending-up" size={20} color="#34C759" />
          </View>
          <Text style={styles.totalAmount}>₱2,955.50</Text>
          <Text style={styles.summaryFooter}>📈 12% less than last month</Text>
        </View>

        {/* --- Quick Actions Bento Grid Layout --- */}
        <Text style={styles.sectionHeading}>Quick Actions</Text>
        <View style={styles.bentoGrid}>
          {/* Main Primary Accent Action: Scan Receipt */}
          <Pressable 
            onPress={handleScanReceipt} 
            style={[styles.bentoItem, styles.scanItemLarge]}
          >
            <View style={styles.iconWrapperLarge}>
              <Ionicons name="camera" size={32} color="white" />
            </View>
            <Text style={styles.scanItemTextLarge}>Scan Receipt</Text>
            <Text style={styles.scanItemSubtext}>Instantly parse details via AI</Text>
          </Pressable>

          {/* Secondary Stacked Bento Blocks */}
          <View style={styles.bentoSubGrid}>
            <Pressable style={[styles.bentoItem, styles.smallBento]}>
              <Ionicons name="add-circle-outline" size={24} color="#6366F1" />
              <Text style={styles.smallBentoText}>Manual Input</Text>
            </Pressable>
            
            <Pressable style={[styles.bentoItem, styles.smallBento]}>
              <Ionicons name="pie-chart-outline" size={24} color="#FF9500" />
              <Text style={styles.smallBentoText}>Analytics</Text>
            </Pressable>
          </View>
        </View>

        {/* --- Recent Activity Section --- */}
        <View style={styles.recentSectionHeader}>
          <Text style={styles.sectionHeading}>Recent Receipts</Text>
          <Pressable>
            <Text style={styles.viewAllLink}>See All</Text>
          </Pressable>
        </View>

        <View style={styles.listContainer}>
          {RECENT_RECEIPTS.map((item) => (
            <View key={item.id} style={styles.receiptRow}>
              <View style={styles.receiptLeftBlock}>
                <View style={styles.receiptIconCircle}>
                  <Ionicons name="document-text" size={20} color="#007AFF" />
                </View>
                <View>
                  <Text style={styles.merchantText}>{item.merchant}</Text>
                  <Text style={styles.dateText}>{item.date}</Text>
                </View>
              </View>
              <View style={styles.receiptRightBlock}>
                <Text style={styles.amountText}>{item.amount}</Text>
                <Text style={[
                  styles.statusTag, 
                  item.status === "Pending" ? styles.statusPending : styles.statusProcessed
                ]}>
                  {item.status}
                </Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  welcomeSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  greetingText: {
    fontSize: 16,
    color: "#8E8E93",
    fontWeight: "500",
  },
  nameText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111111",
    marginTop: 2,
  },
  profileCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E1F0FF",
    justifyContent: "center",
    alignItems: "center",
  },
  summaryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 30,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryTitle: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "600",
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: "#111111",
    marginVertical: 12,
    letterSpacing: -0.5,
  },
  summaryFooter: {
    fontSize: 13,
    color: "#34C759",
    fontWeight: "600",
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 16,
  },
  bentoGrid: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 30,
  },
  bentoItem: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  scanItemLarge: {
    flex: 1.2,
    backgroundColor: "#007AFF", // Highlighted Brand Accent Primary Blue
    justifyContent: "center",
    minHeight: 150,
  },
  iconWrapperLarge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  scanItemTextLarge: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  scanItemSubtext: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
  bentoSubGrid: {
    flex: 1,
    gap: 14,
  },
  smallBento: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 8,
  },
  smallBentoText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
  },
  recentSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewAllLink: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  listContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    paddingVertical: 4,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F4F4F4",
  },
  receiptLeftBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  receiptIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F0F7FF",
    justifyContent: "center",
    alignItems: "center",
  },
  merchantText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111111",
  },
  dateText: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 2,
  },
  receiptRightBlock: {
    alignItems: "flex-end",
  },
  amountText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
  },
  statusTag: {
    fontSize: 10,
    fontWeight: "600",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
    overflow: "hidden",
  },
  statusProcessed: {
    backgroundColor: "#E8F5E9",
    color: "#2E7D32",
  },
  statusPending: {
    backgroundColor: "#FFF3E0",
    color: "#EF6C00",
  },
});