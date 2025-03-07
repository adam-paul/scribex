import React, { createContext, useState, useEffect, useContext, ReactNode, useMemo } from 'react';
import supabaseService, { SupabaseUser, UserProfile } from '@/services/supabase-service';
import { useProgressStore } from '@/stores/progress-store';
import { useWritingStore } from '@/stores/writing-store';
import { useLessonStore } from '@/stores/lesson-store';

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
  refreshUserProfile: () => Promise<void>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  signOut: async () => {},
  loadUserData: async () => {},
  updateUserProfile: async () => null,
  refreshUserProfile: async () => {},
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
  
  // No duplicate clearExerciseCache function - we'll use useLessonStore.getState().clearAllExercises() directly

  // Load user data from Supabase (simplified)
  const loadUserData = useMemo(() => {
    return async (): Promise<void> => {
      // Skip if user is null
      if (!user) return;
      
      try {
        // First, aggressively clear exercise cache
        useLessonStore.getState().clearAllExercises();
        
        // Load all data in parallel for better performance
        const [writingData, userProfile] = await Promise.all([
          supabaseService.getWritingProjects('AuthContext.loadUserData'),
          supabaseService.getUserProfile('AuthContext.loadUserData')
        ]);
        
        // Load progress data using the new method
        await useProgressStore.getState().loadServerData();
        
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
        
        // Start prioritized preloading of lessons in background
        setTimeout(() => {
          console.log('Initiating prioritized preloading of lessons after login');
          useLessonStore.getState().preloadPrioritizedLessons().catch(err => {
            console.error('Prioritized lesson preloading failed after login:', err);
          });
        }, 3000); // Delay to prioritize UI loading
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
  }, [user, setProjects]);

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
              // User data will be loaded by the consumer after user is set
              // We don't immediately load data here to prevent duplicate loading
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
      
      // Clear all cached exercises to ensure the next login gets fresh content
      console.log('Clearing all exercises on sign out');
      useLessonStore.getState().clearAllExercises();
      
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

  // Add new refreshUserProfile function
  const refreshUserProfile = async (): Promise<void> => {
    if (!user) return;
    
    try {
      const refreshedUser = await supabaseService.refreshUser();
      setUser(refreshedUser);
    } catch (error) {
      console.error('Error refreshing user profile:', error);
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
    refreshUserProfile,
  }), [user, isLoading, signOut, loadUserData, updateUserProfile, refreshUserProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}