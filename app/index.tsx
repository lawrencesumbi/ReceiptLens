import { useRouter } from "expo-router"; // 1. Import the router
import { Image, Pressable, Text, View } from "react-native";

export default function Index() {
  const router = useRouter(); // 2. Initialize the router

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 15,
        backgroundColor: "white",
        paddingHorizontal: 20,
      }}
    >
      <Image 
        source={require("../assets/images/logo.png")} 
        style={{ width: 350, height: 350, resizeMode: "contain" }} 
      />

      {/* Modified Get Started Button */}
      <Pressable
        onPress={() => router.push("/login")} // 3. Navigate to login.tsx
        style={({ pressed }) => ({
          backgroundColor: "#007AFF", 
          paddingVertical: 14,
          paddingHorizontal: 40,
          borderRadius: 25,
          marginTop: 10,
          opacity: pressed ? 0.8 : 1, 
          width: "80%", 
          alignItems: "center",
        })}
      >
        <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
          Get Started
        </Text>
      </Pressable>
    </View>
  );
}