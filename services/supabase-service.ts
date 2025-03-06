import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProgress } from '@/types/learning';
import { WritingProject } from '@/types/writing';

// Get environment variables from app.config.js
const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl;
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.supabaseAnonKey;

// Create a custom storage implementation for web
const createWebStorage = () => {
  return {
    getItem: (key: string): Promise<string | null> => {
      try {
        // Check if window is defined (client-side) before accessing localStorage
        if (typeof window !== 'undefined') {
          const value = window.localStorage.getItem(key);
          return Promise.resolve(value);
        }
        // Return null if we're in a server environment
        return Promise.resolve(null);
      } catch (e) {
        console.error('localStorage getItem error:', e);
        return Promise.resolve(null);
      }
    },
    setItem: (key: string, value: string): Promise<void> => {
      try {
        // Check if window is defined (client-side) before accessing localStorage
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, value);
        }
        return Promise.resolve();
      } catch (e) {
        console.error('localStorage setItem error:', e);
        return Promise.resolve();
      }
    },
    removeItem: (key: string): Promise<void> => {
      try {
        // Check if window is defined (client-side) before accessing localStorage
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key);
        }
        return Promise.resolve();
      } catch (e) {
        console.error('localStorage removeItem error:', e);
        return Promise.resolve();
      }
    },
  };
};

// User profile type
export type UserProfile = {
  id: string;
  user_id: string;
  username: string;
  display_name?: string;
  level: number;
  xp: number;
  rank?: number;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
};

// Types
export type SupabaseUser = {
  id: string;
  email?: string;
  username?: string;
  profile?: UserProfile;
};

// Singleton class to manage Supabase instance
class SupabaseService {
  private static instance: SupabaseService;
  private supabase: SupabaseClient;
  private user: SupabaseUser | null = null;

  private constructor() {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase configuration. Check your environment variables.');
    }

    // Initialize Supabase client
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        // Storage is different depending on platform
        storage: Platform.OS === 'web' 
          ? createWebStorage()
          : {
              getItem: async (key: string) => {
                try {
                  return AsyncStorage.getItem(key);
                } catch (e) {
                  console.error('AsyncStorage getItem error:', e);
                  return null;
                }
              },
              setItem: async (key: string, value: string) => {
                try {
                  return AsyncStorage.setItem(key, value);
                } catch (e) {
                  console.error('AsyncStorage setItem error:', e);
                }
              },
              removeItem: async (key: string) => {
                try {
                  return AsyncStorage.removeItem(key);
                } catch (e) {
                  console.error('AsyncStorage removeItem error:', e);
                }
              },
            },
      },
    });

    // Initialize user from session
    this.initializeUser();
  }

  // Initialize user from existing session
  private async initializeUser() {
    const { data } = await this.supabase.auth.getSession();
    if (data?.session?.user) {
      this.user = {
        id: data.session.user.id,
        email: data.session.user.email || undefined,
      };
    }
  }
  
  // Public method to refresh user info
  public async refreshUser(): Promise<SupabaseUser | null> {
    const { data } = await this.supabase.auth.getUser();
    if (data?.user) {
      this.user = {
        id: data.user.id,
        email: data.user.email || undefined,
      };
      
      // Try to fetch the user profile
      const profile = await this.getUserProfile('refreshUser');
      if (profile && this.user) { // Check if this.user still exists
        this.user.profile = profile;
      }
      
      return this.user;
    }
    return null;
  }

  // Get instance (singleton pattern)
  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  // Get Supabase client directly
  public getClient(): SupabaseClient {
    return this.supabase;
  }

  // Authentication Methods
  public async signUp(email: string, password: string): Promise<{user: SupabaseUser | null, needsEmailVerification: boolean}> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        // Set custom redirect URL for email verification
        emailRedirectTo: Platform.OS === 'web' 
          ? `${window.location.origin}/email-verified.html` 
          : 'scribex://auth/callback',
      },
    });

    if (error) {
      console.error('Signup error:', error.message);
      return { user: null, needsEmailVerification: false };
    }

    // Check if email confirmation is required
    const needsEmailVerification = data.session === null && data.user !== null;

    if (data?.user) {
      this.user = {
        id: data.user.id,
        email: data.user.email || undefined,
      };
      
      if (!needsEmailVerification && data.session) {
        // If no email verification needed, store the session
        return { user: this.user, needsEmailVerification: false };
      } else {
        // Email verification needed
        return { user: this.user, needsEmailVerification: true };
      }
    }

    return { user: null, needsEmailVerification: false };
  }

  public async signIn(email: string, password: string): Promise<SupabaseUser | null> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error.message);
      return null;
    }

    if (data?.user) {
      this.user = {
        id: data.user.id,
        email: data.user.email || undefined,
      };
      return this.user;
    }

    return null;
  }

  public async signOut(): Promise<void> {
    // Clear user reference first to prevent any data operations during signout
    this.user = null;
    // Then sign out from Supabase
    await this.supabase.auth.signOut();
  }

  public getCurrentUser(): SupabaseUser | null {
    return this.user;
  }

  // Progress Management Methods
  public async saveProgress(progress: UserProgress, source: string = 'unknown'): Promise<boolean> {
    if (!this.user) {
      console.error(`Cannot save progress: No user is logged in (called from: ${source})`);
      return false;
    }

    try {
      const { error } = await this.supabase
        .from('user_progress')
        .upsert(
          { 
            user_id: this.user.id,
            progress_data: progress,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        console.error('Error saving progress:', error.message);
        return false;
      }

      return true;
    } catch (e) {
      console.error('Exception saving progress:', e);
      return false;
    }
  }

  // Save only specific fields of progress that have changed
  public async savePartialProgress(partialProgress: Partial<UserProgress>, source: string = 'unknown'): Promise<boolean> {
    if (!this.user) {
      console.error(`Cannot save partial progress: No user is logged in (called from: ${source})`);
      return false;
    }

    try {
      // First get current progress
      const { data, error: fetchError } = await this.supabase
        .from('user_progress')
        .select('progress_data')
        .eq('user_id', this.user.id)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching existing progress:', fetchError.message);
        return false;
      }
      
      // Merge with existing progress or create new
      const currentProgress = data?.progress_data as UserProgress || {
        currentLevel: 'mechanics-1',
        mechanicsProgress: 0,
        sequencingProgress: 0,
        voiceProgress: 0,
        completedLevels: [],
        unlockedLevels: ['mechanics-1'],
        totalScore: 0,
        dailyStreak: 0,
        achievements: [],
        lastUpdated: Date.now(),
      };
      
      const updatedProgress = {
        ...currentProgress,
        ...partialProgress,
        lastUpdated: Date.now()
      };
      
      // Save the merged progress
      const { error } = await this.supabase
        .from('user_progress')
        .upsert(
          { 
            user_id: this.user.id,
            progress_data: updatedProgress,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        console.error('Error saving partial progress:', error.message);
        return false;
      }

      return true;
    } catch (e) {
      console.error('Exception saving partial progress:', e);
      return false;
    }
  }

  public async getProgress(source: string = 'unknown'): Promise<UserProgress | null> {
    if (!this.user) {
      console.error(`Cannot get progress: No user is logged in (called from: ${source})`);
      return null;
    }

    try {
      const { data, error } = await this.supabase
        .from('user_progress')
        .select('progress_data')
        .eq('user_id', this.user.id)
        .single();

      if (error) {
        // If the error is 'not found', this is the first time - return null
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error getting progress:', error.message);
        return null;
      }

      return data?.progress_data as UserProgress;
    } catch (e) {
      console.error('Exception getting progress:', e);
      return null;
    }
  }

  // Writing Projects Management Methods
  public async saveWritingProjects(projects: WritingProject[], source: string = 'unknown'): Promise<boolean> {
    if (!this.user) {
      console.error(`Cannot save writing projects: No user is logged in (called from: ${source})`);
      return false;
    }

    try {
      const { error } = await this.supabase
        .from('user_writing_projects')
        .upsert(
          { 
            user_id: this.user.id,
            projects_data: projects,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        console.error('Error saving writing projects:', error.message);
        return false;
      }

      return true;
    } catch (e) {
      console.error('Exception saving writing projects:', e);
      return false;
    }
  }

  // Save a single writing project (more efficient than saving all)
  public async saveWritingProject(project: WritingProject, source: string = 'unknown'): Promise<boolean> {
    if (!this.user) {
      console.error(`Cannot save writing project: No user is logged in (called from: ${source})`);
      return false;
    }

    try {
      // First get current projects
      const { data, error: fetchError } = await this.supabase
        .from('user_writing_projects')
        .select('projects_data')
        .eq('user_id', this.user.id)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching existing projects:', fetchError.message);
        return false;
      }
      
      // Initialize or update projects list
      const currentProjects = (data?.projects_data as WritingProject[]) || [];
      const projectIndex = currentProjects.findIndex(p => p.id === project.id);
      
      let updatedProjects;
      if (projectIndex >= 0) {
        // Update existing project
        updatedProjects = [
          ...currentProjects.slice(0, projectIndex),
          project,
          ...currentProjects.slice(projectIndex + 1)
        ];
      } else {
        // Add new project
        updatedProjects = [...currentProjects, project];
      }
      
      // Save the updated projects list
      const { error } = await this.supabase
        .from('user_writing_projects')
        .upsert(
          { 
            user_id: this.user.id,
            projects_data: updatedProjects,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        console.error('Error saving writing project:', error.message);
        return false;
      }

      return true;
    } catch (e) {
      console.error('Exception saving writing project:', e);
      return false;
    }
  }

  // Delete a single writing project
  public async deleteWritingProject(projectId: string, source: string = 'unknown'): Promise<boolean> {
    if (!this.user) {
      console.error(`Cannot delete writing project: No user is logged in (called from: ${source})`);
      return false;
    }

    try {
      // First get current projects
      const { data, error: fetchError } = await this.supabase
        .from('user_writing_projects')
        .select('projects_data')
        .eq('user_id', this.user.id)
        .single();
      
      if (fetchError) {
        console.error('Error fetching existing projects:', fetchError.message);
        return false;
      }
      
      // Remove the project from the list
      const currentProjects = data?.projects_data as WritingProject[] || [];
      const updatedProjects = currentProjects.filter(p => p.id !== projectId);
      
      // Save the updated projects list
      const { error } = await this.supabase
        .from('user_writing_projects')
        .upsert(
          { 
            user_id: this.user.id,
            projects_data: updatedProjects,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        console.error('Error deleting writing project:', error.message);
        return false;
      }

      return true;
    } catch (e) {
      console.error('Exception deleting writing project:', e);
      return false;
    }
  }

  public async getWritingProjects(source: string = 'unknown'): Promise<WritingProject[] | null> {
    if (!this.user) {
      console.error(`Cannot get writing projects: No user is logged in (called from: ${source})`);
      return null;
    }

    try {
      const { data, error } = await this.supabase
        .from('user_writing_projects')
        .select('projects_data')
        .eq('user_id', this.user.id)
        .single();

      if (error) {
        // If the error is 'not found', this is the first time - return empty array
        if (error.code === 'PGRST116') {
          return [];
        }
        console.error('Error getting writing projects:', error.message);
        return null;
      }

      return data?.projects_data as WritingProject[];
    } catch (e) {
      console.error('Exception getting writing projects:', e);
      return null;
    }
  }

  // Profile Management Methods
  public async getUserProfile(source: string = 'unknown'): Promise<UserProfile | null> {
    if (!this.user) {
      console.error(`Cannot get profile: No user is logged in (called from: ${source})`);
      return null;
    }

    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', this.user.id)
        .single();

      if (error) {
        // If the error is 'not found', this user doesn't have a profile yet
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error getting user profile:', error.message);
        return null;
      }

      return data as UserProfile;
    } catch (e) {
      console.error('Exception getting user profile:', e);
      return null;
    }
  }

  public async createOrUpdateUserProfile(profileData: Partial<UserProfile>, source: string = 'unknown'): Promise<UserProfile | null> {
    if (!this.user) {
      console.error(`Cannot update profile: No user is logged in (called from: ${source})`);
      return null;
    }

    try {
      // Prepare the profile data with user_id
      const profile = {
        user_id: this.user.id,
        updated_at: new Date().toISOString(),
        ...profileData
      };

      // Check if profile exists
      const existingProfile = await this.getUserProfile();
      
      if (existingProfile) {
        // Update existing profile
        const { data, error } = await this.supabase
          .from('user_profiles')
          .update(profile)
          .eq('user_id', this.user.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating user profile:', error.message);
          return null;
        }

        return data as UserProfile;
      } else {
        // Create new profile
        const { data, error } = await this.supabase
          .from('user_profiles')
          .insert({
            ...profile,
            created_at: new Date().toISOString(),
            level: 1, // Default starting level
            xp: 0,    // Default starting XP
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating user profile:', error.message);
          return null;
        }

        return data as UserProfile;
      }
    } catch (e) {
      console.error('Exception updating user profile:', e);
      return null;
    }
  }

  public async updateUserLevel(level: number, xp: number, source: string = 'unknown'): Promise<boolean> {
    if (!this.user) {
      console.error(`Cannot update level: No user is logged in (called from: ${source})`);
      return false;
    }

    try {
      const { error } = await this.supabase
        .from('user_profiles')
        .update({ 
          level, 
          xp,
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', this.user.id);

      if (error) {
        console.error('Error updating user level:', error.message);
        return false;
      }

      return true;
    } catch (e) {
      console.error('Exception updating user level:', e);
      return false;
    }
  }

  // Get leaderboard data with pagination support
  public async getLeaderboardRanking(
    page: number = 0, 
    limit: number = 10
  ): Promise<{data: UserProfile[] | null, total: number}> {
    try {
      // First get the total count for pagination
      const { count, error: countError } = await this.supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });
        
      if (countError) {
        console.error('Error getting leaderboard count:', countError.message);
        return { data: null, total: 0 };
      }
      
      // Now get the actual data with pagination
      const offset = page * limit;
      
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .order('xp', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error getting leaderboard:', error.message);
        return { data: null, total: count || 0 };
      }

      return { 
        data: data as UserProfile[], 
        total: count || 0 
      };
    } catch (e) {
      console.error('Exception getting leaderboard:', e);
      return { data: null, total: 0 };
    }
  }
  
  // More efficient ranking query that only gets needed information
  public async getUserRank(source: string = 'unknown'): Promise<number | null> {
    if (!this.user) {
      console.error(`Cannot get rank: No user is logged in (called from: ${source})`);
      return null;
    }

    try {
      // Use the leaderboard view which has precomputed ranks
      const { data, error } = await this.supabase
        .from('leaderboard')
        .select('rank')
        .eq('user_id', this.user.id)
        .single();

      if (error) {
        console.error('Error getting user rank:', error.message);
        return null;
      }

      return data?.rank || null;
    } catch (e) {
      console.error('Exception getting user rank:', e);
      return null;
    }
  }
}

// Export the singleton instance
export default SupabaseService.getInstance();