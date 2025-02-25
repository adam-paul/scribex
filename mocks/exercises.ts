import { ExerciseSet } from '@/types/exercises';

export const EXERCISE_SETS: ExerciseSet[] = [
  {
    id: 'mechanics-1-set-1',
    levelId: 'mechanics-1',
    title: 'Basic Sentence Structure',
    description: 'Learn to identify complete sentences and their components.',
    requiredScore: 90,
    exercises: [
      {
        id: 'ex-1',
        levelId: 'mechanics-1',
        type: 'multiple-choice',
        question: 'Which of the following is a complete sentence?',
        instruction: 'Select the option that forms a complete thought with both a subject and a predicate.',
        choices: [
          {
            id: '1',
            text: 'Running through the park.',
            isCorrect: false,
            explanation: 'This is a sentence fragment - it lacks a subject.',
          },
          {
            id: '2',
            text: 'The energetic dog ran through the park.',
            isCorrect: true,
            explanation: 'This is a complete sentence with a subject (dog) and predicate (ran).',
          },
          {
            id: '3',
            text: 'When the sun rises.',
            isCorrect: false,
            explanation: 'This is a dependent clause - it cannot stand alone.',
          },
          {
            id: '4',
            text: 'Beautiful and peaceful.',
            isCorrect: false,
            explanation: 'These are just adjectives without a subject or predicate.',
          },
        ],
        explanation: 'A complete sentence must have a subject (who/what) and a predicate (action/state) to express a complete thought.',
      },
      {
        id: 'ex-2',
        levelId: 'mechanics-1',
        type: 'multiple-choice',
        question: 'Identify the subject in this sentence: "The old computer crashed yesterday."',
        instruction: 'Choose the word or phrase that tells who or what the sentence is about.',
        choices: [
          {
            id: '1',
            text: 'crashed',
            isCorrect: false,
            explanation: 'This is the verb (predicate) of the sentence.',
          },
          {
            id: '2',
            text: 'yesterday',
            isCorrect: false,
            explanation: 'This is a time indicator (adverb).',
          },
          {
            id: '3',
            text: 'The old computer',
            isCorrect: true,
            explanation: 'This is the complete subject - it tells us what the sentence is about.',
          },
          {
            id: '4',
            text: 'old',
            isCorrect: false,
            explanation: 'This is just an adjective describing the computer.',
          },
        ],
        explanation: 'The subject is the part of the sentence that tells us who or what performs the action or is being described.',
      },
    ],
  },
];