import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Slot, useRouter, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { Platform, View, ActivityIndicator, Text } from "react-native";
import { ErrorBoundary } from "./error-boundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useProgressStore } from "@/stores/progress-store";

// Set to false to maintain progress data between app launches
const DEV_RESET_PROGRESS_ON_LAUNCH = false;

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

/**
 * This component handles navigation based on auth state
 */
function AuthNavigationEffect() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // Handle navigation based on auth state
  useEffect(() => {
    // Skip if still loading
    if (isLoading) return;
    
    // No need to load user data here - that's handled by AuthContext
    // This component only handles navigation
    
  }, [isLoading]); // Removed unnecessary dependencies
  
  // This component doesn't render anything
  return null;
}

/**
 * Root layout with simplified authentication flow
 */
export default function RootLayout() {
  // Load fonts
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });
  
  const resetProgress = useProgressStore(state => state.resetProgress);
  
  // Handle font loading errors
  useEffect(() => {
    if (error) {
      console.error("Font loading error:", error);
      throw error;
    }
  }, [error]);
  
  // Reset progress in dev mode if needed
  useEffect(() => {
    if (DEV_RESET_PROGRESS_ON_LAUNCH) {
      console.log('Development mode: Resetting progress data');
      resetProgress();
    }
  }, []);

  // Hide splash screen when fonts are loaded
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync().catch(e => {
        console.warn("Error hiding splash screen:", e);
      });
    }
  }, [loaded]);

  // Show nothing during initial loading
  if (!loaded) {
    return null; // Keep splash screen visible
  }

  // Once fonts are loaded, render the app with auth provider
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <AuthNavigationEffect />
          <RootLayoutNav />
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

/**
 * This component handles the loading state during authentication check
 */
function RootLayoutNav() {
  const { isLoading } = useAuth();
  
  // Show loading indicator while checking auth
  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#fff' 
      }}>
        <ActivityIndicator size="large" color={Platform.OS === 'ios' ? '#007AFF' : '#6200EE'} />
      </View>
    );
  }
  
  // Render the app content
  return <Slot />;
}