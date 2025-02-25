/**
 * Types related to exercise and level results
 */

export type ExerciseResult = {
  exerciseId: string;
  isCorrect: boolean;
  attemptCount: number;
  timeTaken: number; // in milliseconds
};

export type ExerciseSetResult = {
  setId: string;
  levelId: string;
  correctAnswers: number;
  totalExercises: number;
  score: number; // percentage correct (0-100)
  completed: boolean;
  passedRequirement: boolean;
  results: ExerciseResult[];
  timeStarted: number; // timestamp
  timeCompleted: number; // timestamp
};

export type LevelCompletion = {
  levelId: string;
  completed: boolean;
  score: number; // percentage
  attempts: number;
  timeSpent: number; // in milliseconds
  completedAt?: number; // timestamp
};