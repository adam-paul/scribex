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
      model: "gpt-3.5-turbo",
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
  const { levelId, count = 3 } = options;
  
  // Get level information
  const level = LEVELS.find(l => l.id === levelId);
  const levelType = level?.type || 'mechanics';
  const difficulty = level?.difficulty || 1;
  
  // In production, this would call an AI API to generate exercises
  const exercises: Exercise[] = [];
  
  // Generate exercises for the set based on level type
  if (levelType === 'mechanics') {
    if (levelId === 'mechanics-1') {
      const exercise1: Exercise = {
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
      };
      exercises.push(exercise1);
      
      // Add a fill-in-blank exercise
      const exercise2: Exercise = {
        id: `${levelId}-ex-2`,
        levelId,
        type: 'fill-in-blank',
        question: 'Complete this sentence with the correct verb form: "Everyone in the classroom _____ excited about the field trip."',
        instruction: 'Type the correct verb that agrees with the subject "Everyone".',
        correctAnswer: 'is',
        fillOptions: ['is', 'are', 'were', 'be'],
        explanation: 'The subject "Everyone" is singular, so it takes the singular verb "is". Even though we may be referring to many people, collective nouns like "everyone" are treated as singular in English.',
      };
      exercises.push(exercise2);
      
      // Add a matching exercise
      const exercise3: Exercise = {
        id: `${levelId}-ex-3`,
        levelId,
        type: 'matching',
        question: 'Match each grammatical term with its correct definition.',
        instruction: 'For each term on the left, type the corresponding letter of its definition on the right.',
        matchingPairs: [
          {left: 'Subject', right: 'The person, place, or thing that performs the action'},
          {left: 'Predicate', right: 'The part of the sentence containing the verb'},
          {left: 'Object', right: 'The person, place, or thing that receives the action'},
          {left: 'Adjective', right: 'A word that describes a noun'}
        ],
        explanation: 'Understanding these basic grammatical terms is essential for analyzing sentence structure and creating well-formed sentences.',
      };
      exercises.push(exercise3);
      
      // Add a reorder exercise
      const exercise4: Exercise = {
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
      };
      exercises.push(exercise4);
    } else if (levelId === 'mechanics-2') {
      const exercise1: Exercise = {
        id: `${levelId}-ex-1`,
        levelId,
        type: 'multiple-choice',
        question: 'Which sentence uses commas correctly?',
        instruction: 'Select the option with proper comma usage.',
        choices: [
          {
            id: '1',
            text: 'After eating the dog took a nap.',
            isCorrect: false,
            explanation: 'A comma is needed after "eating" to separate the introductory phrase.',
          },
          {
            id: '2',
            text: 'She bought apples, oranges and bananas at the store.',
            isCorrect: false,
            explanation: 'A serial comma is missing after "oranges" in this list.',
          },
          {
            id: '3',
            text: 'My friend, who lives in Paris, is visiting next week.',
            isCorrect: true,
            explanation: 'This correctly uses commas to set off the non-restrictive clause.',
          },
          {
            id: '4',
            text: 'They went to the beach, but, they forgot sunscreen.',
            isCorrect: false,
            explanation: 'The second comma is unnecessary after "but".',
          },
        ],
        explanation: 'Commas are used to separate items in a list, set off introductory elements, join independent clauses, and separate non-restrictive clauses.',
      };
      exercises.push(exercise1);
      // Add more mechanics-2 exercises...
    }
  } else if (levelType === 'sequencing') {
    // Implement sequencing exercises with various types
    const exercise1: Exercise = {
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
    };
    exercises.push(exercise1);
    
    // Add a reorder exercise for paragraph organization
    const exercise2: Exercise = {
      id: `${levelId}-ex-2`,
      levelId,
      type: 'reorder',
      question: 'Arrange these sentences to form a logical paragraph about photosynthesis.',
      instruction: 'Drag the sentences into the correct order to create a coherent explanation of photosynthesis.',
      reorderItems: [
        {id: 'item1', text: 'Photosynthesis is the process by which plants convert light energy into chemical energy.'},
        {id: 'item2', text: 'This process takes place in the chloroplasts, primarily in plant leaves.'},
        {id: 'item3', text: 'The plants use carbon dioxide, water, and sunlight to produce glucose and oxygen.'},
        {id: 'item4', text: 'This chemical reaction is essential for maintaining life on Earth as it provides both food and oxygen.'}
      ],
      correctOrder: ['item1', 'item2', 'item3', 'item4'],
      explanation: 'A well-structured paragraph typically begins with a topic sentence, followed by supporting details, and ends with a conclusion or transition.',
    };
    exercises.push(exercise2);
    
    // Add a matching exercise for transition words
    const exercise3: Exercise = {
      id: `${levelId}-ex-3`,
      levelId,
      type: 'matching',
      question: 'Match each transition word or phrase with its purpose in writing.',
      instruction: 'For each transition term on the left, type the corresponding letter of its function on the right.',
      matchingPairs: [
        {left: 'However', right: 'To show contrast'},
        {left: 'Therefore', right: 'To show result or conclusion'},
        {left: 'For example', right: 'To provide an illustration'},
        {left: 'Similarly', right: 'To show comparison'}
      ],
      explanation: 'Transition words and phrases are essential for guiding readers through your writing by showing the relationships between ideas.',
    };
    exercises.push(exercise3);
    
    // Add a fill-in-blank exercise
    const exercise4: Exercise = {
      id: `${levelId}-ex-4`,
      levelId,
      type: 'fill-in-blank',
      question: 'Complete this sentence with an appropriate transition word: "The research clearly supports the theory; _____, more studies are needed to confirm these findings."',
      instruction: 'Type a transition word that shows a contrasting relationship.',
      correctAnswer: 'however',
      fillOptions: ['however', 'therefore', 'similarly', 'consequently'],
      explanation: 'When introducing a contrasting idea, transition words like "however," "nevertheless," or "on the other hand" signal to the reader that the information that follows will present a different perspective or limitation.',
    };
    exercises.push(exercise4);
  } else if (levelType === 'voice') {
    // Implement voice exercises with various types
    const exercise1: Exercise = {
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
    };
    exercises.push(exercise1);
    
    // Add a matching exercise for voice styles
    const exercise2: Exercise = {
      id: `${levelId}-ex-2`,
      levelId,
      type: 'matching',
      question: 'Match each writing sample with its appropriate writing style or voice.',
      instruction: 'For each writing sample on the left, identify the writing style it represents.',
      matchingPairs: [
        {left: 'Research indicates a correlation between variables A and B.', right: 'Academic'},
        {left: 'Hey! Check out this amazing new product I found!', right: 'Advertising'},
        {left: 'Once upon a time, in a land far away...', right: 'Narrative'},
        {left: 'We hold these truths to be self-evident...', right: 'Formal/Legal'}
      ],
      explanation: 'Different contexts require different writing styles. Recognizing and adapting to the appropriate voice for your audience and purpose is essential for effective communication.',
    };
    exercises.push(exercise2);
    
    // Add a fill-in-blank exercise for tone
    const exercise3: Exercise = {
      id: `${levelId}-ex-3`,
      levelId,
      type: 'fill-in-blank',
      question: 'Complete this sentence with the most appropriate word for a persuasive essay: "This policy would be _____ for our community\'s future."',
      instruction: 'Choose a word with positive connotation that would strengthen a persuasive argument.',
      correctAnswer: 'beneficial',
      fillOptions: ['beneficial', 'ok', 'fine', 'alright'],
      explanation: 'In persuasive writing, word choice matters tremendously. Strong words with positive or negative connotations can influence how readers perceive your argument.',
    };
    exercises.push(exercise3);
    
    // Add a reorder exercise for developing an argument
    const exercise4: Exercise = {
      id: `${levelId}-ex-4`,
      levelId,
      type: 'reorder',
      question: 'Arrange these sentences to create a compelling argument about renewable energy.',
      instruction: 'Order these sentences to build a logical and persuasive case for renewable energy.',
      reorderItems: [
        {id: 'item1', text: 'Renewable energy sources like solar and wind power are becoming increasingly available.'},
        {id: 'item2', text: 'Our dependence on fossil fuels is causing significant environmental damage.'},
        {id: 'item3', text: 'We must transition to cleaner energy alternatives for a sustainable future.'},
        {id: 'item4', text: 'The technology for renewable energy has become more affordable in recent years.'}
      ],
      correctOrder: ['item2', 'item1', 'item4', 'item3'],
      explanation: 'A persuasive argument often begins by identifying a problem, presents solutions, addresses practicality, and ends with a call to action.',
    };
    exercises.push(exercise4);
  }
  
  // Fill with more generic exercises if needed to reach count
  while (exercises.length < count) {
    const topics = ['writing', 'grammar', 'punctuation', 'structure'];
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const exercise = await generateExercise(levelId, topic);
    exercises.push(exercise);
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
      model: "gpt-3.5-turbo",
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
      model: "gpt-3.5-turbo",
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
      model: "gpt-3.5-turbo",
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