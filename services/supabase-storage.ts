import { StateStorage } from 'zustand/middleware';
import { PersistStorage, StorageValue } from 'zustand/middleware/persist';
import supabaseService from './supabase-service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { UserProgress } from '@/types';

// Unified storage mechanism that works across platforms
const getStorageMechanism = (): StateStorage => {
  // For web, use localStorage with defensive checks
  if (Platform.OS === 'web') {
    return {
      getItem: async (key: string): Promise<string | null> => {
        if (typeof window === 'undefined') return null;
        try {
          return window.localStorage.getItem(key);
        } catch (e) {
          console.error('localStorage error:', e);
          return null;
        }
      },
      setItem: async (key: string, value: string): Promise<void> => {
        if (typeof window === 'undefined') return;
        try {
          window.localStorage.setItem(key, value);
        } catch (e) {
          console.error('localStorage error:', e);
        }
      },
      removeItem: async (key: string): Promise<void> => {
        if (typeof window === 'undefined') return;
        try {
          window.localStorage.removeItem(key);
        } catch (e) {
          console.error('localStorage error:', e);
        }
      }
    };
  }
  
  // For native platforms, use AsyncStorage
  return AsyncStorage;
};

// Get the appropriate storage mechanism for the platform
const localStorageMechanism = getStorageMechanism();

// Extract data from store based on store type
const extractDataForSync = <T>(storeName: string, value: StorageValue<T>): any => {
  // Parse value if needed
  const parsedValue = typeof value === 'string' 
    ? JSON.parse(value) 
    : value;
  
  if (!parsedValue) return null;
  
  // Handle progress store
  if (storeName === 'progress') {
    // Check for progress in various locations
    if (parsedValue.progress) {
      return parsedValue.progress;
    } 
    if (parsedValue.state?.progress) {
      return parsedValue.state.progress;
    }
    if (typeof parsedValue === 'object' && 
        'currentLevel' in parsedValue) {
      return parsedValue;
    }
  } 
  
  // Handle writing store
  else if (storeName === 'writing') {
    // Check for projects array in various locations
    if (Array.isArray(parsedValue.projects)) {
      return parsedValue.projects;
    }
    if (Array.isArray(parsedValue.state?.projects)) {
      return parsedValue.state.projects;
    }
    if (Array.isArray(parsedValue)) {
      return parsedValue;
    }
  }
  
  return null;
};

// Implement StateStorage interface for Zustand middleware
export const createSupabaseStorage = <T>(storeName: string): PersistStorage<T> => {
  return {
    getItem: async (name: string): Promise<StorageValue<T> | null> => {
      try {
        // First try to get from local storage regardless of login state
        const localData = await localStorageMechanism.getItem(name);
        
        // Return local data - we'll handle cloud synchronization 
        // through explicit calls in the app, not through the storage mechanism
        console.log(`Rehydrating ${storeName} store from local storage`);
        return localData as StorageValue<T> | null;
      } catch (error) {
        console.error(`Error getting ${storeName}:`, error);
        return null;
      }
    },
    
    setItem: async (name: string, value: StorageValue<T>): Promise<void> => {
      try {
        // Save to local storage first (always)
        const valueString = typeof value === 'string' ? value : JSON.stringify(value);
        await localStorageMechanism.setItem(name, valueString);
        
        // During sign-in/sign-out transitions, don't sync with cloud
        // This simplifies the auth flow and prevents race conditions
      } catch (error) {
        console.error(`Storage error while saving ${storeName}:`, error);
      }
    },
    
    removeItem: async (name: string): Promise<void> => {
      try {
        // Remove from local storage
        await localStorageMechanism.removeItem(name);
        
        // Skip Supabase operations if not logged in
        const user = supabaseService.getCurrentUser();
        if (!user) return;
        
        // Reset data in Supabase to default state
        if (storeName === 'progress') {
          const emptyProgress: UserProgress = {
            currentLevel: 'mechanics-1',
            levelProgress: { 'mechanics-1': 0 },
            completedLevels: [],
            unlockedLevels: ['mechanics-1'],
            totalXp: 0,
            dailyStreak: 0,
            lastUpdated: Date.now(),
          };
          await supabaseService.saveProgress(emptyProgress);
        } else if (storeName === 'writing') {
          await supabaseService.saveWritingProjects([]);
        }
      } catch (error) {
        console.error(`Error removing ${storeName}:`, error);
      }
    }
  };
};

// Helper functions to create specific storage instances
export const createProgressStorage = <T>() => 
  createSupabaseStorage<T>('progress');

export const createWritingStorage = <T>() => 
  createSupabaseStorage<T>('writing');