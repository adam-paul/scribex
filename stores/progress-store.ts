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

interface ProgressState {
  progress: UserProgress;
  offlineChanges: boolean;
  lastSyncTime: number | null;
  
  // Progress Management
  setProgress: (progress: Partial<UserProgress>) => void;
  completeLevel: (levelId: string) => Promise<void>;
  unlockLevel: (levelId: string) => Promise<void>;
  incrementStreak: () => Promise<void>;
  addPoints: (points: number) => Promise<void>;
  getNextLevel: (currentLevelId: string) => string | null;
  updateCategoryProgress: (category: 'mechanics' | 'sequencing' | 'voice', value: number) => Promise<void>;
  
  // Achievement System
  unlockAchievement: (achievementId: string) => Promise<Achievement | null>;
  
  // Sync Management
  syncWithServer: () => Promise<boolean>;
  markSynced: () => void;
  updateUserProfileFromProgress: () => Promise<void>;
  
  // Content Structure & Navigation
  isCategoryUnlocked: (category: 'mechanics' | 'sequencing' | 'voice') => boolean;
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
        
        // Check if current level is completed and should unlock next level
        if (mechanicsProgress >= 100 && currentLevel === 'mechanics-1') {
          console.log('Mechanics-1 completed, unlocking mechanics-2');
          // Unlock mechanics-2 when mechanics-1 is 100% complete
          if (!unlockedLevels.includes('mechanics-2')) {
            await get().unlockLevel('mechanics-2');
          }
          
          // Mark the current level as completed
          if (!completedLevels.includes(currentLevel)) {
            await get().completeLevel(currentLevel);
          }
          
          // Set current level to mechanics-2
          set((state) => ({
            progress: {
              ...state.progress,
              currentLevel: 'mechanics-2',
              mechanicsProgress: 0, // Reset mechanics progress for the new level
              lastUpdated: Date.now()
            }
          }));
        }
        
        // Check for unlocking sequencing category
        if (mechanicsProgress >= 100 && currentLevel === 'mechanics-2') {
          console.log('Mechanics-2 completed, checking for sequencing unlock');
          
          // Mark mechanics-2 as completed
          if (!completedLevels.includes(currentLevel)) {
            await get().completeLevel(currentLevel);
          }
          
          // Unlock sequencing if we've reached the threshold
          if (mechanicsProgress >= CATEGORY_UNLOCK_THRESHOLDS.sequencing) {
            const sequencingLevel = LEVELS.find(l => l.id === 'sequencing-1');
            if (sequencingLevel && !unlockedLevels.includes(sequencingLevel.id)) {
              console.log('Unlocking sequencing-1');
              await get().unlockLevel(sequencingLevel.id);
              
              // Update current level to sequencing-1
              set((state) => ({
                progress: {
                  ...state.progress,
                  currentLevel: 'sequencing-1',
                  lastUpdated: Date.now()
                }
              }));
            }
          }
        }
        
        // Check for unlocking voice category
        if (sequencingProgress >= CATEGORY_UNLOCK_THRESHOLDS.voice) {
          const voiceLevel = LEVELS.find(l => l.id === 'voice-1');
          if (voiceLevel && !unlockedLevels.includes(voiceLevel.id)) {
            console.log('Unlocking voice-1');
            await get().unlockLevel(voiceLevel.id);
          }
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
        
      completeLevel: async (levelId) => {
        // Check network status
        const netInfo = await NetInfo.fetch();
        
        set((state) => {
          // Don't add the level if it's already marked as completed
          if (state.progress.completedLevels.includes(levelId)) {
            return { progress: state.progress };
          }
          
          // Update state with completion
          const updatedProgress = {
            ...state.progress,
            completedLevels: [...state.progress.completedLevels, levelId],
            lastUpdated: Date.now()
          };
          
          return {
            progress: updatedProgress,
            offlineChanges: !netInfo.isConnected,
          };
        });
        
        // Try to sync with server if online
        if (netInfo.isConnected) {
          await get().syncWithServer();
        }
      },
        
      unlockLevel: async (levelId) => {
        // Check network status
        const netInfo = await NetInfo.fetch();
        
        set((state) => {
          // Don't add the level if it's already unlocked
          if (state.progress.unlockedLevels.includes(levelId)) {
            return { progress: state.progress };
          }
          
          return {
            progress: {
              ...state.progress,
              unlockedLevels: [...state.progress.unlockedLevels, levelId],
              lastUpdated: Date.now()
            },
            offlineChanges: !netInfo.isConnected,
          };
        });
        
        // Try to sync with server if online
        if (netInfo.isConnected) {
          await get().syncWithServer();
        }
      },
        
      incrementStreak: async () => {
        // Check network status
        const netInfo = await NetInfo.fetch();
        
        set((state) => ({
          progress: {
            ...state.progress,
            dailyStreak: state.progress.dailyStreak + 1,
            lastUpdated: Date.now()
          },
          offlineChanges: !netInfo.isConnected,
        }));
        
        // Try to sync with server if online
        if (netInfo.isConnected) {
          await get().syncWithServer();
        }
      },
        
      addPoints: async (points) => {
        // Check network status
        const netInfo = await NetInfo.fetch();
        
        set((state) => ({
          progress: {
            ...state.progress,
            totalScore: state.progress.totalScore + points,
            lastUpdated: Date.now()
          },
          offlineChanges: !netInfo.isConnected,
        }));
        
        // Try to sync with server if online
        if (netInfo.isConnected) {
          await get().syncWithServer();
        }
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
        // Check network status
        const netInfo = await NetInfo.fetch();
        
        set((state) => {
          switch (category) {
            case 'mechanics':
              return {
                progress: {
                  ...state.progress,
                  mechanicsProgress: Math.max(state.progress.mechanicsProgress, value),
                  lastUpdated: Date.now()
                },
                offlineChanges: !netInfo.isConnected,
              };
            case 'sequencing':
              return {
                progress: {
                  ...state.progress,
                  sequencingProgress: Math.max(state.progress.sequencingProgress, value),
                  lastUpdated: Date.now()
                },
                offlineChanges: !netInfo.isConnected,
              };
            case 'voice':
              return {
                progress: {
                  ...state.progress,
                  voiceProgress: Math.max(state.progress.voiceProgress, value),
                  lastUpdated: Date.now()
                },
                offlineChanges: !netInfo.isConnected,
              };
            default:
              return { progress: state.progress };
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
        
        // Try to sync with server if online
        if (netInfo.isConnected) {
          await get().syncWithServer();
        }
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
        
        // Check network status
        const netInfo = await NetInfo.fetch();
        
        // Update state
        set((state) => ({
          progress: {
            ...state.progress,
            achievements: [...state.progress.achievements, unlockedAchievement],
            lastUpdated: Date.now()
          },
          offlineChanges: !netInfo.isConnected,
        }));
        
        // Try to sync with server if online
        if (netInfo.isConnected) {
          await get().syncWithServer();
        }
        
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