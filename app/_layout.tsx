import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { supabase } from "../utils/supabase";

function RootLayoutNav() {
  const { isDark } = useTheme();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Listen for changes in authentication state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const inAuthGroup = segments[0] === '(auth)';

      if (session && inAuthGroup) {
        // If user is logged in and was in the auth group, send them home
        router.replace("/(tabs)/home");
      } else if (!session && !inAuthGroup) {
        // If user is NOT logged in and trying to access protected routes, send to login
        router.replace("/(auth)/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [segments]);

  return (
    <>
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