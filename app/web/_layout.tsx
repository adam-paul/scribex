import { Stack } from 'expo-router';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { AuthProvider } from '@/contexts/AuthContext';
import { colors } from '@/constants/colors';
import { useState, useEffect } from 'react';

export default function WebLayout() {
  const [loading, setLoading] = useState(true);
  
  // Add a timeout to hide the loading indicator even if auth is still processing
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 5000); // Hide after 5 seconds regardless of auth state
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <AuthProvider>
      <View style={styles.container}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading ScribeX...</Text>
          </View>
        )}
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        />
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    color: colors.text,
    marginTop: 16,
    fontSize: 16,
  },
}); 