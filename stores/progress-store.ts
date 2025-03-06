import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import NetInfo from '@react-native-community/netinfo';
import { UserProgress, Achievement } from '@/types/learning';
import { LEVELS } from '@/constants/levels';
import { createProgressStorage } from '@/services/supabase-storage';
import supabaseService from '@/services/supabase-service';

// Sample achievements - in a real app, these would come from a server or database
const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-story',
    title: 'First Story',
    description: 'Completed your first writing project',
    icon: 'book',
    unlockedAt: '',
  },
  {
    id: 'mechanics-master',
    title: 'Mechanics Master',
    description: 'Completed all mechanics levels',
    icon: 'award',
    unlockedAt: '',
  },
  {
    id: 'sequencing-pro',
    title: 'Sequencing Pro',
    description: 'Completed all sequencing levels',
    icon: 'list',
    unlockedAt: '',
  },
  {
    id: 'voice-virtuoso',
    title: 'Voice Virtuoso',
    description: 'Completed all voice levels',
    icon: 'mic',
    unlockedAt: '',
  },
  {
    id: 'streak-7',
    title: 'Weekly Writer',
    description: 'Maintained a 7-day writing streak',
    icon: 'calendar',
    unlockedAt: '',
  },
  {
    id: 'streak-30',
    title: 'Monthly Maestro',
    description: 'Maintained a 30-day writing streak',
    icon: 'star',
    unlockedAt: '',
  },
  {
    id: 'points-1000',
    title: 'Point Collector',
    description: 'Earned 1000 total points',
    icon: 'trophy',
    unlockedAt: '',
  },
];

// XP constants for level progression
const XP_PER_LEVEL_COMPLETION = 100;
const XP_PER_ACHIEVEMENT = 50;
const XP_PER_POINT = 0.5; // Each point in totalScore gives 0.5 XP

// Level thresholds - how much XP needed for each level
const LEVEL_THRESHOLDS = [
  0,      // Level 1 (starting level)
  500,    // Level 2
  1200,   // Level 3
  2000,   // Level 4
  3000,   // Level 5
  4500,   // Level 6
  6500,   // Level 7
  9000,   // Level 8
  12000,  // Level 9
  15500,  // Level 10
  20000,  // Level 11
  25000,  // Level 12
  31000,  // Level 13
  38000,  // Level 14
  46000,  // Level 15
];

// Calculate level from XP
const calculateLevel = (xp: number): number => {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1; // Default to level 1
};

// Calculate XP from progress
const calculateXP = (progress: UserProgress): number => {
  let xp = 0;
  
  // XP from completed levels
  xp += progress.completedLevels.length * XP_PER_LEVEL_COMPLETION;
  
  // XP from achievements
  xp += progress.achievements.length * XP_PER_ACHIEVEMENT;
  
  // XP from total score
  xp += progress.totalScore * XP_PER_POINT;
  
  return Math.floor(xp);
};

// Type for progress category names
type ProgressCategory = 'mechanics' | 'sequencing' | 'voice';

interface ProgressState {
  progress: UserProgress;
  offlineChanges: boolean;
  lastSyncTime: number | null;
  
  // Internal helper (prefixed with underscore to indicate it's not meant for external use)
  _updateProgressAndSync: (updateFn: (state: ProgressState) => Partial<ProgressState> | null) => Promise<void>;
  
  // Progress Management
  setProgress: (progress: Partial<UserProgress>) => void;
  completeLevel: (levelId: string) => Promise<void>;
  unlockLevel: (levelId: string) => Promise<void>;
  incrementStreak: () => Promise<void>;
  addPoints: (points: number) => Promise<void>;
  getNextLevel: (currentLevelId: string) => string | null;
  updateCategoryProgress: (category: ProgressCategory, value: number) => Promise<void>;
  
  // Achievement System
  unlockAchievement: (achievementId: string) => Promise<Achievement | null>;
  
  // Sync Management
  syncWithServer: () => Promise<boolean>;
  markSynced: () => void;
  updateUserProfileFromProgress: () => Promise<void>;
  
  // Content Structure & Navigation
  isCategoryUnlocked: (category: ProgressCategory) => boolean;
  checkAndUnlockNextContent: () => Promise<void>;
  
  // Development Tools
  resetProgress: () => void;
}

const initialProgress: UserProgress = {
  currentLevel: 'mechanics-1',
  levelProgress: { 'mechanics-1': 0 },
  completedLevels: [],
  unlockedLevels: ['mechanics-1'],
  totalScore: 0,
  dailyStreak: 0,
  achievements: [],
  lastUpdated: Date.now(),
};

// Thresholds for unlocking content categories (percent)
const CATEGORY_UNLOCK_THRESHOLDS = {
  mechanics: 0,    // Available by default
  sequencing: 70,  // Unlock when mechanics is at 70%
  voice: 60        // Unlock when sequencing is at 60%
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      progress: initialProgress,
      offlineChanges: false,
      lastSyncTime: null,
      
      // Check if a category is unlocked based on progress in prerequisite category
      isCategoryUnlocked: (category) => {
        const { levelProgress } = get().progress;
        
        switch(category) {
          case 'mechanics':
            return true; // Always unlocked by default
          case 'sequencing':
            return levelProgress['mechanics-1'] >= CATEGORY_UNLOCK_THRESHOLDS.sequencing; 
          case 'voice':
            return levelProgress['sequencing-1'] >= CATEGORY_UNLOCK_THRESHOLDS.voice;
          default:
            return false;
        }
      },
      
      // Check progress and unlock next levels and categories if thresholds are met
      checkAndUnlockNextContent: async () => {
        const { progress } = get();
        const { levelProgress, unlockedLevels, completedLevels, currentLevel } = progress;
        
        console.log('Checking content unlocks. Current state:', {
          currentLevel,
          completedLevels,
          unlockedLevels,
          levelProgress
        });
        
        // Helper to handle level completion logic
        const handleLevelProgress = async (levelId: string, progress: number, nextLevelId: string) => {
          // If level is completed by progress threshold but not marked
          const isCompleted = completedLevels.includes(levelId);
          const isCompletedByProgress = progress >= 100 && currentLevel === levelId;
          
          if (!isCompleted && isCompletedByProgress) {
            console.log(`Marking ${levelId} as completed based on progress`);
            await get().completeLevel(levelId);
          }
          
          // Unlock next level if needed
          if ((isCompleted || isCompletedByProgress) && !unlockedLevels.includes(nextLevelId)) {
            console.log(`Unlocking next level: ${nextLevelId}`);
            await get().unlockLevel(nextLevelId);
            
            // Update current level if needed
            if (currentLevel === levelId) {
              console.log(`Advancing current level to ${nextLevelId}`);
              // Update current level and reset relevant progress counter
              set((state) => ({
                progress: {
                  ...state.progress,
                  currentLevel: nextLevelId,
                  levelProgress: {
                    ...state.progress.levelProgress,
                    [nextLevelId]: 0
                  },
                  lastUpdated: Date.now()
                }
              }));
            }
          }
        };
        
        // Process level progression
        if (currentLevel === 'mechanics-1') {
          await handleLevelProgress('mechanics-1', levelProgress['mechanics-1'], 'mechanics-2');
        } else if (currentLevel === 'mechanics-2') {
          await handleLevelProgress('mechanics-2', levelProgress['mechanics-2'], 'sequencing-1');
        }
        
        // Process category unlocks based on thresholds
        
        // Sequencing category unlock
        const mechanicsLevelsCompleted = 
          completedLevels.includes('mechanics-1') && 
          completedLevels.includes('mechanics-2');
          
        if (mechanicsLevelsCompleted || levelProgress['mechanics-1'] >= CATEGORY_UNLOCK_THRESHOLDS.sequencing) {
          await handleLevelProgress('sequencing-1', levelProgress['sequencing-1'], 'sequencing-2');
        }
        
        // Voice category unlock  
        const sequencingLevelCompleted = completedLevels.includes('sequencing-1');
        if (sequencingLevelCompleted || levelProgress['sequencing-1'] >= CATEGORY_UNLOCK_THRESHOLDS.voice) {
          await handleLevelProgress('voice-1', levelProgress['voice-1'], 'voice-2');
        }
      },
      
      resetProgress: () => {
        set({
          progress: initialProgress,
          offlineChanges: false,
          lastSyncTime: null
        });
      },
      
      setProgress: (newProgress) =>
        set((state) => ({
          progress: { 
            ...state.progress, 
            ...newProgress,
            lastUpdated: Date.now()
          },
          offlineChanges: true,
        })),
        
      // Helper function to update state and queue sync - optimized with partial updates
      _updateProgressAndSync: async (updateFn) => {
        const netInfo = await NetInfo.fetch();
        
        let changedFields: Partial<UserProgress> = {};
        
        set((state) => {
          const result = updateFn(state);
          if (!result) return state;
          
          if (result.progress) {
            const currentProgress = state.progress;
            const resultProgress = result.progress;
            
            // Type-safe way to check and copy changed fields
            (Object.keys(resultProgress) as Array<keyof UserProgress>).forEach(key => {
              if (JSON.stringify(resultProgress[key]) !== JSON.stringify(currentProgress[key])) {
                (changedFields as any)[key] = resultProgress[key];
              }
            });
          }
          
          return {
            ...result,
            offlineChanges: !netInfo.isConnected,
          };
        });
        
        // Sync only changed fields if online (delta update)
        if (netInfo.isConnected && Object.keys(changedFields).length > 0) {
          // Instead of syncing the entire progress, only sync changed fields
          try {
            await supabaseService.savePartialProgress(changedFields);
            get().markSynced();
          } catch (error) {
            console.error('Error syncing partial progress:', error);
            // Mark as having offline changes if sync fails
            set({ offlineChanges: true });
          }
        }
      },

      completeLevel: async (levelId) => {
        await get()._updateProgressAndSync((state) => {
          // Don't add the level if it's already marked as completed
          if (state.progress.completedLevels.includes(levelId)) {
            return null;
          }
          
          // Update state with completion AND set progress to 100%
          return {
            progress: {
              ...state.progress,
              completedLevels: [...state.progress.completedLevels, levelId],
              levelProgress: {
                ...state.progress.levelProgress,
                [levelId]: 100 // Always set completed levels to 100% progress
              },
              lastUpdated: Date.now()
            }
          };
        });
      },
        
      unlockLevel: async (levelId) => {
        await get()._updateProgressAndSync((state) => {
          // Don't add the level if it's already unlocked
          if (state.progress.unlockedLevels.includes(levelId)) {
            return null;
          }
          
          return {
            progress: {
              ...state.progress,
              unlockedLevels: [...state.progress.unlockedLevels, levelId],
              lastUpdated: Date.now()
            }
          };
        });
      },
        
      incrementStreak: async () => {
        await get()._updateProgressAndSync((state) => ({
          progress: {
            ...state.progress,
            dailyStreak: state.progress.dailyStreak + 1,
            lastUpdated: Date.now()
          }
        }));
      },
        
      addPoints: async (points) => {
        await get()._updateProgressAndSync((state) => ({
          progress: {
            ...state.progress,
            totalScore: state.progress.totalScore + points,
            lastUpdated: Date.now()
          }
        }));
      },
        
      getNextLevel: (currentLevelId) => {
        // Find the current level
        const currentLevel = LEVELS.find(level => level.id === currentLevelId);
        if (!currentLevel) return null;
        
        // Find levels that have this level as a prerequisite
        const nextLevels = LEVELS.filter(level => 
          level.prerequisites.includes(currentLevelId)
        );
        
        if (nextLevels.length === 0) return null;
        
        // Sort by difficulty and return the first one
        return nextLevels.sort((a, b) => a.difficulty - b.difficulty)[0].id;
      },
      
      updateCategoryProgress: async (category, value) => {
        await get()._updateProgressAndSync((state) => {
          const currentLevelId = state.progress.currentLevel;
          
          // Get current progress for this specific level
          const currentProgress = state.progress.levelProgress[currentLevelId] || 0;
          
          // Only update if the new value is higher
          if (value <= currentProgress) {
            return null;
          }
          
          return {
            progress: {
              ...state.progress,
              levelProgress: {
                ...state.progress.levelProgress,
                [currentLevelId]: value
              },
              lastUpdated: Date.now()
            }
          };
        });
        
        // Log the current progress to help debug progression
        const { levelProgress, currentLevel } = get().progress;
        console.log(`Updated level ${currentLevel} progress to ${value}%`, { 
          currentLevel,
          levelProgress: levelProgress[currentLevel]
        });
        
        // Check if any new categories or levels should be unlocked
        await get().checkAndUnlockNextContent();
      },
      
      unlockAchievement: async (achievementId) => {
        // Check if achievement is already unlocked
        const { progress } = get();
        if (progress.achievements.some(a => a.id === achievementId)) {
          return null;
        }
        
        // Find achievement in available achievements
        const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
        if (!achievement) {
          console.error(`Achievement ${achievementId} not found`);
          return null;
        }
        
        // Create unlocked achievement with timestamp
        const unlockedAchievement: Achievement = {
          ...achievement,
          unlockedAt: new Date().toISOString()
        };
        
        // Update state using our helper
        await get()._updateProgressAndSync((state) => ({
          progress: {
            ...state.progress,
            achievements: [...state.progress.achievements, unlockedAchievement],
            lastUpdated: Date.now()
          }
        }));
        
        return unlockedAchievement;
      },
      
      updateUserProfileFromProgress: async () => {
        // Check if user is logged in before updating profile
        const user = supabaseService.getCurrentUser();
        if (!user) return;
        
        const { progress } = get();
        
        // Calculate XP based on progress
        const xp = calculateXP(progress);
        
        // Calculate level based on XP
        const level = calculateLevel(xp);
        
        // Update user profile with new level and XP
        await supabaseService.updateUserLevel(level, xp, 'progress-store.updateUserProfileFromProgress');
        
        // Refresh user data to get updated profile
        await supabaseService.refreshUser();
      },
      
      syncWithServer: async () => {
        const { progress, offlineChanges } = get();
        
        // Don't sync if there are no changes
        if (!offlineChanges) {
          return true;
        }
        
        // Check network connectivity first
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
          return false;
        }
        
        try {
          // Avoid excessive writes by using a debounced strategy
          const lastSyncTime = get().lastSyncTime || 0;
          const timeSinceLastSync = Date.now() - lastSyncTime;
          
          // Only sync if it's been more than 10 seconds since last sync 
          // or if we're explicitly forcing a sync
          if (timeSinceLastSync < 10000) {
            return true; // Still return true to avoid triggering error flows
          }
        
          // Save progress to server (full sync in this case)
          const success = await supabaseService.saveProgress(progress, 'progress-store.syncWithServer');
          
          if (success) {
            // Update user profile with new level and XP
            await get().updateUserProfileFromProgress();
            
            // Mark as synced
            get().markSynced();
            return true;
          }
          
          return false;
        } catch (error) {
          console.error('Error syncing progress with server:', error);
          return false;
        }
      },
      
      markSynced: () => {
        set({
          offlineChanges: false,
          lastSyncTime: Date.now()
        });
      }
    }),
    {
      name: 'progress-storage',
      storage: createProgressStorage<ProgressState>(),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          console.log('Progress store failed to rehydrate');
          return;
        }
        console.log('Progress store rehydrated successfully');
      }
    }
  )
);