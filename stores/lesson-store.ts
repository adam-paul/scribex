import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as aiService from '@/services/ai-service';
import { ExerciseSet, Exercise } from '@/types/exercises';
import { useProgressStore } from './progress-store';
import { UserProgress } from '@/types/learning';
import { LEVELS } from '@/constants/levels';
import { MAX_EXERCISES_PER_LEVEL } from '@/constants/exercises';

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
  // Exercise storage
  exercises: Record<string, Exercise[]>;
  inProgressGenerations: string[];
  lastUpdated: Record<string, number>;
  exerciseGenerationCounts: Record<string, number>;
  
  // Functions
  addExerciseToLevel: (levelId: string, exercise: Exercise) => void;
  hasExercisesForLevel: (levelId: string) => boolean;
  getExercisesForLevel: (levelId: string) => Exercise[];
  getExerciseCount: (levelId: string) => number;
  isLessonBeingGenerated: (levelId: string) => boolean;
  setGenerationInProgress: (levelId: string, inProgress: boolean) => void;
  preloadFirstExerciseIfNeeded: (levelId: string) => Promise<Exercise | null>;
  preloadPrioritizedLessons: () => Promise<void>;
  preloadRemainingExercises: (levelId: string, count: number) => Promise<void>;
  preloadAllLessons: () => Promise<void>;
  preloadExerciseForLevel: (levelId: string) => Promise<Exercise | null>;
  createExerciseSetFromCachedExercises: (levelId: string) => ExerciseSet | null;
  clearExercisesForLevel: (levelId: string) => void;
  clearAllExercises: () => void;
}

// Create store with persistence
export const useLessonStore = create<LessonStoreState>()(
  persist(
    (set, get) => ({
      exercises: {},
      inProgressGenerations: [],
      lastUpdated: {},
      exerciseGenerationCounts: {},

      addExerciseToLevel: (levelId: string, exercise: Exercise) => {
        set((state) => {
          const currentExercises = state.exercises[levelId] || [];
          const updatedExercises = [...currentExercises, exercise];
          
          return {
            exercises: { ...state.exercises, [levelId]: updatedExercises },
            lastUpdated: { ...state.lastUpdated, [levelId]: Date.now() },
          };
        });
      },

      hasExercisesForLevel: (levelId: string) => {
        const exercises = get().exercises[levelId] || [];
        return exercises.length > 0;
      },

      getExercisesForLevel: (levelId: string) => {
        return get().exercises[levelId] || [];
      },

      getExerciseCount: (levelId: string) => {
        return (get().exercises[levelId] || []).length;
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

      clearExercisesForLevel: (levelId: string) => {
        set((state) => {
          const newExercises = { ...state.exercises };
          const newLastUpdated = { ...state.lastUpdated };
          const newCounts = { ...state.exerciseGenerationCounts };
          
          delete newExercises[levelId];
          delete newLastUpdated[levelId];
          delete newCounts[levelId];
          
          return { 
            exercises: newExercises, 
            lastUpdated: newLastUpdated,
            exerciseGenerationCounts: newCounts
          };
        });
        
        console.log(`Cleared exercises for level ${levelId}`);
      },
      
      clearAllExercises: () => {
        console.log('Clearing all exercise cache to ensure fresh content');
        
        // Clear in-memory state
        set({
          exercises: {},
          lastUpdated: {},
          exerciseGenerationCounts: {}
        });
        
        // Also remove from AsyncStorage directly to ensure all persisted data is gone
        try {
          AsyncStorage.removeItem('scribex-lessons')
            .then(() => console.log('Successfully removed all cached exercises from storage'))
            .catch(error => console.error('Failed to remove cached exercises from storage:', error));
        } catch (error) {
          console.error('Error clearing exercise cache from storage:', error);
        }
      },

      createExerciseSetFromCachedExercises: (levelId: string) => {
        const exercises = get().getExercisesForLevel(levelId);
        
        if (exercises.length === 0) {
          return null;
        }
        
        // Find level information
        const level = LEVELS.find(l => l.id === levelId);
        if (!level) {
          return null;
        }
        
        // Get titles and descriptions
        const title = level.title || `Exercise Set for ${levelId}`;
        const description = level.description || 'Complete these exercises to advance your writing skills';
        
        return {
          id: `set-${levelId}-${Date.now()}`,
          levelId,
          title,
          description,
          exercises,
          requiredScore: 90, // PRD requirement: 90% accuracy to proceed
        };
      },

      preloadExerciseForLevel: async (levelId: string) => {
        // Don't generate if already in progress
        if (get().isLessonBeingGenerated(levelId)) {
          return null;
        }

        let retryCount = 0;
        const maxRetries = 2;
        
        while (retryCount <= maxRetries) {
          try {
            get().setGenerationInProgress(levelId, true);
            
            // Find level details to pass to generator
            const levelDetails = LEVELS.find(level => level.id === levelId);
            if (!levelDetails) {
              console.error(`Level not found: ${levelId}`);
              return null; // Return null instead of throwing
            }
  
            // Determine which exercise type to generate next
            const exerciseCount = get().getExerciseCount(levelId);
            const generationCount = get().exerciseGenerationCounts[levelId] || 0;
            
            // Choose exercise type - cycle through the types
            const exerciseTypes = ['multiple-choice', 'fill-in-blank', 'matching', 'reorder'];
            const exerciseType = exerciseTypes[generationCount % exerciseTypes.length];
            
            // Topics based on level type
            const topicsByType = {
              'mechanics': ['grammar', 'punctuation', 'sentence structure', 'parts of speech'],
              'sequencing': ['paragraph flow', 'transitions', 'essay organization', 'logical arguments'],
              'voice': ['writing style', 'audience awareness', 'descriptive writing', 'rhetoric']
            };
            
            // Select topics based on level type
            const topics = topicsByType[levelDetails.type as keyof typeof topicsByType] || ['writing'];
            const topic = topics[Math.floor(Math.random() * topics.length)];
            
            console.log(`Generating ${exerciseType} exercise about ${topic} for level ${levelId}`);
            
            // Generate a single exercise with the determined type
            const exercise = await aiService.generateAIExerciseWithType(
              levelId, 
              levelDetails.type, 
              topic, 
              exerciseType, 
              levelDetails.difficulty
            );
            
            // Store the generated exercise
            get().addExerciseToLevel(levelId, exercise);
            
            // Update generation count
            set((state) => ({
              exerciseGenerationCounts: {
                ...state.exerciseGenerationCounts,
                [levelId]: (state.exerciseGenerationCounts[levelId] || 0) + 1
              }
            }));
            
            console.log(`Successfully generated ${exerciseType} exercise for level ${levelId}`);
            return exercise;
            
          } catch (error) {
            console.error(`Failed to generate exercise for level ${levelId} (attempt ${retryCount + 1}/${maxRetries + 1}):`, error);
            retryCount++;
            
            if (retryCount <= maxRetries) {
              console.log(`Retrying exercise generation for level ${levelId}...`);
              // Wait before retrying to avoid rate limiting issues
              await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
              // After all retries fail, return null instead of throwing
              console.error(`All ${maxRetries + 1} attempts failed for level ${levelId}`);
              return null;
            }
          } finally {
            // Clear the in-progress flag after all retries or success
            get().setGenerationInProgress(levelId, false);
          }
        }
        
        return null; // Should never reach here but TypeScript wants a return
      },

      // Add a new function to preload only the first exercise for a level if none exists
      preloadFirstExerciseIfNeeded: (levelId: string) => {
        // Skip if already has exercises or generation in progress
        if (get().hasExercisesForLevel(levelId) || get().isLessonBeingGenerated(levelId)) {
          return Promise.resolve(null);
        }
        
        console.log(`Preloading first exercise for level ${levelId}`);
        return get().preloadExerciseForLevel(levelId);
      },

      // Add a new function to handle prioritized preloading of exercises
      preloadPrioritizedLessons: () => {
        // Get progress information
        const progressStore = useProgressStore.getState();
        const progress = progressStore.progress;
        const currentLevelId = progress.currentLevel;
        
        if (!currentLevelId) {
          console.log('No current level to preload');
          return Promise.resolve();
        }
        
        return (async () => {
          // Step 1: First ensure current level has at least one exercise
          console.log(`Ensuring current level ${currentLevelId} has at least one exercise`);
          if (!get().hasExercisesForLevel(currentLevelId)) {
            try {
              await get().preloadFirstExerciseIfNeeded(currentLevelId);
            } catch (error) {
              console.error(`Failed to preload first exercise for current level ${currentLevelId}:`, error);
            }
          }
          
          // Step 2: Find next level (highest priority after current)
          const nextLevelId = progressStore.getNextLevel(currentLevelId);
          if (nextLevelId && progress.unlockedLevels.includes(nextLevelId)) {
            console.log(`Ensuring next level ${nextLevelId} has at least one exercise`);
            try {
              await get().preloadFirstExerciseIfNeeded(nextLevelId);
            } catch (error) {
              console.error(`Failed to preload first exercise for next level ${nextLevelId}:`, error);
            }
          }
          
          // Step 3: If we have time and resources, continue loading more for current level
          const existingCount = get().getExerciseCount(currentLevelId);
          const exercisesNeeded = MAX_EXERCISES_PER_LEVEL - existingCount;
          
          if (exercisesNeeded > 0) {
            console.log(`Continuing to load remaining ${exercisesNeeded} exercises for current level in background`);
            get().preloadRemainingExercises(currentLevelId, exercisesNeeded);
          }
        })();
      },

      // Helper to preload remaining exercises without blocking
      preloadRemainingExercises: (levelId: string, count: number) => {
        // Run this in the background without awaiting
        (async () => {
          let generatedCount = 0;
          const maxRetries = 2;

          while (generatedCount < count) {
            try {
              // Check if we already have enough exercises
              const currentExercises = get().getExercisesForLevel(levelId);
              if (currentExercises.length >= MAX_EXERCISES_PER_LEVEL) {
                console.log(`Level ${levelId} already has ${currentExercises.length} exercises, stopping generation`);
                break;
              }

              // Generate next exercise
              console.log(`Generating exercise ${generatedCount + 1}/${count} for level ${levelId}`);
              const exercise = await get().preloadExerciseForLevel(levelId);
              
              if (exercise) {
                generatedCount++;
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 800));
              } else {
                // Not an error, just log status and continue trying
                console.log(`Exercise ${generatedCount + 1} for ${levelId} not generated yet, continuing...`);
                // Wait a full second before checking again for the first exercise
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            } catch (error) {
              // Not an error state, just log and continue
              console.log(`Temporary setback generating exercise for ${levelId}, will retry...`);
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        })();
        
        // Return resolved promise since this function doesn't actually wait for completion
        return Promise.resolve();
      },

      // Update the original preloadAllLessons to use the new prioritized approach
      preloadAllLessons: () => {
        console.log('Starting prioritized lesson preloading');
        return get().preloadPrioritizedLessons()
          .then(() => {
            console.log('Prioritized preloading initiated');
          });
      },
    }),
    {
      name: 'scribex-lessons',
      storage: createJSONStorage(() => createLessonStorage()),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Error rehydrating lesson store:', error);
        } else {
          console.log('Lesson store successfully rehydrated');
          
          // If we detect very old data, clear it automatically
          if (state && state.lastUpdated) {
            const now = Date.now();
            const oldestAllowedData = now - (7 * 24 * 60 * 60 * 1000); // 7 days
            
            // Check if any cached exercises are more than 7 days old
            let hasOldData = false;
            Object.values(state.lastUpdated).forEach(timestamp => {
              if (timestamp < oldestAllowedData) {
                hasOldData = true;
              }
            });
            
            // If we have old data, clear everything to ensure fresh content
            if (hasOldData) {
              console.log('Detected old exercise data, clearing cache');
              setTimeout(() => {
                useLessonStore.getState().clearAllExercises();
              }, 0);
            }
          }
        }
      }
    }
  )
);