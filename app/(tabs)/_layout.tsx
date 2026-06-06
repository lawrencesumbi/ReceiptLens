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
          borderTopColor: "#f2f2f7",        // Mas humok ug subtle nga border line
          height: Platform.OS === "ios" ? 90 : 70,
          paddingBottom: Platform.OS === "ios" ? 30 : 12,
          paddingTop: 10,
          elevation: 8,                     // Gi-stiffen gamit ang elevation shadow sa ubos
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        // 🎨 GLOBAL ULTRA-CLEAN HEADER STYLE
        headerStyle: {
          backgroundColor: "#F8F9FA",       // Naka-match sa background scaffold sa mga screens
          elevation: 0,                     // Tangtangon ang bug-at nga Android shadow
          shadowOpacity: 0,                 // Tangtangon ang iOS shadow line
        },
        headerShadowVisible: false,         // Gi-force og clear ang native layout shadow dividers
        headerTitleStyle: {
          fontWeight: "700",
          fontSize: 20,                     // Gi-adjust gamay para mas professional basahon
          color: "#1C1C1E",                 // Gidala sa iOS native dark text color
          letterSpacing: -0.5,
        },
        headerTitleAlign: "left",           // Standard modern design pattern, haom sa custom grids
      }}
    >
      {/* 1. HOME TAB */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          headerShown: false,               // 🛠️ CLEAN FIX: Gi-hide kay naa nay nindot nga personal greeting header sa home.tsx
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
          headerShown: false,               // 🛠️ CLEAN FIX: Gi-hide kay naa nay nindot nga personal greeting header sa home.tsx
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
          headerShown: false,               // 🛠️ CLEAN FIX: Gi-hide kay full screen camera immersive component man kini
          tabBarIcon: () => (
            <View style={styles.floatingScanButton}>
              <Ionicons name="scan" size={28} color="white" />
            </View>
          ),
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
          headerShown: false,               // 🛠️ CLEAN FIX: Gi-hide kay aduna nay structured header block ang analytics.tsx
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
          headerShown: false,
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
    backgroundColor: "#007AFF", 
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: Platform.OS === "ios" ? -5 : 5,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
});