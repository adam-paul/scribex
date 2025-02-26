import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { UserProgress } from '@/types/learning';
import { WritingProject } from '@/types/writing';

// Get environment variables from app.config.js
const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl;
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.supabaseAnonKey;

// Types
export type SupabaseUser = {
  id: string;
  email?: string;
  username?: string;
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
          ? localStorage 
          : {
              getItem: async (key: string) => {
                try {
                  // Import AsyncStorage directly, not destructured
                  const AsyncStorage = await import('@react-native-async-storage/async-storage');
                  return AsyncStorage.default.getItem(key);
                } catch (e) {
                  console.error('AsyncStorage getItem error:', e);
                  return null;
                }
              },
              setItem: async (key: string, value: string) => {
                try {
                  const AsyncStorage = await import('@react-native-async-storage/async-storage');
                  return AsyncStorage.default.setItem(key, value);
                } catch (e) {
                  console.error('AsyncStorage setItem error:', e);
                }
              },
              removeItem: async (key: string) => {
                try {
                  const AsyncStorage = await import('@react-native-async-storage/async-storage');
                  return AsyncStorage.default.removeItem(key);
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
          ? `${window.location.origin}/auth/callback` 
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
    await this.supabase.auth.signOut();
    this.user = null;
  }

  public getCurrentUser(): SupabaseUser | null {
    return this.user;
  }

  // Progress Management Methods
  public async saveProgress(progress: UserProgress): Promise<boolean> {
    if (!this.user) {
      console.error('Cannot save progress: No user is logged in');
      return false;
    }

    try {
      // First verify that authentication is complete and the user exists in the database
      // This prevents foreign key constraint violations
      try {
        const { data: userData, error: userError } = await this.supabase.auth.getUser();
        
        if (userError || !userData.user || userData.user.id !== this.user.id) {
          console.error('Cannot save progress: Authentication not fully established');
          return false;
        }
      } catch (authError) {
        console.error('Error verifying authentication:', authError);
        return false;
      }

      // Now proceed with the save operation
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

  public async getProgress(): Promise<UserProgress | null> {
    if (!this.user) {
      console.error('Cannot get progress: No user is logged in');
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
  public async saveWritingProjects(projects: WritingProject[]): Promise<boolean> {
    if (!this.user) {
      console.error('Cannot save writing projects: No user is logged in');
      return false;
    }

    try {
      // First verify that authentication is complete and the user exists in the database
      // This prevents foreign key constraint violations
      try {
        const { data: userData, error: userError } = await this.supabase.auth.getUser();
        
        if (userError || !userData.user || userData.user.id !== this.user.id) {
          console.error('Cannot save writing projects: Authentication not fully established');
          return false;
        }
      } catch (authError) {
        console.error('Error verifying authentication:', authError);
        return false;
      }

      // Now proceed with the save operation
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

  public async getWritingProjects(): Promise<WritingProject[] | null> {
    if (!this.user) {
      console.error('Cannot get writing projects: No user is logged in');
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
}

// Export the singleton instance
export default SupabaseService.getInstance();