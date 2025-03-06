import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Platform, View, ActivityIndicator, AppState, AppStateStatus } from "react-native";
import { ErrorBoundary } from "./error-boundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useProgressStore } from "@/stores/progress-store";
import { useLessonStore } from "@/stores/lesson-store";

// Set to false to maintain progress data between app launches
const DEV_RESET_PROGRESS_ON_LAUNCH = false;

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

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
  const { isLoading, isAuthenticated } = useAuth();
  
  // Listen for app state changes to resume lesson preloading
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Handler for app state changes
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App has come to the foreground
        // Resume any pending lesson generations after a short delay
        console.log('App returned to foreground, will resume exercise preloading');
        setTimeout(() => {
          console.log('Initiating prioritized preloading after app resume');
          useLessonStore.getState().preloadPrioritizedLessons().catch(err => {
            console.error('Prioritized lesson preloading failed on app resume:', err);
          });
        }, 2000);
      }
    };
    
    // Subscribe to app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [isAuthenticated]);
  
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