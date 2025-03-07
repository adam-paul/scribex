import React, { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, Text, StyleSheet, Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/constants/colors';
import { useProgressStore } from '@/stores/progress-store';

/**
 * This is the entry point of the app.
 * It detects platform and redirects accordingly:
 * - On web: redirects directly to the web writer
 * - On mobile: redirects to auth or tabs based on authentication status
 */
export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const loadServerData = useProgressStore(state => state.loadServerData);
  const { loadUserData } = useAuth();

  // For deployed web version, detect if this is running in a browser
  const isRunningInBrowser = Platform.OS === 'web' && 
    typeof window !== 'undefined' && 
    !/localhost|192\.168/.test(window.location.hostname); // Skip for local dev

  useEffect(() => {
    if (!isLoading && !isRunningInBrowser) {
      console.log('Root index rendering with auth state:', { isAuthenticated, isLoading, platform: Platform.OS });
    }
    
    // Preload user data when authenticated (mobile only)
    if (isAuthenticated && !isLoading && !isRunningInBrowser) {
      console.log('Loading user data and server data');
      loadServerData();
      loadUserData();
    }
  }, [isAuthenticated, isLoading, loadServerData, loadUserData]);
  
  // While checking auth, show a clean loading screen
  if (isLoading && !isRunningInBrowser) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  // For web deployment, bypass auth flow completely and go straight to web writer
  if (isRunningInBrowser) {
    console.log('Web deployment detected, redirecting directly to web writer');
    return <Redirect href="/web" />;
  }
  
  // For mobile app, maintain original behavior
  if (isAuthenticated) {
    console.log('Root index redirecting to tabs');
    return <Redirect href="/(tabs)" />;
  } else {
    console.log('Root index redirecting to auth');
    return <Redirect href="/auth" />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  }
}); 