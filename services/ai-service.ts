/**
 * AI Service for generating and evaluating content
 * Integrates with OpenAI API for NLP capabilities
 */

import { Exercise, ExerciseSet } from '@/types/exercises';
import { LEVELS } from '@/constants/levels';
import OpenAI from 'openai';

// Import Constants from Expo
import Constants from 'expo-constants';

// Get API key and feature flag from Expo Constants
const OPENAI_API_KEY = Constants.expoConfig?.extra?.openaiApiKey || 
                       process.env.OPENAI_API_KEY || 
                       'dummy-api-key';
const ENABLE_AI_FEATURES = Constants.expoConfig?.extra?.enableAiFeatures || false;

// Helper function to check if AI features are enabled and API key is valid
function isAiEnabled(): boolean {
  // Check if features are enabled and API key is valid (not the dummy key)
  return ENABLE_AI_FEATURES && OPENAI_API_KEY !== 'dummy-api-key';
}

// Log AI status on initialization
console.log(`AI Features: ${isAiEnabled() ? 'ENABLED' : 'DISABLED'}`);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Allow usage in React Native
});

// API request tracking for rate limiting
const apiRequestLog: {timestamp: number, endpoint: string}[] = [];
const MAX_REQUESTS_PER_MINUTE = 30;
const REQUEST_WINDOW_MS = 60 * 1000; // 1 minute

// Rate limiting check
async function checkRateLimit(endpoint: string): Promise<boolean> {
  const now = Date.now();
  // Remove requests older than the window
  const recentRequests = apiRequestLog.filter(req => 
    now - req.timestamp < REQUEST_WINDOW_MS
  );
  
  // Update request log
  apiRequestLog.length = 0;
  apiRequestLog.push(...recentRequests, {timestamp: now, endpoint});
  
  // Check if we're over the limit
  return recentRequests.length < MAX_REQUESTS_PER_MINUTE;
}

type AIRequestOptions = {
  levelId: string;
  difficulty?: number;
  type?: 'mechanics' | 'sequencing' | 'voice';
  count?: number;
};

// Function to generate an exercise based on the level and topic
export async function generateExercise(levelId: string, topic: string): Promise<Exercise> {
  // Check if AI features are enabled
  if (!isAiEnabled()) {
    console.log('AI features disabled. Using fallback exercise.');
    return getFallbackExercise(levelId, topic);
  }
  
  try {
    // Check rate limit
    if (!(await checkRateLimit('generateExercise'))) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    // Get level information for context
    const level = LEVELS.find(l => l.id === levelId);
    const levelType = level?.type || 'mechanics';
    
    // Create prompt based on level type and topic
    const prompt = `Create a multiple-choice exercise about ${topic} for students 
    learning writing skills related to ${levelType}. 
    Include a question, 4 answer choices (with one correct), and an explanation.
    Format as JSON with these fields: question, instruction, choices (array with id, text, isCorrect, explanation), explanation.`;
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an educational assistant creating writing exercises for students. Format your response as valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: "json_object" }
    });
    
    // Parse response
    const content = response.choices[0]?.message?.content || '';
    const exerciseData = JSON.parse(content);
    
    // Format response into our Exercise type
    return {
      id: `generated-${Date.now()}`,
      levelId: levelId,
      type: 'multiple-choice',
      question: exerciseData.question,
      instruction: exerciseData.instruction,
      choices: exerciseData.choices.map((choice: any, index: number) => ({
        id: (index + 1).toString(),
        text: choice.text,
        isCorrect: choice.isCorrect,
        explanation: choice.explanation,
      })),
      explanation: exerciseData.explanation,
    };
  } catch (error) {
    console.error('Error generating exercise:', error);
    return getFallbackExercise(levelId, topic);
  }
}

// Helper function for fallback exercises when AI is unavailable
function getFallbackExercise(levelId: string, topic: string): Exercise {
  return {
    id: `generated-${Date.now()}`,
    levelId: levelId,
    type: 'multiple-choice',
    question: `Question about ${topic}`,
    instruction: `Select the best answer related to ${topic}`,
    choices: [
      {
        id: '1',
        text: 'First option (correct)',
        isCorrect: true,
        explanation: 'This is the correct answer.',
      },
      {
        id: '2',
        text: 'Second option',
        isCorrect: false,
        explanation: 'This is incorrect.',
      },
      {
        id: '3',
        text: 'Third option',
        isCorrect: false,
        explanation: 'This is incorrect.',
      },
      {
        id: '4',
        text: 'Fourth option',
        isCorrect: false,
        explanation: 'This is incorrect.',
      }
    ],
    explanation: 'AI features are currently disabled. Using pre-generated exercise.',
  };
}

// Function to generate a complete exercise set with more structured options
export async function generateExerciseSet(options: AIRequestOptions): Promise<ExerciseSet> {
  const { levelId, count = 4 } = options; // Default to 4 exercises per set
  
  // Get level information
  const level = LEVELS.find(l => l.id === levelId);
  const levelType = level?.type || 'mechanics';
  const difficulty = level?.difficulty || 1;
  
  // Check if AI features are enabled
  if (!isAiEnabled()) {
    console.log('AI features disabled. Using fallback exercise set.');
    return getFallbackExerciseSet(levelId, levelType, count);
  }
  
  try {
    // Check rate limit
    if (!(await checkRateLimit('generateExerciseSet'))) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    console.log(`Generating AI exercise set for level: ${levelId}, type: ${levelType}, count: ${count}`);
    
    // Generate exercises using different exercise types
    const exercises: Exercise[] = [];
    
    // Define the exercise types we want to include in the set
    const exerciseTypes = ['multiple-choice', 'fill-in-blank', 'matching', 'reorder'];
    
    // Topics based on level type
    const topicsByType = {
      'mechanics': ['grammar', 'punctuation', 'sentence structure', 'parts of speech'],
      'sequencing': ['paragraph flow', 'transitions', 'essay organization', 'logical arguments'],
      'voice': ['writing style', 'audience awareness', 'descriptive writing', 'rhetoric']
    };
    
    // Select topics based on level type
    const topics = topicsByType[levelType as keyof typeof topicsByType] || ['writing'];
    
    // Generate AI exercises
    for (let i = 0; i < count; i++) {
      try {
        // Choose exercise type - cycle through the types
        const exerciseType = exerciseTypes[i % exerciseTypes.length];
        
        // Choose a topic
        const topic = topics[Math.floor(Math.random() * topics.length)];
        
        // Generate an AI exercise with specific type
        const aiExercise = await generateAIExerciseWithType(levelId, levelType, topic, exerciseType, difficulty);
        
        exercises.push(aiExercise);
      } catch (error) {
        console.error(`Error generating exercise ${i+1}:`, error);
        // If one exercise fails, continue with the others
      }
    }
    
    // If we couldn't generate any exercises, fall back to static ones
    if (exercises.length === 0) {
      throw new Error('Failed to generate any exercises');
    }
    
    // Get titles and descriptions based on level
    const title = getLevelTitle(levelId);
    const description = getLevelDescription(levelId);
    
    return {
      id: `set-${levelId}-${Date.now()}`,
      levelId,
      title,
      description,
      exercises,
      requiredScore: 90, // PRD requirement: 90% accuracy to proceed
    };
  } catch (error) {
    console.error('Error generating exercise set:', error);
    return getFallbackExerciseSet(levelId, levelType, count);
  }
}

// Generate an AI exercise with a specific type
async function generateAIExerciseWithType(
  levelId: string, 
  levelType: string,
  topic: string, 
  exerciseType: string,
  difficulty: number
): Promise<Exercise> {
  try {
    // Build prompt based on exercise type
    let systemPrompt = `You are an educational assistant creating a ${exerciseType} exercise about ${topic} for students learning writing skills related to ${levelType} at difficulty level ${difficulty}/5.`;
    let userPrompt = "";
    
    switch (exerciseType) {
      case 'multiple-choice':
        systemPrompt += " Create a multiple-choice question with 4 options (only one correct).";
        userPrompt = `Create a multiple-choice exercise about ${topic} for writing students.
        Format as JSON with:
        {
          "question": "clear question text",
          "instruction": "instructional text for the student",
          "choices": [
            {"id": "1", "text": "option 1", "isCorrect": true, "explanation": "why this is correct"},
            {"id": "2", "text": "option 2", "isCorrect": false, "explanation": "why this is wrong"},
            {"id": "3", "text": "option 3", "isCorrect": false, "explanation": "why this is wrong"},
            {"id": "4", "text": "option 4", "isCorrect": false, "explanation": "why this is wrong"}
          ],
          "explanation": "general explanation about the concept"
        }`;
        break;
        
      case 'fill-in-blank':
        systemPrompt += " Create a fill-in-the-blank exercise with 4 possible options.";
        userPrompt = `Create a fill-in-blank exercise about ${topic} for writing students.
        Format as JSON with:
        {
          "question": "sentence with _____ for the blank",
          "instruction": "instructional text for the student",
          "correctAnswer": "the correct word",
          "fillOptions": ["correct word", "wrong option", "wrong option", "wrong option"],
          "explanation": "explanation why the correct answer is right"
        }`;
        break;
        
      case 'matching':
        systemPrompt += " Create a matching exercise with 4 pairs to match.";
        userPrompt = `Create a matching pairs exercise about ${topic} for writing students.
        Format as JSON with:
        {
          "question": "match these items",
          "instruction": "instructional text for the student",
          "matchingPairs": [
            {"left": "item 1", "right": "matching definition 1"},
            {"left": "item 2", "right": "matching definition 2"},
            {"left": "item 3", "right": "matching definition 3"},
            {"left": "item 4", "right": "matching definition 4"}
          ],
          "explanation": "explanation of the matching concepts"
        }`;
        break;
        
      case 'reorder':
        systemPrompt += " Create a reordering exercise with 4 items to put in the correct sequence.";
        userPrompt = `Create a reordering exercise about ${topic} for writing students.
        Format as JSON with:
        {
          "question": "arrange these items in the correct order",
          "instruction": "instructional text for the student",
          "reorderItems": [
            {"id": "item1", "text": "first item text"},
            {"id": "item2", "text": "second item text"},
            {"id": "item3", "text": "third item text"},
            {"id": "item4", "text": "fourth item text"}
          ],
          "correctOrder": ["item1", "item2", "item3", "item4"],
          "explanation": "explanation of why this order is correct"
        }`;
        break;
        
      default:
        // Default to multiple-choice if type is not recognized
        return generateExercise(levelId, topic);
    }
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });
    
    // Parse response
    const content = response.choices[0]?.message?.content || '';
    const exerciseData = JSON.parse(content);
    
    // Format to Exercise type based on exercise type
    const baseExercise = {
      id: `${levelId}-${exerciseType}-${Date.now()}`,
      levelId,
      type: exerciseType as any, // Cast to satisfy TypeScript
      question: exerciseData.question,
      instruction: exerciseData.instruction,
      explanation: exerciseData.explanation
    };
    
    switch (exerciseType) {
      case 'multiple-choice':
        return {
          ...baseExercise,
          choices: exerciseData.choices
        } as Exercise;
        
      case 'fill-in-blank':
        return {
          ...baseExercise,
          correctAnswer: exerciseData.correctAnswer,
          fillOptions: exerciseData.fillOptions
        } as Exercise;
        
      case 'matching':
        return {
          ...baseExercise,
          matchingPairs: exerciseData.matchingPairs
        } as Exercise;
        
      case 'reorder':
        return {
          ...baseExercise,
          reorderItems: exerciseData.reorderItems,
          correctOrder: exerciseData.correctOrder
        } as Exercise;
        
      default:
        throw new Error(`Unsupported exercise type: ${exerciseType}`);
    }
  } catch (error) {
    console.error(`Error generating ${exerciseType} exercise:`, error);
    // Fall back to simpler exercise
    return generateExercise(levelId, topic);
  }
}

// Fallback exercise set when AI is unavailable
function getFallbackExerciseSet(levelId: string, levelType: string, count: number): ExerciseSet {
  console.log(`Using fallback exercise set for ${levelId}`);
  
  // Create a set of fallback exercises based on level type
  const exercises: Exercise[] = [];
  
  if (levelType === 'mechanics') {
    // Basic sentence structure fallbacks
    exercises.push({
      id: `${levelId}-ex-1`,
      levelId,
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
    });
    
    // Fill-in-blank exercise
    exercises.push({
      id: `${levelId}-ex-2`,
      levelId,
      type: 'fill-in-blank',
      question: 'Complete this sentence with the correct verb form: "Everyone in the classroom _____ excited about the field trip."',
      instruction: 'Type the correct verb that agrees with the subject "Everyone".',
      correctAnswer: 'is',
      fillOptions: ['is', 'are', 'were', 'be'],
      explanation: 'The subject "Everyone" is singular, so it takes the singular verb "is". Even though we may be referring to many people, collective nouns like "everyone" are treated as singular in English.',
    });
    
  } else if (levelType === 'sequencing') {
    // Paragraph transition fallbacks
    exercises.push({
      id: `${levelId}-ex-1`,
      levelId,
      type: 'multiple-choice',
      question: 'Which sentence best serves as a transition between paragraphs about climate change and conservation efforts?',
      instruction: 'Select the sentence that creates the smoothest transition.',
      choices: [
        {
          id: '1',
          text: 'Conservation is important.',
          isCorrect: false,
          explanation: 'This is too abrupt and doesn\'t connect the topics.',
        },
        {
          id: '2',
          text: 'With these climate effects in mind, people have developed various conservation strategies to address the damage.',
          isCorrect: true,
          explanation: 'This sentence connects the climate effects to conservation efforts, creating a logical bridge.',
        },
        {
          id: '3',
          text: 'There are many types of conservation efforts.',
          isCorrect: false,
          explanation: 'This doesn\'t explicitly connect to the previous topic of climate change.',
        },
        {
          id: '4',
          text: 'On a different note, conservation is another environmental topic worth discussing.',
          isCorrect: false,
          explanation: 'This transition suggests the topics are unrelated when they are actually connected.',
        },
      ],
      explanation: 'Good transitions connect ideas between paragraphs by showing relationships between the topics.',
    });
    
    // Matching exercise for transitions
    exercises.push({
      id: `${levelId}-ex-3`,
      levelId,
      type: 'matching',
      question: 'Match each transition word or phrase with its purpose in writing.',
      instruction: 'For each transition term on the left, identify its function on the right.',
      matchingPairs: [
        {left: 'However', right: 'To show contrast'},
        {left: 'Therefore', right: 'To show result or conclusion'},
        {left: 'For example', right: 'To provide an illustration'},
        {left: 'Similarly', right: 'To show comparison'}
      ],
      explanation: 'Transition words and phrases are essential for guiding readers through your writing by showing the relationships between ideas.',
    });
    
  } else { // Voice exercises
    exercises.push({
      id: `${levelId}-ex-1`,
      levelId,
      type: 'multiple-choice',
      question: 'Which sentence best demonstrates a formal academic voice?',
      instruction: 'Select the option that would be most appropriate in a research paper.',
      choices: [
        {
          id: '1',
          text: 'The experiment was a total disaster and didn\'t prove anything useful.',
          isCorrect: false,
          explanation: 'This uses informal language and subjective judgment that is inappropriate for academic writing.',
        },
        {
          id: '2',
          text: 'The results of the experiment failed to support the hypothesis, suggesting alternative factors may be involved.',
          isCorrect: true,
          explanation: 'This uses formal, objective language appropriate for academic writing.',
        },
        {
          id: '3',
          text: 'OMG, the experiment didn\'t work out at all!',
          isCorrect: false,
          explanation: 'This uses slang and exclamation that are inappropriate for academic writing.',
        },
        {
          id: '4',
          text: 'I think the experiment probably didn\'t work because we made some mistakes.',
          isCorrect: false,
          explanation: 'This uses first-person and vague language that is less appropriate for formal academic writing.',
        },
      ],
      explanation: 'Academic voice is characterized by formal, objective, and precise language that avoids colloquialisms and emotional expressions.',
    });
    
    // Fill-in-blank exercise for tone
    exercises.push({
      id: `${levelId}-ex-3`,
      levelId,
      type: 'fill-in-blank',
      question: 'Complete this sentence with the most appropriate word for a persuasive essay: "This policy would be _____ for our community\'s future."',
      instruction: 'Choose a word with positive connotation that would strengthen a persuasive argument.',
      correctAnswer: 'beneficial',
      fillOptions: ['beneficial', 'ok', 'fine', 'alright'],
      explanation: 'In persuasive writing, word choice matters tremendously. Strong words with positive or negative connotations can influence how readers perceive your argument.',
    });
  }
  
  // Add a generic reorder exercise
  exercises.push({
    id: `${levelId}-ex-4`,
    levelId,
    type: 'reorder',
    question: 'Arrange these words to form a grammatically correct sentence.',
    instruction: 'Move the items up or down to create a properly structured sentence.',
    reorderItems: [
      {id: 'item1', text: 'The excited students'},
      {id: 'item2', text: 'quickly gathered'},
      {id: 'item3', text: 'their books and supplies'},
      {id: 'item4', text: 'before leaving for the field trip.'}
    ],
    correctOrder: ['item1', 'item2', 'item3', 'item4'],
    explanation: 'A well-formed English sentence typically follows the subject-verb-object pattern, with modifiers and clauses adding detail in specific positions.',
  });
  
  // Ensure we have the requested number of exercises
  while (exercises.length < count) {
    // Duplicate one of the existing exercises with a modified ID
    const sourceExercise = exercises[Math.floor(Math.random() * exercises.length)];
    const duplicateExercise = {
      ...sourceExercise,
      id: `${sourceExercise.id}-copy-${exercises.length}`
    };
    exercises.push(duplicateExercise);
  }
  
  // Get titles and descriptions based on level
  const title = getLevelTitle(levelId);
  const description = getLevelDescription(levelId);
  
  return {
    id: `set-${levelId}-${Date.now()}`,
    levelId,
    title,
    description,
    exercises: exercises.slice(0, count), // Ensure we only return the requested count
    requiredScore: 90, // PRD requirement: 90% accuracy to proceed
  };
}

// Helper function to get level titles
function getLevelTitle(levelId: string): string {
  const titles: Record<string, string> = {
    'mechanics-1': 'Basic Sentence Structure',
    'mechanics-2': 'Punctuation Mastery',
    'sequencing-1': 'Paragraph Flow',
    'voice-1': 'Finding Your Voice',
  };
  
  return titles[levelId] || `Exercise Set for ${levelId}`;
}

// Helper function to get level descriptions
function getLevelDescription(levelId: string): string {
  const descriptions: Record<string, string> = {
    'mechanics-1': 'Learn to identify complete sentences and their components.',
    'mechanics-2': 'Master proper punctuation to enhance clarity in your writing.',
    'sequencing-1': 'Create smooth transitions between ideas in your paragraphs.',
    'voice-1': 'Develop your unique writing style while maintaining clarity.',
  };
  
  return descriptions[levelId] || 'Complete these exercises to advance your writing skills.';
}

// Interface for structured writing feedback
export interface WritingFeedback {
  score: number;           // 0-100 quality score
  grammarIssues: string[]; // List of grammar issues
  styleComments: string[]; // Comments on writing style
  strengthsPoints: string[]; // What the writer did well
  improvementPoints: string[]; // Areas for improvement
  overallFeedback: string; // Summary feedback
}

// Function to provide AI feedback on writing
export async function getWritingFeedback(text: string): Promise<WritingFeedback> {
  // Input validation
  if (!text || text.length < 10) {
    return {
      score: 0,
      grammarIssues: ['Text too short for analysis'],
      styleComments: [],
      strengthsPoints: [],
      improvementPoints: ['Provide more text for meaningful feedback'],
      overallFeedback: "Please provide more text for a meaningful analysis."
    };
  }
  
  // Check if AI features are enabled
  if (!isAiEnabled()) {
    console.log('AI features disabled. Using fallback feedback.');
    return getFallbackFeedback();
  }
  
  try {
    // Check rate limit
    if (!(await checkRateLimit('getWritingFeedback'))) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    // Truncate text if it's too long for the API
    const truncatedText = text.length > 4000 ? text.substring(0, 4000) + '...' : text;
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert writing coach helping students improve their writing.
          Analyze the writing sample and provide constructive feedback in JSON format with these fields:
          score (0-100),
          grammarIssues (array of strings),
          styleComments (array of strings),
          strengthsPoints (array of strings),
          improvementPoints (array of strings),
          overallFeedback (string summary).
          Be specific, supportive, and age-appropriate.`
        },
        {
          role: "user",
          content: truncatedText
        }
      ],
      temperature: 0.3, // More deterministic for evaluation
      max_tokens: 800,
      response_format: { type: "json_object" }
    });
    
    // Parse response
    const content = response.choices[0]?.message?.content || '';
    const feedbackData = JSON.parse(content);
    
    // Format and return structured feedback
    return {
      score: feedbackData.score || 70,
      grammarIssues: feedbackData.grammarIssues || [],
      styleComments: feedbackData.styleComments || [],
      strengthsPoints: feedbackData.strengthsPoints || [],
      improvementPoints: feedbackData.improvementPoints || [],
      overallFeedback: feedbackData.overallFeedback || 'Analysis completed successfully.'
    };
  } catch (error) {
    console.error('Error getting writing feedback:', error);
    return getFallbackFeedback();
  }
}

// Helper function for fallback feedback when AI is unavailable
function getFallbackFeedback(): WritingFeedback {
  return {
    score: 70,
    grammarIssues: [],
    styleComments: ['Style analysis unavailable in offline mode'],
    strengthsPoints: ['Good effort in completing this writing task'],
    improvementPoints: ['AI feedback is currently disabled. Your writing has been saved.'],
    overallFeedback: "AI writing feedback is currently disabled. Please check your API key configuration."
  };
}

// Default prompts to use when AI is unavailable
const DEFAULT_PROMPTS = [
  "Describe a character who discovers an unusual ability",
  "Write about a journey that changes someone's perspective",
  "Create a scene where two people with opposing views find common ground",
  "Imagine a world where a common technology never existed",
  "Write about a misunderstanding that leads to an unexpected friendship"
];

// Function to generate writing prompts when stuck
export async function getWritersBlockPrompts(
  context?: { 
    topic?: string;
    genre?: string;
    currentText?: string;
    userPreferences?: string[];
  }
): Promise<string[]> {
  // Check if AI features are enabled
  if (!isAiEnabled()) {
    console.log('AI features disabled. Using default writing prompts.');
    return getContextualizedDefaultPrompts(context);
  }

  try {
    // Check rate limit
    if (!(await checkRateLimit('getWritersBlockPrompts'))) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    // If no context, return default prompts
    if (!context || Object.keys(context).length === 0) {
      return DEFAULT_PROMPTS;
    }
    
    // Extract context
    const { topic, genre, currentText, userPreferences } = context;
    
    // Build prompt based on available context
    let prompt = "Generate 5 creative writing prompts";
    
    if (genre) {
      prompt += ` for ${genre} writing`;
    }
    
    if (topic) {
      prompt += ` related to ${topic}`;
    }
    
    if (userPreferences && userPreferences.length > 0) {
      prompt += ` incorporating these themes: ${userPreferences.join(', ')}`;
    }
    
    // If we have current text, include it for context-aware suggestions
    let systemPrompt = "You are a creative writing assistant helping students overcome writer's block.";
    if (currentText && currentText.length > 0) {
      // Truncate text if it's too long
      const truncatedText = currentText.length > 500 ? 
        currentText.substring(0, 500) + '...' : 
        currentText;
      
      systemPrompt += " Based on the student's current writing, suggest prompts that would help them continue.";
      prompt += `. Here's what I've written so far: "${truncatedText}"`;
    }
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.9, // Higher creativity
      max_tokens: 600
    });
    
    // Process response
    const content = response.choices[0]?.message?.content || '';
    
    // Parse the response into individual prompts (usually numbered 1-5)
    const promptLines = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // Remove numbers and special characters from the beginning of the line
        return line.replace(/^\d+[\.\)\-]?\s*/, '');
      })
      .filter(line => line.length > 10 && line.length < 200); // Filter lines that are too short or too long
    
    return promptLines.length > 0 ? promptLines : DEFAULT_PROMPTS;
  } catch (error) {
    console.error('Error generating prompts:', error);
    return getContextualizedDefaultPrompts(context);
  }
}

// Helper function to customize default prompts based on context
function getContextualizedDefaultPrompts(context?: { 
  topic?: string;
  genre?: string;
  currentText?: string;
  userPreferences?: string[];
}): string[] {
  if (!context) return DEFAULT_PROMPTS;
  
  // Basic genre-specific default prompts if no AI available
  const { genre } = context;
  
  if (genre === 'Story') {
    return [
      "Write about a character who discovers a hidden door in their house",
      "Create a story about someone who can suddenly understand animal language",
      "Describe a day when everything goes wrong, but ends with an unexpected gift",
      "Write about two strangers meeting during an unusual event",
      "Create a story about finding an object that doesn't belong in this time"
    ];
  } else if (genre === 'Essay') {
    return [
      "Discuss how technology has changed education in the last decade",
      "Explore the relationship between nature and mental health",
      "Analyze the impact of social media on modern communication",
      "Compare two different approaches to solving an environmental problem",
      "Argue for or against the importance of learning multiple languages"
    ];
  } else if (genre === 'Poetry') {
    return [
      "Write a poem about the changing seasons",
      "Create a poem that explores a strong emotion without naming it",
      "Write about an everyday object from an unusual perspective",
      "Create a poem about a significant memory",
      "Write a poem that uses colors to express feelings"
    ];
  }
  
  // Return default prompts if no customization applied
  return DEFAULT_PROMPTS;
}

// Interface for detailed writing score
export interface WritingScore {
  overall: number; // 0-100 overall quality
  mechanics: number; // 0-100 grammar, punctuation, etc.
  organization: number; // 0-100 structure, flow
  creativity: number; // 0-100 originality, engagement
  clarity: number; // 0-100 clearly expressed ideas
  scores: Record<string, number>; // Category-specific scores
  feedback: string; // Brief feedback message
}

// Function to score writing quality
export async function scoreWriting(
  text: string, 
  options?: { 
    genre?: string;
    rubric?: Record<string, number>; // Custom scoring weights
  }
): Promise<WritingScore> {
  // Input validation
  if (!text || text.length < 50) {
    return {
      overall: 0,
      mechanics: 0,
      organization: 0,
      creativity: 0,
      clarity: 0,
      scores: {},
      feedback: "Text too short to evaluate. Please provide at least 50 characters."
    };
  }
  
  // Check if AI features are enabled
  if (!isAiEnabled()) {
    console.log('AI features disabled. Using default scoring.');
    return getDefaultScoring(options?.genre);
  }
  
  try {
    // Check rate limit
    if (!(await checkRateLimit('scoreWriting'))) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    // Truncate text if it's too long for the API
    const truncatedText = text.length > 3000 ? text.substring(0, 3000) + '...' : text;
    
    // Build system prompt with rubric if provided
    let systemPrompt = `You are an expert writing evaluator for students.
      Score this ${options?.genre || 'writing'} sample on a scale of 0-100 for:
      - mechanics (grammar, spelling, punctuation)
      - organization (structure, flow, transitions)
      - creativity (originality, voice, engagement)
      - clarity (understandable ideas, effective communication)
      - overall (weighted score of all categories)`;
    
    // Include custom rubric if provided
    if (options?.rubric) {
      systemPrompt += "\nUse the following weights for the overall score:";
      for (const [category, weight] of Object.entries(options.rubric)) {
        systemPrompt += `\n- ${category}: ${weight}%`;
      }
    }
    
    systemPrompt += "\nProvide the results in JSON format with these fields: overall, mechanics, organization, creativity, clarity, scores (object with any additional category scores), feedback (brief summary).";
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: truncatedText
        }
      ],
      temperature: 0.2, // More deterministic for scoring
      max_tokens: 600,
      response_format: { type: "json_object" }
    });
    
    // Parse response
    const content = response.choices[0]?.message?.content || '';
    const scoreData = JSON.parse(content);
    
    // Format and return structured score with defaults for missing values
    return {
      overall: scoreData.overall || 70,
      mechanics: scoreData.mechanics || 70,
      organization: scoreData.organization || 70,
      creativity: scoreData.creativity || 70,
      clarity: scoreData.clarity || 70,
      scores: scoreData.scores || {},
      feedback: scoreData.feedback || 'Writing evaluation completed.'
    };
  } catch (error) {
    console.error('Error scoring writing:', error);
    return getDefaultScoring(options?.genre);
  }
}

// Helper function for default scoring when AI is unavailable
function getDefaultScoring(genre?: string): WritingScore {
  const genreFeedback = genre ? 
    `Your ${genre.toLowerCase()} has been saved.` : 
    'Your writing has been saved.';
  
  return {
    overall: 70,
    mechanics: 70,
    organization: 70,
    creativity: 70,
    clarity: 70,
    scores: {},
    feedback: `AI writing evaluation is currently disabled. ${genreFeedback}`
  };
}