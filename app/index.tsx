import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/login"); // Change to your login modal route
    }, 3000); // 3 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      
      {/* Center Section: Main App Logo & Subtitle */}
      <View style={styles.centerContent}>
        <Image 
          source={require("../assets/images/logo.png")} 
          style={styles.logo} 
        />
      </View>

      {/* Bottom Section: Expo Branding */}
      <View style={styles.bottomBadge}>
        <Text style={styles.badgeText}>POWERED BY</Text>
        <Image 
          source={require("../assets/images/expo.png")} // Update this path to your local Expo asset
          style={styles.expoIcon} 
        />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white", 
    paddingHorizontal: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 400,
    height: 400,
    resizeMode: "contain",
  },
  bottomBadge: {
    position: "absolute",
    bottom: 40, // Keeps it comfortably clear of the native home indicator
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  badgeText: {
    color: "#8E8E93", // Soft iOS-style gray so it stays secondary to ReceiptLens
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.2,
  },
  expoIcon: {
    width: 50,
    height: 50,
    resizeMode: "contain",
    tintColor: "#111111", // Forces the Expo mark to be a crisp, solid dark neutral
  },
});