export type Choice = {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
};

export type Exercise = {
  id: string;
  levelId: string;
  type: 'multiple-choice' | 'fill-in-blank' | 'matching' | 'reorder';
  question: string;
  instruction: string;
  choices?: Choice[];
  correctAnswer?: string;
  fillOptions?: string[];
  matchingPairs?: {left: string, right: string}[];
  reorderItems?: {id: string, text: string}[];
  correctOrder?: string[];
  explanation: string;
};

export type ExerciseSet = {
  id: string;
  levelId: string;
  title: string;
  description: string;
  exercises: Exercise[];
  requiredScore: number;
  timeLimit?: number;
};

export type ExerciseProgress = {
  exerciseId: string;
  completed: boolean;
  correct: boolean;
  attempts: number;
  timeSpent: number;
};

export type ExerciseSetResults = {
  setId: string;
  levelId: string;
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  completed: boolean;
  passedThreshold: boolean;
  exercises: {
    id: string;
    correct: boolean;
    attempts: number;
  }[];
};