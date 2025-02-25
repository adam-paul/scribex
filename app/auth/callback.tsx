import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import supabaseService from '@/services/supabase-service';

export default function AuthCallbackScreen() {
  const { error, access_token, refresh_token, type } = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Process the auth callback
    const handleAuthCallback = async () => {
      try {
        if (error) {
          console.error('Auth callback error:', error);
          // Wait briefly then redirect to auth screen
          setTimeout(() => router.replace('/auth'), 2000);
          return;
        }

        // If we have tokens, set the session
        if (access_token && refresh_token) {
          const { data, error: sessionError } = await supabaseService.getClient().auth.setSession({
            access_token: access_token as string,
            refresh_token: refresh_token as string,
          });

          if (sessionError) {
            console.error('Error setting session:', sessionError.message);
            setTimeout(() => router.replace('/auth'), 2000);
            return;
          }

          if (data?.user) {
            // Reinitialize user in service
            await supabaseService.refreshUser();
            
            // Redirect to home page
            setTimeout(() => router.replace('/'), 1000);
            return;
          }
        }

        // If we reached here without returning, redirect to auth screen
        setTimeout(() => router.replace('/auth'), 2000);
      } catch (e) {
        console.error('Auth callback exception:', e);
        setTimeout(() => router.replace('/auth'), 2000);
      }
    };

    handleAuthCallback();
  }, [error, access_token, refresh_token, type, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>Verifying your account...</Text>
      {error ? (
        <Text style={styles.errorText}>
          There was an error verifying your account. Redirecting...
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  text: {
    marginTop: 20,
    fontSize: 18,
    textAlign: 'center',
    color: colors.text,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
    color: colors.error,
  },
});