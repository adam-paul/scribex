export type WritingGenre = 'essay' | 'story' | 'poetry' | 'journalism' | 'letter' | 'speech' | 'just-write';

export type WritingProject = {
  id: string;
  title: string;
  content: string;
  genre: WritingGenre;
  wordCount: number;
  targetWordCount?: number;
  dateCreated: string;
  dateModified: string;
  tags?: string[];
  completed: boolean;
};

export type WritingTemplate = {
  id: string;
  title: string;
  description: string;
  genre: WritingGenre;
  structure: {
    sections: {
      title: string;
      description: string;
      placeholder: string;
    }[];
  };
  exampleTopics: string[];
  recommendedWordCount: number;
  difficulty: 1 | 2 | 3;
};

export type WritingPrompt = {
  id: string;
  text: string;
  genre: WritingGenre;
  tags: string[];
};