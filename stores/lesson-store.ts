import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as aiService from '@/services/ai-service';
import { ExerciseSet, Exercise } from '@/types/exercises';
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

// Maximum number of exercises per level
const MAX_EXERCISES_PER_LEVEL = 5;

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

        try {
          get().setGenerationInProgress(levelId, true);
          
          // Find level details to pass to generator
          const levelDetails = LEVELS.find(level => level.id === levelId);
          if (!levelDetails) {
            throw new Error(`Level not found: ${levelId}`);
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
          console.error(`Failed to generate exercise for level ${levelId}:`, error);
          throw error; // Propagate the error instead of returning null
        } finally {
          get().setGenerationInProgress(levelId, false);
        }
      },

      preloadAllLessons: async () => {
        const progressStore = useProgressStore.getState();
        const progress: UserProgress = progressStore.progress;
        const unlockedLevels = progress.unlockedLevels || [];
        
        console.log('Starting background preloading of exercises...');
        
        // We'll always use fresh exercises - they're cleared on login in AuthContext
        
        // Add currently active level first to prioritize it
        const currentLevelId = progress.currentLevel;
        const levelIdsToLoad = currentLevelId 
          ? [currentLevelId, ...unlockedLevels.filter(id => id !== currentLevelId)]
          : unlockedLevels;
        
        console.log(`Levels to preload: ${levelIdsToLoad.join(', ')}`);

        // Generate exercises for each level until we have MAX_EXERCISES_PER_LEVEL
        for (const levelId of levelIdsToLoad) {
          // Check how many exercises we already have
          const existingCount = get().getExerciseCount(levelId);
          
          // Generate more exercises if needed
          const exercisesNeeded = MAX_EXERCISES_PER_LEVEL - existingCount;
          console.log(`Level ${levelId}: ${existingCount}/${MAX_EXERCISES_PER_LEVEL} exercises available, need ${exercisesNeeded} more`);
          
          for (let i = 0; i < exercisesNeeded; i++) {
            try {
              console.log(`Generating exercise ${i+1}/${exercisesNeeded} for level ${levelId}`);
              await get().preloadExerciseForLevel(levelId);
              // Small delay to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 700));
            } catch (error) {
              console.error(`Failed to preload exercise for ${levelId}:`, error);
              break; // Skip to next level if we encounter an error
            }
          }
        }
        
        console.log('Background preloading complete');
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