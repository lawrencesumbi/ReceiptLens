import { useRouter } from "expo-router"; // 1. Import the router
import { useEffect } from "react";
import { Image, View } from "react-native";


export default function Index() {
  const router = useRouter(); // 2. Initialize the router

 useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/login"); // Change to your login modal route
    }, 3000); // 3 seconds

    return () => clearTimeout(timer);
  }, []);


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

    </View>
  );
}