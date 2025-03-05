import React, { createContext, useState, useEffect, useContext, ReactNode, useMemo } from 'react';
import supabaseService, { SupabaseUser, UserProfile } from '@/services/supabase-service';
import { useProgressStore } from '@/stores/progress-store';
import { useWritingStore } from '@/stores/writing-store';

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
  
  // Load user data from Supabase - simplified version
  const loadUserData = useMemo(() => {
    return async (): Promise<void> => {
      if (!user) return;
      
      try {
        console.log('Loading user data from Supabase...');
        
        // Load all data in parallel for better performance
        const [progressData, writingData, userProfile] = await Promise.all([
          supabaseService.getProgress(),
          supabaseService.getWritingProjects(),
          supabaseService.getUserProfile()
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
          });
          await supabaseService.refreshUser();
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
  }, [user, setProgress, resetProgress, setProjects]);

  // Set up auth state - simplified
  useEffect(() => {
    console.log('Initializing authentication state...');
    
    // Check for existing session
    const initializeAuth = async () => {
      try {
        const { data, error } = await supabaseService.getClient().auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setUser(null);
        } else if (data.session) {
          const refreshedUser = await supabaseService.refreshUser();
          setUser(refreshedUser);
          
          // Load user data immediately
          setTimeout(() => loadUserData(), 0);
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
          const refreshedUser = await supabaseService.refreshUser();
          setUser(refreshedUser);
          
          // Load user data on sign in
          if (event === 'SIGNED_IN') {
            setTimeout(() => loadUserData(), 0);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );
    
    // Begin authentication check
    initializeAuth();
    
    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  // Sign out function - simplified
  const signOut = async () => {
    try {
      setIsLoading(true);
      await supabaseService.signOut();
      setUser(null);
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
      const updatedProfile = await supabaseService.createOrUpdateUserProfile(profileData);
      
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