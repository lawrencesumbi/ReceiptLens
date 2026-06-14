import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, useTheme } from "../context/ThemeContext"; // Ensure this path matches your file structure

function RootLayoutNav() {
  const { isDark } = useTheme();

  return (
    <>
      {/* This automatically toggles status bar icons (clock/battery) between dark and light */}
      <StatusBar style={isDark ? "light" : "dark"} />
      
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />  
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />  
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />  
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}