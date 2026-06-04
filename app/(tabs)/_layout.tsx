import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#007AFF",   // Brand Blue for active text/icons
        tabBarInactiveTintColor: "#8E8E93", // Soft Gray for inactive ones
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#e0e0e0",
          height: Platform.OS === "ios" ? 90 : 70,
          paddingBottom: Platform.OS === "ios" ? 30 : 12,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        headerStyle: {
          backgroundColor: "#ffffff",
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: "#f0f0f0",
        },
        headerTitleStyle: {
          fontWeight: "700",
          fontSize: 18,
          color: "#111111",
        },
      }}
    >
      {/* 1. HOME TAB */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          headerTitle: "ReceiptLens",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
          ),
        }}
      />

      {/* 2. TRANSACTION TAB */}
      <Tabs.Screen
        name="transaction"
        options={{
          title: "Transaction",
          headerTitle: "Receipt Ledger",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "receipt" : "receipt-outline"} size={24} color={color} />
          ),
        }}
      />

      {/* 3. FLOATING CENTRAL SCAN TAB */}
      <Tabs.Screen
        name="scan"
        options={{
          title: "",
          headerTitle: "Scan Receipt",
          tabBarIcon: () => (
            <View style={styles.floatingScanButton}>
              <Ionicons name="scan" size={28} color="white" />
            </View>
          ),
          // Slight styling adjustments to lower the "Scan" text beneath the floating circle
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            marginTop: Platform.OS === "ios" ? 12 : 18,
          },
        }}
      />

      {/* 4. ANALYTICS TAB */}
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          headerTitle: "Spending Insights",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "pie-chart" : "pie-chart-outline"} size={24} color={color} />
          ),
        }}
      />

      {/* 5. PROFILE TAB */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerTitle: "Account Settings",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  floatingScanButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#007AFF", // Brand Blue
    justifyContent: "center",
    alignItems: "center",
    // Positions the button so it sits slightly above the normal tab bar level
    position: "absolute",
    bottom: Platform.OS === "ios" ? -5 : 5,
    // Soft shadow effect to give it depth
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
});