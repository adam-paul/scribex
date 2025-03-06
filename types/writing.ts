import { BaseEntity, NamedEntity, WritingGenre, Difficulty } from './base';

/**
 * A user's writing project 
 */
export interface WritingProject extends BaseEntity {
  title: string;
  content: string;
  genre: WritingGenre;
  wordCount: number;
  targetWordCount?: number;
  dateCreated: string;
  dateModified: string;
  tags?: string[];
  isCompleted: boolean;
}

/**
 * Section in a writing template
 */
export interface TemplateSection {
  title: string;
  description: string;
  placeholder: string;
}

/**
 * Template for structured writing projects
 */
export interface WritingTemplate extends NamedEntity {
  genre: WritingGenre;
  structure: {
    sections: TemplateSection[];
  };
  exampleTopics: string[];
  recommendedWordCount: number;
  difficulty: Difficulty;
}

/**
 * AI-generated writing prompt
 */
export interface WritingPrompt extends BaseEntity {
  text: string;
  genre: WritingGenre;
  tags: string[];
}

/**
 * AI-generated writing feedback
 * Originally defined in ai-service.ts
 */
export interface WritingFeedback {
  score: number;           // 0-100 quality score
  grammarIssues: string[]; // List of grammar issues
  styleComments: string[]; // Comments on writing style
  strengthsPoints: string[]; // What the writer did well
  improvementPoints: string[]; // Areas for improvement
  overallFeedback: string; // Summary feedback
}

/**
 * Interface for detailed writing score
 * Originally defined in ai-service.ts
 */
export interface WritingScore {
  overall: number; // 0-100 overall quality
  mechanics: number; // 0-100 grammar, punctuation, etc.
  organization: number; // 0-100 structure, flow
  creativity: number; // 0-100 originality, engagement
  clarity: number; // 0-100 clearly expressed ideas
  scores: Record<string, number>; // Category-specific scores
  feedback: string; // Brief feedback message
}