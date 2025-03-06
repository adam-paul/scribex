/**
 * Base types and shared primitives for the ScribeX application
 */

/**
 * Base entity with an ID and optional title/description
 */
export interface BaseEntity {
  id: string;
  title?: string;
  description?: string;
}

/**
 * Named entity with required title and description
 */
export interface NamedEntity extends BaseEntity {
  title: string;
  description: string;
}

/**
 * Interface for tracking progress
 */
export interface ProgressTrackable {
  progress: number;
  isCompleted: boolean;
}

/**
 * Common result tracking properties
 */
export interface ResultBase {
  attempts: number;
  isCorrect: boolean;
  timeSpent: number; // in milliseconds
}

/**
 * Types used across multiple domains
 */
export type Difficulty = 1 | 2 | 3;
export type ContentCategory = 'mechanics' | 'sequencing' | 'voice';
export type WritingGenre = 'essay' | 'story' | 'poetry' | 'journalism' | 'letter' | 'speech' | 'just-write';
export type ExerciseType = 'multiple-choice' | 'fill-in-blank' | 'matching' | 'reorder';

/**
 * Timestamp options for consistent date handling
 */
export interface TimestampInfo {
  createdAt?: number;
  updatedAt?: number;
  completedAt?: number;
}

/**
 * Scoring information used in exercises and assessments
 */
export interface ScoringInfo {
  score: number; // normalized to 0-100
  isPassed: boolean;
  requiredScore?: number;
}