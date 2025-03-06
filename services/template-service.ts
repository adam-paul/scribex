import { WritingTemplate, WritingGenre } from '@/types';
import { WRITING_TEMPLATES } from '@/constants/templates';

// Topic categories for interest-based recommendations
const STUDENT_INTERESTS = [
  {
    id: 'science',
    name: 'Science & Technology',
    topics: [
      'Space exploration and its future',
      'Artificial intelligence benefits and risks',
      'Climate change solutions',
      'Renewable energy technologies',
      'Genetic engineering ethics',
      'Digital privacy in the modern age',
      'The impact of social media on society',
      'Robotics and automation',
      'Medical breakthroughs',
      'The future of transportation'
    ]
  },
  {
    id: 'social',
    name: 'Social Issues',
    topics: [
      'Education reform',
      'Social media and mental health',
      'Animal rights and welfare',
      'Combating bullying in schools',
      'Community service importance',
      'Media literacy and fake news',
      'Digital citizenship',
      'Diversity and inclusion',
      'Recycling and waste management',
      'Public spaces and community building'
    ]
  },
  {
    id: 'arts',
    name: 'Arts & Culture',
    topics: [
      'The importance of music education',
      'How art reflects society',
      'Local cultural traditions',
      'The evolution of film and television',
      'Street art and public expression',
      'Digital art and new media',
      'Cultural heritage preservation',
      'Fashion as cultural expression',
      'The role of museums in education',
      'Global cultural exchange'
    ]
  },
  {
    id: 'sports',
    name: 'Sports & Health',
    topics: [
      'The benefits of team sports',
      'Nutrition and healthy eating habits',
      'Mental health awareness',
      'Sleep science and its importance',
      'Exercise and brain function',
      'Adaptive sports for inclusion',
      'Technology in sports training',
      'The Olympics and international cooperation',
      'School sports programs',
      'Balance between academics and athletics'
    ]
  },
  {
    id: 'personal',
    name: 'Personal Growth',
    topics: [
      'Developing resilience',
      'Goal setting and achievement',
      'Mindfulness and stress management',
      'Public speaking skills',
      'Time management strategies',
      'Friendship and relationships',
      'Digital wellbeing',
      'Finding your passion',
      'Learning from failure',
      'Building confidence'
    ]
  }
];

/**
 * Get all available writing templates
 */
export function getAllTemplates(): WritingTemplate[] {
  return WRITING_TEMPLATES;
}

/**
 * Get templates for a specific genre
 */
export function getTemplatesByGenre(genre: WritingGenre): WritingTemplate[] {
  return WRITING_TEMPLATES.filter(template => template.genre === genre);
}

/**
 * Get a specific template by ID
 */
export function getTemplateById(id: string): WritingTemplate | undefined {
  return WRITING_TEMPLATES.find(template => template.id === id);
}

/**
 * Get topics based on student interests
 */
export function getTopicsByInterest(interestId: string): string[] {
  const interest = STUDENT_INTERESTS.find(i => i.id === interestId);
  return interest ? interest.topics : [];
}

/**
 * Get all topic categories
 */
export function getAllInterestCategories() {
  return STUDENT_INTERESTS.map(interest => ({
    id: interest.id,
    name: interest.name
  }));
}

/**
 * Generate writing template with a selected topic
 */
export function generateTemplate(templateId: string, topic: string): { 
  template: WritingTemplate; 
  topic: string;
  content: string; 
} | null {
  const template = getTemplateById(templateId);
  if (!template) return null;
  
  // Generate initial content based on template structure
  let content = '';
  
  template.structure.sections.forEach(section => {
    content += `# ${section.title}\n\n`;
    content += `${section.placeholder}\n\n`;
  });
  
  return {
    template,
    topic,
    content
  };
}

/**
 * Get recommended templates based on grade level (difficulty)
 */
export function getRecommendedTemplates(gradeLevel: 'elementary' | 'middle' | 'high'): WritingTemplate[] {
  let maxDifficulty: number;
  
  switch (gradeLevel) {
    case 'elementary':
      maxDifficulty = 1;
      break;
    case 'middle':
      maxDifficulty = 2;
      break;
    case 'high':
      maxDifficulty = 3;
      break;
    default:
      maxDifficulty = 2;
  }
  
  return WRITING_TEMPLATES.filter(template => template.difficulty <= maxDifficulty);
}