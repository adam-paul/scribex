import React, { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/constants/colors';
import { useProgressStore } from '@/stores/progress-store';

/**
 * This is the entry point of the app.
 * It redirects to either auth or tabs based on authentication status.
 * We use a minimal approach to prevent any flashing.
 */
export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const loadServerData = useProgressStore(state => state.loadServerData);
  
  // Add logging to help debug navigation issues
  // Access the loadUserData function from auth context
  const { loadUserData } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      console.log('Root index rendering with auth state:', { isAuthenticated, isLoading });
    }
    
    // Preload user data when authenticated
    if (isAuthenticated && !isLoading) {
      // Load both progress data and writing projects
      console.log('Loading user data and server data');
      loadServerData();
      loadUserData();
    }
  }, [isAuthenticated, isLoading, loadServerData, loadUserData]);
  
  // While checking auth, show a clean loading screen
  // This prevents any flashing of content
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  // Redirect based on authentication status
  // No visible content here to prevent flashing
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