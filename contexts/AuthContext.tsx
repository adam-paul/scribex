import React, { createContext, useState, useEffect, useContext, ReactNode, useMemo } from 'react';
import supabaseService, { SupabaseUser, UserProfile } from '@/services/supabase-service';
import { useProgressStore } from '@/stores/progress-store';
import { useWritingStore } from '@/stores/writing-store';

// Extend Window interface to include our custom property
declare global {
  interface Window {
    _syncTimer: number | null;
  }
}

interface AuthContextType {
  user: SupabaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  loadUserData: () => Promise<void>;
  updateUserProfile: (profileData: Partial<UserProfile>) => Promise<UserProfile | null>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  signOut: async () => {},
  loadUserData: async () => {},
  updateUserProfile: async () => null,
});

// Hook for components to get the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component to wrap the app
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Access the stores for data loading
  const { resetProgress, setProgress } = useProgressStore();
  const setProjects = useMemo(() => {
    return (newProjects: any[]) => {
      useWritingStore.setState({ projects: newProjects });
    };
  }, []);
  
  // Load user data from Supabase (simplified)
  const loadUserData = useMemo(() => {
    return async (): Promise<void> => {
      // Skip if user is null
      if (!user) return;
      
      try {
        // Load all data in parallel for better performance
        const [progressData, writingData, userProfile] = await Promise.all([
          supabaseService.getProgress('AuthContext.loadUserData'),
          supabaseService.getWritingProjects('AuthContext.loadUserData'),
          supabaseService.getUserProfile('AuthContext.loadUserData')
        ]);
        
        // Set progress data or reset to default
        if (progressData) {
          setProgress(progressData);
        } else {
          resetProgress();
        }
        
        // Set writing projects or empty array
        setProjects(writingData || []);
        
        // Create user profile if needed
        if (!userProfile) {
          await supabaseService.createOrUpdateUserProfile({
            username: user.email?.split('@')[0] || `user_${user.id.substring(0, 8)}`,
            level: 1,
            xp: 0
          }, 'AuthContext.loadUserData.createProfile');
          await supabaseService.refreshUser();
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
  }, [user, setProgress, resetProgress, setProjects]);

  // Set up auth state once
  useEffect(() => {
    // Local variable to prevent duplicate initialization
    let isInitialized = false;
    
    // One-time auth initialization
    const initializeAuth = async () => {
      // Skip if already initialized
      if (isInitialized) return;
      isInitialized = true;
      
      try {
        const { data, error } = await supabaseService.getClient().auth.getSession();
        
        if (error) {
          setUser(null);
        } else if (data.session) {
          const refreshedUser = await supabaseService.refreshUser();
          setUser(refreshedUser);
          // Initial data load happens through the auth state listener
        } else {
          setUser(null);
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
        if (session) {
          // Only refresh user and load data on sign in
          if (event === 'SIGNED_IN') {
            try {
              const refreshedUser = await supabaseService.refreshUser();
              setUser(refreshedUser);
              // Load user data after user is set
              await loadUserData();
            } catch (error) {
              console.error('Error handling sign in:', error);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          // Clear user immediately on sign out
          setUser(null);
          // Reset stores
          resetProgress();
          setProjects([]);
        }
      }
    );
    
    // Begin initialization
    initializeAuth();
    
    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserData, resetProgress, setProjects]);

  // Sign out function with cleanup before auth signout
  const signOut = async () => {
    try {
      setIsLoading(true);
      
      // Clear any pending sync timers in the writing store
      if (typeof window !== 'undefined' && window['_syncTimer']) {
        clearTimeout(window['_syncTimer']);
        window['_syncTimer'] = null;
      }
      
      // Reset stores before sign out to prevent any last-minute sync attempts
      resetProgress();
      setProjects([]);
      
      // Now perform the actual sign out
      await supabaseService.signOut();
      // User will be set to null by the auth state change listener
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update user profile
  const updateUserProfile = async (profileData: Partial<UserProfile>): Promise<UserProfile | null> => {
    if (!user) return null;
    
    try {
      const updatedProfile = await supabaseService.createOrUpdateUserProfile(profileData, 'AuthContext.updateUserProfile');
      
      if (updatedProfile) {
        setUser(prevUser => prevUser ? {
          ...prevUser,
          profile: updatedProfile
        } : null);
        return updatedProfile;
      }
      return null;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return null;
    }
  };

  // Context value
  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    signOut,
    loadUserData,
    updateUserProfile,
  }), [user, isLoading, signOut, loadUserData, updateUserProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}