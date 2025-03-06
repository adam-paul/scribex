import { LearningLevel } from '@/types/learning';

export const LEVELS: LearningLevel[] = [
  {
    id: 'mechanics-1',
    title: 'Basic Sentence Structure',
    description: 'Learn the fundamental building blocks of sentences and how to craft clear, effective statements.',
    type: 'mechanics',
    difficulty: 1,
    isRequired: true,
    prerequisites: [],
    progress: 0,
    isCompleted: false,
    isUnlocked: true,
    order: 1, // Add order for proper sequencing
  },
  {
    id: 'mechanics-2',
    title: 'Punctuation Mastery',
    description: 'Master the art of proper punctuation to enhance clarity and flow in your writing.',
    type: 'mechanics',
    difficulty: 1,
    isRequired: true,
    prerequisites: ['mechanics-1'],
    progress: 0,
    isCompleted: false,
    isUnlocked: false,
    order: 2, // Add order for proper sequencing
  },
  {
    id: 'sequencing-1',
    title: 'Paragraph Flow',
    description: 'Learn to create smooth transitions between ideas and maintain a logical flow in your writing.',
    type: 'sequencing',
    difficulty: 2,
    isRequired: true,
    prerequisites: ['mechanics-2'],
    progress: 0,
    isCompleted: false,
    isUnlocked: false,
    order: 1, // Add order for proper sequencing
  },
  {
    id: 'voice-1',
    title: 'Finding Your Voice',
    description: 'Develop your unique writing style while maintaining clarity and effectiveness.',
    type: 'voice',
    difficulty: 3,
    isRequired: true,
    prerequisites: ['sequencing-1'],
    progress: 0,
    isCompleted: false,
    isUnlocked: false,
    order: 1, // Add order for proper sequencing
  },
];

export const LEVEL_COLORS = {
  mechanics: '#732F2F', // Primary color
  sequencing: '#8A9A5B', // Secondary color
  voice: '#4F7C8C', // Accent color
};