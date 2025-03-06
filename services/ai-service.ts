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

// Helper function to validate if we can make API calls
function validateAiAccess(): void {
  if (!ENABLE_AI_FEATURES) {
    throw new Error('AI features are disabled in application configuration');
  }
  
  if (OPENAI_API_KEY === 'dummy-api-key') {
    throw new Error('Invalid or missing OpenAI API key');
  }
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
async function checkRateLimit(endpoint: string): Promise<void> {
  const now = Date.now();
  
  console.log(`Rate limit check for ${endpoint}, current count: ${apiRequestLog.length}`);
  
  // Remove requests older than the window WITHOUT clearing the array first
  const currentTime = Date.now();
  while (apiRequestLog.length > 0 && currentTime - apiRequestLog[0].timestamp >= REQUEST_WINDOW_MS) {
    apiRequestLog.shift(); // Remove oldest request
  }
  
  // Add current request
  apiRequestLog.push({timestamp: now, endpoint});
  
  // Check if we're over the limit
  if (apiRequestLog.length > MAX_REQUESTS_PER_MINUTE) {
    console.error(`Rate limit exceeded: ${apiRequestLog.length} requests in the last minute`);
    throw new Error(`Rate limit exceeded (${MAX_REQUESTS_PER_MINUTE} requests per minute). Please try again later.`);
  }
}

type AIRequestOptions = {
  levelId: string;
  difficulty?: number;
  type?: 'mechanics' | 'sequencing' | 'voice';
  count?: number;
};

// Function to generate an exercise based on the level and topic
export async function generateExercise(levelId: string, topic: string): Promise<Exercise> {
  try {
    // Ensure AI is properly configured
    validateAiAccess();
    
    // Check rate limiting
    await checkRateLimit('generateExercise');
    
    // Get level information for context
    const level = LEVELS.find(l => l.id === levelId);
    if (!level) {
      throw new Error(`Level not found: ${levelId}`);
    }
    
    const levelType = level.type;
    
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
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI API');
    }
    
    const exerciseData = JSON.parse(content);
    if (!exerciseData.question || !exerciseData.choices) {
      throw new Error('Incomplete exercise data from API');
    }
    
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
    throw new Error(`Failed to generate exercise: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Fallback functions have been completely removed

// Function to generate a complete exercise set with more structured options
export async function generateExerciseSet(options: AIRequestOptions): Promise<ExerciseSet> {
  const { levelId, count = 5 } = options; // Default to 5 exercises per set (same as MAX_EXERCISES_PER_LEVEL)
  
  try {
    // Ensure AI is properly configured
    validateAiAccess();
    
    // Get level information
    const level = LEVELS.find(l => l.id === levelId);
    if (!level) {
      throw new Error(`Level not found: ${levelId}`);
    }
    
    const levelType = level.type;
    const difficulty = level.difficulty;
    
    // Check rate limit
    await checkRateLimit('generateExerciseSet');
    
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
      // Choose exercise type - cycle through the types
      const exerciseType = exerciseTypes[i % exerciseTypes.length];
      
      // Choose a topic
      const topic = topics[Math.floor(Math.random() * topics.length)];
      
      // Check rate limit before each exercise generation
      await checkRateLimit(`generateExerciseSet-${i}`);
      
      // Generate an AI exercise with specific type
      const aiExercise = await generateAIExerciseWithType(levelId, levelType, topic, exerciseType, difficulty);
      exercises.push(aiExercise);
      
      // Small delay between requests to avoid overwhelming the API
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    if (exercises.length === 0) {
      throw new Error('Failed to generate any exercises');
    }
    
    // Get titles and descriptions based on level
    const title = level.title || `Exercise Set for ${levelId}`;
    const description = level.description || `Practice exercises for ${levelType}`;
    
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
    throw new Error(`Failed to generate exercise set: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Generate an AI exercise with a specific type
export async function generateAIExerciseWithType(
  levelId: string, 
  levelType: string,
  topic: string, 
  exerciseType: string,
  difficulty: number
): Promise<Exercise> {
  try {
    // Ensure AI is properly configured
    validateAiAccess();
    
    // Check rate limit
    await checkRateLimit(`generateExerciseWithType-${exerciseType}`);
    
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
        throw new Error(`Unsupported exercise type: ${exerciseType}`);
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
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI API');
    }
    
    const exerciseData = JSON.parse(content);
    
    // Validate the response based on exercise type
    if (!exerciseData.question || !exerciseData.instruction || !exerciseData.explanation) {
      throw new Error(`Incomplete exercise data: missing required fields for ${exerciseType}`);
    }
    
    switch (exerciseType) {
      case 'multiple-choice':
        if (!exerciseData.choices || !Array.isArray(exerciseData.choices) || exerciseData.choices.length < 2) {
          throw new Error('Invalid multiple choice data: missing or insufficient choices');
        }
        break;
      case 'fill-in-blank':
        if (!exerciseData.correctAnswer || !exerciseData.fillOptions) {
          throw new Error('Invalid fill-in-blank data: missing correctAnswer or fillOptions');
        }
        break;
      case 'matching':
        if (!exerciseData.matchingPairs || !Array.isArray(exerciseData.matchingPairs)) {
          throw new Error('Invalid matching data: missing or invalid matchingPairs');
        }
        break;
      case 'reorder':
        if (!exerciseData.reorderItems || !exerciseData.correctOrder) {
          throw new Error('Invalid reorder data: missing reorderItems or correctOrder');
        }
        break;
    }
    
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
    throw new Error(`Failed to generate ${exerciseType} exercise: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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
  
  // Ensure AI features are properly configured
  validateAiAccess();
  
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
    throw new Error(`Failed to generate writing feedback: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}


// Function to generate writing prompts when stuck
export async function getWritersBlockPrompts(
  context?: { 
    topic?: string;
    genre?: string;
    currentText?: string;
    userPreferences?: string[];
  }
): Promise<string[]> {
  // Ensure AI features are properly configured
  validateAiAccess();

  try {
    // Check rate limit
    if (!(await checkRateLimit('getWritersBlockPrompts'))) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    // Even with no context, we should still generate AI prompts
    if (!context || Object.keys(context).length === 0) {
      context = { topic: 'creative writing' };
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
    
    if (promptLines.length === 0) {
      throw new Error('Failed to generate any valid writing prompts');
    }
    return promptLines;
  } catch (error) {
    console.error('Error generating prompts:', error);
    throw new Error(`Failed to generate writing prompts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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
  
  // Ensure AI features are properly configured 
  validateAiAccess();
  
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
    throw new Error(`Failed to score writing: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

