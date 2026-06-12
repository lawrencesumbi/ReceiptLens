import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import React, { useState } from "react";
import { Dimensions, Platform, Pressable, StyleSheet, Text, View } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function TabLayout() {
  const router = useRouter();
  
  // 🛠️ STATES PARA SA FLOATING SPEED DIAL CONTROL
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSelectManual = () => {
    setIsMenuOpen(false);
    
    // Mo-navigate sa transaction.tsx ug magpasa og query parameter para sa modal
    router.push({
      pathname: "/transaction", // Siguroha nga husto ang ngalan sa imong file (pwedeng /transaction o kung index ba sa folder)
      params: { openModal: "true" }
    });
  };

  const handleSelectScan = () => {
    setIsMenuOpen(false);
    // Mo-navigate dretso sa imong scan camera page slot
    router.push("/scan");
  };
  
  return (
  <View style={{ flex: 1 }}>
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
    {/* ====================================================================== */}
      {/* 🛠️ PREMIUM FLOATING FAB SYSTEM OVERLAY (NAG-REPLICATE SA IMAGE WORKFLOW) */}
      {/* ====================================================================== */}

      {/* 🛠️ DIMMED BACKDROP SCREEN COVER OVERLAY */}
      {isMenuOpen && (
        <Pressable style={styles.backdropDismiss} onPress={() => setIsMenuOpen(false)} />
      )}

      {/* 🛠️ SPEED DIAL VERTICAL STACK ACTIONS MENU */}
      {isMenuOpen && (
        <View style={styles.floatingMenuContainer}>
          
          {/* Option 1: Manual Input row */}
          <View style={styles.speedDialRow}>
            <Text style={styles.speedDialLabel}>Manual Input</Text>
            <Pressable style={[styles.speedDialFab, { backgroundColor: "#5856D6" }]} onPress={handleSelectManual}>
              <Ionicons name="create" size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Option 2: Automatic Scan row */}
          <View style={styles.speedDialRow}>
            <Text style={styles.speedDialLabel}>AI Scan Receipt</Text>
            <Pressable style={[styles.speedDialFab, { backgroundColor: "#007AFF" }]} onPress={handleSelectScan}>
              <Ionicons name="scan" size={22} color="#FFFFFF" />
            </Pressable>
          </View>

        </View>
      )}

      {/* 🛠️ MAIN ANCHOR FAB "+" TRIGGER ACCENT BUTTON */}
      <Pressable 
        style={[styles.mainTriggerFab, isMenuOpen && styles.mainTriggerFabActive]} 
        onPress={() => setIsMenuOpen(!isMenuOpen)}
      >
        <Ionicons 
          name={isMenuOpen ? "close" : "add"} 
          size={32} 
          color="#FFFFFF" 
          style={{ transform: [{ rotate: isMenuOpen ? "90deg" : "0deg" }] }}
        />
      </Pressable>
  </View>
  );
}

const styles = StyleSheet.create({
  backdropDismiss: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)", // Gi-dim ang tibuok screen parehas sa "floating action button.jpg"
    zIndex: 98,
  },
  mainTriggerFab: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 24 : 12, // Gi-adjust para mosakto sa tunga sa tab bar base
    left: "50%", // Ibalhin sa tunga sa screen
    marginLeft: -28, // Katunga sa width (56 / 2) para perfect center
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#007AFF", 
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 100,
  },
  mainTriggerFabActive: {
    backgroundColor: "#1C1C1E", // Mo-dark ang color toggle kung open na
  },
  floatingMenuContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 96 : 80, // Mosaka sa ibabaw sa main trigger button
    left: 0,
    right: 0,
    alignItems: "center", // Gi-center ang main container wrapper
    gap: 16,
    zIndex: 99,
  },
  speedDialRow: {
    flexDirection: "row", // Ibalik sa row para horizontal ang dagan sa label ug icon
    alignItems: "center",
    justifyContent: "center",
    width: SCREEN_WIDTH, // Sigurohon nga full width para sa hapsay nga alignment
    position: "relative",
  },
  speedDialLabel: {
    position: "absolute",
    right: "50%", // Magsugod sa tunga sa screen
    marginRight: 36, // I-push pabalik sa wala (left side) aron dili ma-igo sa button (half of fab width + gap)
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    overflow: "hidden",
    textAlign: "right",
  },
  speedDialFab: {
    // Magpabilin ni sa dead center tungod sa parent layout structure
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});