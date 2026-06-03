import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        // Modern, clean layout settings
        headerStyle: {
          backgroundColor: "white",
        },
        headerShadowVisible: false, // Removes the ugly border line under the header
        headerTintColor: "#007AFF", // Colors the "Back" arrow button blue
        headerTitleStyle: {
          fontWeight: "600",
        },
      }}
    >
      {/* Configure individual screen behaviors */}
      <Stack.Screen 
        name="login" 
        options={{ 
          headerShown: false // Keeps your login screen full-screen without a top bar
        }} 
      />
      <Stack.Screen 
        name="signup" 
        options={{ 
          headerShown: false // Keeps your login screen full-screen without a top bar
        }} 
      />
    </Stack>
  );
}