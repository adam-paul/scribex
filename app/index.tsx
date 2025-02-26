import React, { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/constants/colors';

/**
 * This is the entry point of the app.
 * It redirects to either auth or tabs based on authentication status.
 * We use a minimal approach to prevent any flashing.
 */
export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Add logging to help debug navigation issues
  useEffect(() => {
    if (!isLoading) {
      console.log('Root index rendering with auth state:', { isAuthenticated, isLoading });
    }
  }, [isAuthenticated, isLoading]);
  
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