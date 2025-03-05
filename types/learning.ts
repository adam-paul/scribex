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
 * Achievement that can be unlocked by users
 */
export interface Achievement extends BaseEntity {
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

/**
 * Tracks overall user progress across the application
 */
export interface UserProgress {
  currentLevel: string;
  mechanicsProgress: number;
  sequencingProgress: number;
  voiceProgress: number;
  completedLevels: string[];
  unlockedLevels: string[];
  totalScore: number;
  dailyStreak: number;
  achievements: Achievement[];
  lastUpdated: number;
}