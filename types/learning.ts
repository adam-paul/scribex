import { BaseEntity, NamedEntity, ContentCategory, Difficulty, WritingGenre, ProgressTrackable, ScoringInfo } from './base';

/**
 * Represents a learning level in the application
 */
export interface LearningLevel extends NamedEntity, ProgressTrackable {
  type: ContentCategory;
  difficulty: Difficulty;
  isRequired: boolean;
  prerequisites: string[];
  isUnlocked: boolean;
  order?: number;
  categoryProgress?: number;
}

/**
 * Represents a completed level with score and timing information
 */
export interface LevelCompletion extends ScoringInfo {
  levelId: string;
  isCompleted: boolean; 
  attempts: number;
  timeSpent: number;
  completedAt?: number;
}

/**
 * Represents a writing challenge for users
 */
export interface Challenge extends NamedEntity {
  type: WritingGenre;
  wordCount: number;
  timeLimit?: number;
  reward: number;
}

/**
 * Tracks overall user progress across the application
 */
export interface UserProgress {
  currentLevel: string;
  levelProgress: { [key: string]: number };  // Track progress per level
  completedLevels: string[];
  unlockedLevels: string[];
  totalXp: number;
  dailyStreak: number;
  lastUpdated: number;
}