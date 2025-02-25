import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Platform, View, ActivityIndicator } from "react-native";
import { ErrorBoundary } from "./error-boundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useProgressStore } from "@/stores/progress-store";

// Set to false to maintain progress data between app launches
const DEV_RESET_PROGRESS_ON_LAUNCH = false;

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });
  
  const resetProgress = useProgressStore(state => state.resetProgress);

  useEffect(() => {
    if (error) {
      console.error(error);
      throw error;
    }
  }, [error]);
  
  // Reset progress on app launch in development mode
  useEffect(() => {
    if (DEV_RESET_PROGRESS_ON_LAUNCH) {
      console.log('Development mode: Resetting progress data');
      resetProgress();
    }
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <RootLayoutNav />
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

function RootLayoutNav() {
  // Get auth loading state to show loading indicator
  const { isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Platform.OS === 'ios' ? '#007AFF' : '#6200EE'} />
      </View>
    );
  }
  
  return (
    <Stack screenOptions={{
      // Remove animation options that might be causing issues
      headerShown: false
    }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
    </Stack>
  );
}