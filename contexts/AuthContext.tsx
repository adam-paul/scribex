import React, { createContext, useState, useEffect, useContext, ReactNode, useMemo } from 'react';
import { useRouter, useSegments } from 'expo-router';
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
  const [dataLoaded, setDataLoaded] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  
  // Access the stores for data loading - using useMemo to prevent infinite renders
  const { resetProgress, setProgress } = useProgressStore();
  const projects = useWritingStore(state => state.projects);
  const setProjects = useMemo(() => {
    return (newProjects: any[]) => {
      // We need to manually set the projects array since there's no direct setter in the store
      useWritingStore.setState({ projects: newProjects });
    };
  }, []);
  
  // Load user data from Supabase - memoized to prevent re-creation on every render
  const loadUserData = useMemo(() => {
    return async (): Promise<void> => {
      try {
        if (!user) return;
        
        console.log('Loading user data from Supabase...');
        
        // Fetch progress data - now properly typed
        const progressData = await supabaseService.getProgress();
        if (progressData) {
          console.log('Progress data loaded from Supabase');
          setProgress(progressData);
        } else {
          // Initialize with default progress if nothing found
          resetProgress();
        }
        
        // Fetch writing projects - now properly typed
        const writingData = await supabaseService.getWritingProjects();
        if (writingData) {
          console.log('Writing projects loaded from Supabase:', writingData.length, 'projects');
          setProjects(writingData);
        } else {
          // Initialize with empty projects array if nothing found
          console.log('No writing projects found, initializing empty array');
          setProjects([]);
        }
        
        // Fetch or create user profile
        const userProfile = await supabaseService.getUserProfile();
        if (!userProfile) {
          console.log('No user profile found, creating default profile');
          // Create a default profile if none exists
          await supabaseService.createOrUpdateUserProfile({
            username: user.email?.split('@')[0] || `user_${user.id.substring(0, 8)}`,
            level: 1,
            xp: 0
          });
          
          // Refresh user to get the newly created profile
          await supabaseService.refreshUser();
        } else {
          console.log('User profile loaded from Supabase');
        }
        
        setDataLoaded(true);
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
  }, [user, setProgress, resetProgress, setProjects]);

  // Set up auth state with improved timing
  useEffect(() => {
    console.log('Initializing authentication state...');
    // We'll keep the splash screen visible until auth check completes
    
    // Check if we already have a session
    const initializeAuth = async () => {
      try {
        console.log('Checking for existing session...');
        // Get the current session from Supabase
        const { data } = await supabaseService.getClient().auth.getSession();
        
        if (data.session) {
          // Session exists, refresh user data
          console.log('Session found, refreshing user data...');
          const refreshedUser = await supabaseService.refreshUser();
          setUser(refreshedUser);
          console.log('User authenticated:', refreshedUser?.email);
          
          // Don't immediately load data - let the dedicated useEffect handle it
          // This prevents race conditions with authentication
          setDataLoaded(false); // Mark as not loaded to trigger the dedicated loader
          console.log('User authenticated, data will be loaded after auth verification');
        } else {
          // No session
          console.log('No active session found, user is not authenticated');
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setUser(null);
      } finally {
        // Now we can let the app proceed with proper routing
        console.log('Authentication check complete, removing loading state');
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
          
          // Load user data when signed in
          if (event === 'SIGNED_IN') {
            // We'll load data after setting the user, in a separate useEffect
            setDataLoaded(false);
          }
        } else {
          // Handle sign out - ensure we reset all necessary state
          if (event === 'SIGNED_OUT') {
            setUser(null);
            setDataLoaded(false);
            // Ensure we're not in loading state after sign out
            setIsLoading(false);
          }
        }
      }
    );

    // Begin authentication check
    initializeAuth();

    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Effect to load user data whenever the user changes
  useEffect(() => {
    const loadDataForUser = async () => {
      // Only load data if we have a user and haven't already loaded it
      if (user && !dataLoaded && !isLoading) {
        // IMPORTANT: Verify that auth is fully complete before loading data
        try {
          console.log('Verifying authentication status...');
          // Double-check with Supabase that authentication is complete
          const { data: authData } = await supabaseService.getClient().auth.getUser();
          
          if (authData?.user?.id !== user.id) {
            console.log('Authentication not fully synchronized yet, waiting...');
            // If IDs don't match, authentication isn't fully synchronized
            return;
          }
          
          console.log('Authentication verified, loading user data...');
          // Need to set dataLoaded first to prevent infinite loop
          setDataLoaded(true);
          await loadUserData();
        } catch (error) {
          console.error('Error verifying authentication:', error);
        }
      }
    };
    
    loadDataForUser();
  }, [user, dataLoaded, isLoading, loadUserData]);

  // Handle auth state changes - simplified to just logging
  useEffect(() => {
    if (isLoading) return;
    
    // Log current auth state for debugging
    console.log('Auth state:', { 
      authenticated: !!user, 
      loading: isLoading
    });
  }, [user, isLoading]);

  // Sign out function - improved to avoid navigation errors
  const signOut = async () => {
    try {
      console.log('Signing out user...');
      // First set loading to prevent flashes during sign out
      setIsLoading(true);
      
      // Clear Supabase session
      await supabaseService.signOut();
      
      // Clear user state - this will trigger the root index to redirect to auth
      setUser(null);
      console.log('Sign out complete');
      
      // Don't use router.replace here - let the auth state change trigger navigation
      // The root index component will handle the redirect based on isAuthenticated
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      // Ensure loading state is reset
      setIsLoading(false);
    }
  };

  // Expose the loadUserData function
  const handleLoadUserData = useMemo(() => {
    return async () => {
      // Only try to load if we're authenticated and not in loading state
      if (!isLoading && user) {
        // Reset the dataLoaded flag to ensure we can load again when manually requested
        setDataLoaded(false);
        await loadUserData();
      }
    };
  }, [isLoading, user, loadUserData]);

  // Update user profile
  const updateUserProfile = async (profileData: Partial<UserProfile>): Promise<UserProfile | null> => {
    if (!user) return null;
    
    try {
      const updatedProfile = await supabaseService.createOrUpdateUserProfile(profileData);
      
      if (updatedProfile) {
        // Update the user object with the new profile
        setUser(prevUser => {
          if (!prevUser) return null;
          return {
            ...prevUser,
            profile: updatedProfile
          };
        });
        return updatedProfile;
      }
      return null;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return null;
    }
  };

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => {
    return {
      user,
      isAuthenticated: !!user,
      isLoading,
      signOut,
      loadUserData: handleLoadUserData,
      updateUserProfile,
    };
  }, [user, isLoading, signOut, handleLoadUserData, updateUserProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}