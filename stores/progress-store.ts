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
        const { mechanicsProgress, sequencingProgress } = get().progress;
        
        switch(category) {
          case 'mechanics':
            return true; // Always unlocked by default
          case 'sequencing':
            return mechanicsProgress >= CATEGORY_UNLOCK_THRESHOLDS.sequencing; 
          case 'voice':
            return sequencingProgress >= CATEGORY_UNLOCK_THRESHOLDS.voice;
          default:
            return false;
        }
      },
      
      // Check progress and unlock next levels and categories if thresholds are met
      checkAndUnlockNextContent: async () => {
        const { progress } = get();
        const { mechanicsProgress, sequencingProgress, unlockedLevels, completedLevels, currentLevel } = progress;
        
        console.log('Checking content unlocks. Current state:', {
          currentLevel,
          completedLevels,
          unlockedLevels,
          mechanicsProgress,
          sequencingProgress
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
                  // Reset category progress when moving to a new level within same category
                  ...(nextLevelId.includes(levelId.split('-')[0]) ? 
                      { [levelId.split('-')[0] + 'Progress']: 0 } : {}),
                  lastUpdated: Date.now()
                }
              }));
            }
          }
        };
        
        // Handle category unlocking based on thresholds
        const unlockCategoryIfNeeded = async (
          prerequisiteProgress: number,
          prerequisiteThreshold: number,
          categoryToUnlock: string,
          levelToUnlock: string
        ) => {
          if (prerequisiteProgress >= prerequisiteThreshold) {
            // Find the level in global levels array
            const levelObj = LEVELS.find(l => l.id === levelToUnlock);
            
            // Unlock if it exists and isn't already unlocked
            if (levelObj && !unlockedLevels.includes(levelToUnlock)) {
              console.log(`Unlocking ${categoryToUnlock} category: ${levelToUnlock}`);
              await get().unlockLevel(levelToUnlock);
            }
          }
        };
        
        // Process level progression
        if (currentLevel === 'mechanics-1') {
          await handleLevelProgress('mechanics-1', mechanicsProgress, 'mechanics-2');
        } else if (currentLevel === 'mechanics-2') {
          await handleLevelProgress('mechanics-2', mechanicsProgress, 'sequencing-1');
        }
        
        // Process category unlocks based on thresholds
        
        // Sequencing category unlock
        const mechanicsLevelsCompleted = 
          completedLevels.includes('mechanics-1') && 
          completedLevels.includes('mechanics-2');
          
        if (mechanicsLevelsCompleted || mechanicsProgress >= CATEGORY_UNLOCK_THRESHOLDS.sequencing) {
          await unlockCategoryIfNeeded(
            mechanicsProgress, 
            CATEGORY_UNLOCK_THRESHOLDS.sequencing,
            'sequencing',
            'sequencing-1'
          );
        }
        
        // Voice category unlock  
        const sequencingLevelCompleted = completedLevels.includes('sequencing-1');
        if (sequencingLevelCompleted || sequencingProgress >= CATEGORY_UNLOCK_THRESHOLDS.voice) {
          await unlockCategoryIfNeeded(
            sequencingProgress,
            CATEGORY_UNLOCK_THRESHOLDS.voice,
            'voice',
            'voice-1'
          );
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
        
      // Helper function to update state and queue sync
      _updateProgressAndSync: async (updateFn) => {
        // Check network status once
        const netInfo = await NetInfo.fetch();
        
        // Apply the update function to state
        set((state) => {
          const result = updateFn(state);
          // If no changes, return original state
          if (!result) return state;
          
          return {
            ...result,
            offlineChanges: !netInfo.isConnected,
          };
        });
        
        // Sync once after state update if online
        if (netInfo.isConnected) {
          await get().syncWithServer();
        }
      },

      completeLevel: async (levelId) => {
        await get()._updateProgressAndSync((state) => {
          // Don't add the level if it's already marked as completed
          if (state.progress.completedLevels.includes(levelId)) {
            return null;
          }
          
          // Update state with completion
          return {
            progress: {
              ...state.progress,
              completedLevels: [...state.progress.completedLevels, levelId],
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
          // Get current progress for the category
          let currentProgress;
          switch (category) {
            case 'mechanics': 
              currentProgress = state.progress.mechanicsProgress;
              break;
            case 'sequencing': 
              currentProgress = state.progress.sequencingProgress;
              break;
            case 'voice': 
              currentProgress = state.progress.voiceProgress;
              break;
            default:
              return null;
          }
          
          // Only update if the new value is higher
          if (value <= currentProgress) {
            return null;
          }
          
          // Update the specific category progress
          switch (category) {
            case 'mechanics':
              return {
                progress: {
                  ...state.progress,
                  mechanicsProgress: value,
                  lastUpdated: Date.now()
                }
              };
            case 'sequencing':
              return {
                progress: {
                  ...state.progress,
                  sequencingProgress: value,
                  lastUpdated: Date.now()
                }
              };
            case 'voice':
              return {
                progress: {
                  ...state.progress,
                  voiceProgress: value,
                  lastUpdated: Date.now()
                }
              };
            default:
              return null;
          }
        });
        
        // Log the current progress to help debug progression
        const { mechanicsProgress, currentLevel } = get().progress;
        console.log(`Updated ${category} progress to ${value}%`, { 
          currentLevel,
          mechanicsProgress
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
        const { progress } = get();
        
        // Calculate XP based on progress
        const xp = calculateXP(progress);
        
        // Calculate level based on XP
        const level = calculateLevel(xp);
        
        // Update user profile with new level and XP
        await supabaseService.updateUserLevel(level, xp);
        
        // Refresh user data to get updated profile
        await supabaseService.refreshUser();
      },
      
      syncWithServer: async () => {
        const { progress, offlineChanges } = get();
        
        // Don't sync if there are no changes
        if (!offlineChanges) {
          return true;
        }
        
        try {
          // Save progress to server
          const success = await supabaseService.saveProgress(progress);
          
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
        
        // Update user profile with XP after rehydration if user is authenticated
        // This ensures the profile XP is always in sync with the progress
        setTimeout(async () => {
          const user = supabaseService.getCurrentUser();
          if (user) {
            try {
              // Calculate XP based on progress
              const xp = calculateXP(state.progress);
              
              // Calculate level based on XP
              const level = calculateLevel(xp);
              
              // Update user profile with new level and XP
              await supabaseService.updateUserLevel(level, xp);
              
              // Refresh user data to get updated profile
              await supabaseService.refreshUser();
              
              console.log('Updated user profile with XP:', xp, 'and level:', level);
            } catch (error) {
              console.error('Error updating user profile after rehydration:', error);
            }
          }
        }, 1000); // Delay to ensure auth is initialized
      }
    }
  )
);