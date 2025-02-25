import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import supabaseService from '@/services/supabase-service';
import { colors } from '@/constants/colors';

type AuthMode = 'login' | 'signup';

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<AuthMode>('login');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [verificationSent, setVerificationSent] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        const user = await supabaseService.signIn(email, password);
        
        if (user) {
          // Login successful! Redirect to home screen
          console.log("Login successful, redirecting to home");
          router.replace('/');
        } else {
          // Check if user exists but is not verified
          const { data } = await supabaseService.getClient().auth.getUser();
          if (data?.user && !data.user.email_confirmed_at) {
            setError('Please verify your email before signing in.');
          } else {
            setError('Invalid login credentials');
          }
        }
      } else {
        // Signup flow
        const { user, needsEmailVerification } = await supabaseService.signUp(email, password);
        
        if (user && needsEmailVerification) {
          // Email verification needed
          setVerificationSent(true);
        } else if (user) {
          // No email verification needed, redirect to home
          router.replace('/');
        } else {
          setError('Failed to create account. Please try again.');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError(null);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.form}>
        {verificationSent ? (
          // Verification sent view
          <>
            <Text style={styles.title}>Check your email</Text>
            <Text style={styles.subtitle}>
              We've sent a verification link to {email}. Please check your inbox and verify your email to continue.
            </Text>
            <TouchableOpacity 
              style={[styles.button, { marginTop: 24 }]} 
              onPress={() => {
                setVerificationSent(false);
                setMode('login');
              }}
            >
              <Text style={styles.buttonText}>Return to Sign In</Text>
            </TouchableOpacity>
          </>
        ) : (
          // Normal auth form
          <>
            <Text style={styles.title}>
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </Text>
            
            <Text style={styles.subtitle}>
              {mode === 'login' 
                ? 'Sign in to sync your progress' 
                : 'Join ScribeX to track your writing journey'}
            </Text>
            
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}
            
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            
            <TouchableOpacity 
              style={styles.button} 
              onPress={handleAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity onPress={toggleMode} style={styles.toggleContainer}>
              <Text style={styles.toggleText}>
                {mode === 'login' 
                  ? "Don't have an account? Sign Up" 
                  : "Already have an account? Sign In"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: colors.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  toggleContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  toggleText: {
    color: colors.primary,
    fontSize: 14,
  },
  skipButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  skipText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});