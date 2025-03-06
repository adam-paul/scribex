import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as aiService from '@/services/ai-service';
import { ExerciseSet } from '@/types/exercises';
import { useProgressStore } from './progress-store';
import { UserProgress } from '@/types/learning';
import { LEVELS } from '@/constants/levels';

// Storage adapter for lesson data
const createLessonStorage = () => {
  return {
    getItem: async (name: string): Promise<string | null> => {
      return await AsyncStorage.getItem(name);
    },
    setItem: async (name: string, value: string) => {
      await AsyncStorage.setItem(name, value);
    },
    removeItem: async (name: string) => {
      await AsyncStorage.removeItem(name);
    },
  };
};

// Type definitions
interface LessonStoreState {
  lessonSets: Record<string, ExerciseSet>;
  inProgressGenerations: string[];
  lastUpdated: Record<string, number>;
  
  // Functions
  setLessonForLevel: (levelId: string, exerciseSet: ExerciseSet) => void;
  hasLessonForLevel: (levelId: string) => boolean;
  getLessonForLevel: (levelId: string) => ExerciseSet | null;
  isLessonBeingGenerated: (levelId: string) => boolean;
  setGenerationInProgress: (levelId: string, inProgress: boolean) => void;
  preloadAllLessons: () => Promise<void>;
  preloadLesson: (levelId: string) => Promise<ExerciseSet | null>;
  clearLesson: (levelId: string) => void;
}

// Create store with persistence
export const useLessonStore = create<LessonStoreState>()(
  persist(
    (set, get) => ({
      lessonSets: {},
      inProgressGenerations: [],
      lastUpdated: {},

      setLessonForLevel: (levelId: string, exerciseSet: ExerciseSet) => {
        set((state) => ({
          lessonSets: { ...state.lessonSets, [levelId]: exerciseSet },
          lastUpdated: { ...state.lastUpdated, [levelId]: Date.now() },
        }));
      },

      hasLessonForLevel: (levelId: string) => {
        return !!get().lessonSets[levelId];
      },

      getLessonForLevel: (levelId: string) => {
        return get().lessonSets[levelId] || null;
      },

      isLessonBeingGenerated: (levelId: string) => {
        return get().inProgressGenerations.includes(levelId);
      },

      setGenerationInProgress: (levelId: string, inProgress: boolean) => {
        set((state) => ({
          inProgressGenerations: inProgress 
            ? [...state.inProgressGenerations, levelId]
            : state.inProgressGenerations.filter(id => id !== levelId)
        }));
      },

      clearLesson: (levelId: string) => {
        set((state) => {
          const newLessonSets = { ...state.lessonSets };
          const newLastUpdated = { ...state.lastUpdated };
          
          delete newLessonSets[levelId];
          delete newLastUpdated[levelId];
          
          return { 
            lessonSets: newLessonSets, 
            lastUpdated: newLastUpdated
          };
        });
      },

      preloadLesson: async (levelId: string) => {
        // Don't generate if already in progress
        if (get().isLessonBeingGenerated(levelId)) {
          return null;
        }

        // Check cache freshness (lesson data valid for 24 hours)
        const cachedLesson = get().getLessonForLevel(levelId);
        const lastUpdatedTime = get().lastUpdated[levelId] || 0;
        const isCacheFresh = (Date.now() - lastUpdatedTime) < 24 * 60 * 60 * 1000;

        if (cachedLesson && isCacheFresh) {
          return cachedLesson;
        }

        try {
          get().setGenerationInProgress(levelId, true);
          
          // Find level details to pass to generator
          const levelDetails = LEVELS.find(level => level.id === levelId);
          if (!levelDetails) {
            throw new Error(`Level not found: ${levelId}`);
          }

          // Generate exercise set
          const exerciseSet = await aiService.generateExerciseSet({
            levelId,
            difficulty: levelDetails.difficulty,
            type: levelDetails.type,
          });

          // Store the result
          get().setLessonForLevel(levelId, exerciseSet);
          return exerciseSet;
        } catch (error) {
          console.error(`Failed to preload lesson for level ${levelId}:`, error);
          return null;
        } finally {
          get().setGenerationInProgress(levelId, false);
        }
      },

      preloadAllLessons: async () => {
        const progressStore = useProgressStore.getState();
        const progress: UserProgress = progressStore.progress;
        const unlockedLevels = progress.unlockedLevels || [];
        
        // Add currently active level first to prioritize it
        const currentLevelId = progress.currentLevel;
        const levelIdsToLoad = currentLevelId 
          ? [currentLevelId, ...unlockedLevels.filter(id => id !== currentLevelId)]
          : unlockedLevels;

        // Generate lessons in sequence to avoid rate limiting issues
        for (const levelId of levelIdsToLoad) {
          try {
            await get().preloadLesson(levelId);
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.error(`Failed to preload lesson for ${levelId}:`, error);
            // Continue with next level
          }
        }
      },
    }),
    {
      name: 'scribex-lessons',
      storage: createJSONStorage(() => createLessonStorage()),
    }
  )
);