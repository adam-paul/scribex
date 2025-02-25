export type LearningLevel = {
  id: string;
  title: string;
  description: string;
  type: 'mechanics' | 'sequencing' | 'voice';
  difficulty: 1 | 2 | 3;
  required: boolean;
  prerequisites: string[];
  progress: number;
  completed: boolean;
  unlocked: boolean;
  order?: number;
  categoryProgress?: number;
};

export type Challenge = {
  id: string;
  title: string;
  description: string;
  type: 'story' | 'essay' | 'poetry' | 'journalism';
  wordCount: number;
  timeLimit?: number;
  reward: number;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
};

export type UserProgress = {
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
};
