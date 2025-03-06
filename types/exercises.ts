import { BaseEntity, NamedEntity, ExerciseType, ResultBase, ScoringInfo } from './base';

/**
 * Represents a choice in a multiple-choice exercise
 */
export interface Choice {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

/**
 * Matching pair used in matching exercises
 */
export interface MatchingPair {
  left: string;
  right: string;
}

/**
 * Reorder item used in reordering exercises
 */
export interface ReorderItem {
  id: string;
  text: string;
}

/**
 * Represents a single exercise of any type
 */
export interface Exercise extends BaseEntity {
  levelId: string;
  type: ExerciseType;
  question: string;
  instruction: string;
  explanation: string;
  
  // Type-specific properties
  choices?: Choice[];
  correctAnswer?: string;
  fillOptions?: string[];
  matchingPairs?: MatchingPair[];
  reorderItems?: ReorderItem[];
  correctOrder?: string[];
}

/**
 * A set of exercises that form a complete learning unit
 */
export interface ExerciseSet extends NamedEntity {
  levelId: string;
  exercises: Exercise[];
  requiredScore: number;
  timeLimit?: number;
}

/**
 * Tracks progress for a single exercise
 */
export interface ExerciseProgress extends ResultBase {
  exerciseId: string;
  isCompleted: boolean;
}

/**
 * Results for a completed exercise set
 */
export interface ExerciseSetResult extends ScoringInfo {
  setId: string;
  levelId: string;
  totalExercises: number;
  correctAnswers: number;
  isCompleted: boolean;
  exercises: Array<{
    id: string;
    isCorrect: boolean;
    attempts: number;
  }>;
  startedAt: number;
  completedAt: number;
}