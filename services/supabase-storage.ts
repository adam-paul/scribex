import { StateStorage } from 'zustand/middleware';
import supabaseService from './supabase-service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Define a fallback storage mechanism
const getStorageMechanism = () => {
  // For web, use localStorage
  if (Platform.OS === 'web') {
    return {
      getItem: (key: string) => {
        try {
          const value = localStorage.getItem(key);
          return Promise.resolve(value);
        } catch (e) {
          console.error('localStorage error:', e);
          return Promise.resolve(null);
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
          return Promise.resolve();
        } catch (e) {
          console.error('localStorage error:', e);
          return Promise.resolve();
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
          return Promise.resolve();
        } catch (e) {
          console.error('localStorage error:', e);
          return Promise.resolve();
        }
      }
    };
  }
  
  // For native platforms, use AsyncStorage
  return AsyncStorage;
};

// Get the appropriate storage mechanism for the platform
const localStorageMechanism = getStorageMechanism();

// Implement StateStorage interface for Zustand middleware
export const createSupabaseStorage = (storeName: string): StateStorage => {
  return {
    getItem: async (name: string): Promise<string | null> => {
      try {
        // First try to get from local storage regardless of login state
        const localData = await localStorageMechanism.getItem(name);
        
        // Get user authentication status
        const user = supabaseService.getCurrentUser();
        
        // If no user is logged in, just return local data
        if (!user) {
          return localData;
        }
        
        // If user is logged in, try to get from Supabase
        try {
          let remoteData = null;
          
          if (storeName === 'progress') {
            remoteData = await supabaseService.getProgress();
          } else if (storeName === 'writing') {
            remoteData = await supabaseService.getWritingProjects();
          }
          
          // If we got data from Supabase, use it
          if (remoteData) {
            // The data should already be properly typed
            const stringifiedData = JSON.stringify(remoteData);
            // Also update local storage with remote data
            await localStorageMechanism.setItem(name, stringifiedData);
            return stringifiedData;
          }
          
          // If no remote data, fall back to local data
          return localData;
        } catch (supabaseError) {
          console.error(`Supabase fetch error: ${supabaseError}`);
          // Fall back to local data if Supabase fails
          return localData;
        }
      } catch (error) {
        console.error(`Error getting ${storeName}:`, error);
        return null;
      }
    },
    
    setItem: async (name: string, value: string | any): Promise<void> => {
      try {
        // Convert value to string if it's not already a string
        let valueString: string;
        
        if (typeof value === 'string') {
          valueString = value;
        } else {
          // Simply stringify object - it should be a serializable object
          valueString = JSON.stringify(value);
        }
        
        // Save to local storage
        await localStorageMechanism.setItem(name, valueString);
        
        // Check if user is logged in for Supabase sync
        const user = supabaseService.getCurrentUser();
        if (!user) {
          return; // No user, just keep local storage
        }
        
        // Parse value safely
        let parsedValue;
        try {
          parsedValue = JSON.parse(valueString);
        } catch (parseError) {
          // If parsing fails, try using the original value if it was already an object
          if (typeof value === 'object' && value !== null) {
            parsedValue = value;
          } else {
            console.error(`JSON parse error: ${parseError}`);
            return; // If we can't parse, don't proceed with Supabase save
          }
        }
        
        // Save to Supabase based on store type
        try {
          if (storeName === 'progress') {
            // For progress, extract ONLY the progress data to prevent nesting
            // Check both direct access and nested under state (Zustand persist structure)
            if (parsedValue && parsedValue.progress) {
              console.log('Saving only progress data to Supabase');
              await supabaseService.saveProgress(parsedValue.progress);
            } else if (parsedValue && parsedValue.state && parsedValue.state.progress) {
              console.log('Saving nested progress data to Supabase');
              await supabaseService.saveProgress(parsedValue.state.progress);
            } else {
              // If neither structure matches, try to save the whole object but log a warning
              console.warn('Unexpected progress format, attempting to save:', parsedValue);
              await supabaseService.saveProgress(parsedValue);
            }
          } else if (storeName === 'writing') {
            // For writing, extract ONLY the projects array to prevent nesting
            // Check both direct access and nested under state (Zustand persist structure)
            if (parsedValue && parsedValue.projects && Array.isArray(parsedValue.projects)) {
              console.log('Saving only projects array to Supabase:', parsedValue.projects.length);
              await supabaseService.saveWritingProjects(parsedValue.projects);
            } else if (parsedValue && parsedValue.state && parsedValue.state.projects && Array.isArray(parsedValue.state.projects)) {
              console.log('Saving nested projects array to Supabase:', parsedValue.state.projects.length);
              await supabaseService.saveWritingProjects(parsedValue.state.projects);
            } else {
              console.error('Invalid writing store format, skipping sync:', parsedValue);
            }
          }
        } catch (supabaseError) {
          console.error(`Supabase save error: ${supabaseError}`);
          // We already saved to AsyncStorage, so just log the error
        }
      } catch (error) {
        console.error(`Storage error: ${error}`);
      }
    },
    
    removeItem: async (name: string): Promise<void> => {
      try {
        // Remove from local storage
        await localStorageMechanism.removeItem(name);
        
        // Check if user is logged in
        const user = supabaseService.getCurrentUser();
        if (!user) {
          return;
        }
        
        // Clear data in Supabase
        try {
          if (storeName === 'progress') {
            // Use an empty object directly for progress
            await supabaseService.saveProgress({});
          } else if (storeName === 'writing') {
            // Use an empty array directly for writing projects
            await supabaseService.saveWritingProjects([]);
          }
        } catch (supabaseError) {
          console.error(`Supabase remove error: ${supabaseError}`);
        }
      } catch (error) {
        console.error(`Error removing ${storeName}:`, error);
      }
    }
  };
};

// Helper functions to create specific storage instances
export const createProgressStorage = () => 
  createSupabaseStorage('progress');

export const createWritingStorage = () => 
  createSupabaseStorage('writing');