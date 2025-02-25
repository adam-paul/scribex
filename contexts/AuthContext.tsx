import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useRouter, useSegments } from 'expo-router';
import supabaseService, { SupabaseUser } from '@/services/supabase-service';

interface AuthContextType {
  user: SupabaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  signOut: async () => {},
});

// Hook for components to get the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component to wrap the app
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  // Set up auth state
  useEffect(() => {
    // Check if we already have a session
    const initializeAuth = async () => {
      try {
        // Get the current session from Supabase
        const { data } = await supabaseService.getClient().auth.getSession();
        
        if (data.session) {
          // Session exists, refresh user data
          const refreshedUser = await supabaseService.refreshUser();
          setUser(refreshedUser);
          console.log('User authenticated:', refreshedUser?.email);
        } else {
          // No session
          setUser(null);
          console.log('No active session found');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabaseService.getClient().auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (session) {
          const refreshedUser = await supabaseService.refreshUser();
          setUser(refreshedUser);
        } else {
          setUser(null);
        }
      }
    );

    initializeAuth();

    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handle routing based on auth state
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    const isCallback = segments.includes('callback');

    // Don't redirect if on the callback page
    if (isCallback) return;

    // Debug output
    console.log('Auth routing check:', { 
      user: !!user, 
      inAuthGroup, 
      segments: segments.join('/') 
    });

    // If user is not signed in and not on auth page, redirect to auth
    if (!user && !inAuthGroup) {
      console.log('Not authenticated, redirecting to auth');
      router.replace('/auth');
    } else if (user && inAuthGroup && segments.length === 1) {
      // Only redirect if on the main auth page, not on callback
      console.log('Authenticated but on auth page, redirecting to home');
      router.replace('/');
    }
  }, [user, segments, isLoading, router]);

  // Sign out function
  const signOut = async () => {
    try {
      await supabaseService.signOut();
      setUser(null);
      router.replace('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}