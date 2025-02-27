# ScribeX Project Guidelines

## Build Commands
- Start app: `npm run start` (uses Expo with tunnel)
- Start web: `npm run start-web` or `npm run start-web-dev` (with DEBUG flag)
- Type checking: `npx tsc --noEmit`

## Application Architecture
Below is the control flow diagram for the ScribeX application:

```
┌───────────────────────────────────────────────────────────────────┐
│                      ScribeX Application                           │
└───────────────┬─────────────────────────────────┬─────────────────┘
                │                                 │
┌───────────────▼───────────────┐   ┌─────────────▼─────────────┐
│        Core Infrastructure     │   │      User Management      │
│  ┌─────────────────────────┐  │   │  ┌─────────────────────┐  │
│  │ Initialization          │  │   │  │ Authentication      │  │
│  │ Theme/Configuration     │  │   │  │ Profile Management  │  │
│  └─────────────────────────┘  │   │  └─────────────────────┘  │
└───────────────┬───────────────┘   └────────────┬──────────────┘
                │                                │
                ▼                                ▼
┌───────────────────────────────────────────────────────────────────┐
│                        Navigation Layer                            │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  │ Journey  │   │  Write   │   │ Creative │   │ Leader-  │   │ Profile  │
│  │ (REDI)   │   │ (OWL)    │   │ Tools    │   │ board    │   │          │
│  │          │   │          │   │          │   │          │   │          │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘
└───────┼──────────────┼──────────────┼──────────────┼──────────────┼─────┘
        │              │              │              │              │
        ▼              ▼              ▼              ▼              ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        AI Services Layer                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │
│  │ Exercise        │  │ Writing         │  │ Writer's Block          │ │
│  │ Generation      │  │ Feedback        │  │ Assistance              │ │
│  └────────┬────────┘  └────────┬────────┘  └─────────────┬───────────┘ │
└───────────┼─────────────────────┼────────────────────────┼──────────────┘
            │                     │                        │
            ▼                     ▼                        ▼
┌───────────────────┐      ┌──────────────────┐     ┌──────────────────┐
│ REDI Module       │      │ OWL Module       │     │ Social Features  │
│ (Structured       │      │ (Free Writing    │     │ (Leaderboards,   │
│  Exercises)       │      │  Projects)       │     │  Profiles)       │
└─────────┬─────────┘      └────────┬─────────┘     └────────┬─────────┘
          │                         │                        │
          │                         │                        │
          ▼                         ▼                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     State Management Layer                           │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌──────────┐ │
│  │ Progress    │   │ Writing     │   │ User        │   │ Settings │ │
│  │ Store       │   │ Store       │   │ Store       │   │ Store    │ │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └────┬─────┘ │
└─────────┼─────────────────┼─────────────────┼──────────────┼─────────┘
          │                 │                 │              │
          ▼                 ▼                 ▼              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Data Access Layer                             │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────────────┐    │
│  │ Local Cache │◄──┤ AsyncStorage│◄──┤ Supabase Database       │    │
│  │ (Zustand)   │   │             │   │ & Storage               │    │
│  └─────────────┘   └─────────────┘   └─────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### Architecture Key Components:

- **Two-Pronged Approach**: 
  - REDI (Reflective Exercise on Direct Instruction): Structured exercises for mechanics, sequencing, voice
  - OWL (Open World Learning): Free-form writing projects with templates and real-world applications

- **AI Integration**:
  - AI services layer permeates all aspects of the application
  - Provides exercise generation, writing feedback, and creative assistance

- **Data Flow**:
  - State is managed through Zustand stores
  - Data persists locally in AsyncStorage
  - Cloud sync with Supabase for cross-device usage

## AI Integration
- OpenAI API with GPT-4o model is used for NLP capabilities
- Set up `.env` file with OPENAI_API_KEY before running (see .env.example)
- Environment variables are passed to the app via app.config.js
- Rate limiting is implemented at 30 requests per minute
- AI features automatically degrade gracefully if API is unavailable
- **Note**: After changing the .env file, you must restart the dev server completely

### AI Features
- **Dynamic Exercise Generation**: All exercises are generated by AI based on level type and difficulty
- **Writing Feedback**: Grammar and structure analysis for student writing
- **Writing Scoring**: Quality assessment with specific scores across multiple dimensions
- **Writer's Block Assistant**: Context-aware writing prompts in the Creative Tools tab

## Code Style
- **Imports**: Use absolute imports with `@/` prefix (`import { Button } from '@/components/Button'`)
- **Component structure**: Functional components with named exports
- **Typing**: Always use TypeScript interfaces/types. Strict typing enabled
- **State management**: Use Zustand for global state (`stores/progress-store.ts`)
- **Naming**: PascalCase for components, camelCase for functions/variables
- **Styling**: Use StyleSheet.create() with objects at bottom of file
- **Error handling**: Use try/catch blocks with specific error messages
- **File structure**: Keep related files in domain-specific folders
- **Props**: Destructure props in function parameters, use default values when appropriate
- **Colors**: Import from constants (`@/constants/colors`)

## Implementation Notes

### Exercise Types
The app supports four types of exercises:
- **Multiple Choice**: Traditional selection from options
- **Fill-in-blank**: Text input with optional suggestion chips
- **Matching**: Pairing items from two columns
- **Reordering**: Arranging items in the correct sequence

### Adaptive Difficulty
- System tracks consecutive correct answers
- Calculates bonus points based on:
  - Level difficulty multiplier (× 5)
  - Consecutive correct answers streak (up to 25 bonus points)
  - 100% score gets 1.2× progress multiplier
- All exercises require 90% accuracy to advance

### Data Structure
Exercise types are defined in `types/exercises.ts` with the following properties:
```typescript
type Exercise = {
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
```

### Content Structure
The app organizes learning content hierarchically into three main categories:

- **Mechanics (70% to unlock Sequencing)**
  - Basic Sentence Structure (Level 1)
  - Punctuation Mastery (Level 2)
  - Parts of Speech (Level 3)
  - Grammar Rules (Level 4)

- **Sequencing (60% to unlock Voice)**
  - Paragraph Structure (Level 1)
  - Transitions & Flow (Level 2)
  - Essay Organization (Level 3)
  - Logical Arguments (Level 4)

- **Voice**
  - Finding Your Voice (Level 1)
  - Audience Awareness (Level 2)
  - Descriptive Writing (Level 3)
  - Style & Rhetoric (Level 4)

Sequential unlocking is managed by:
- `isCategoryUnlocked()` - Checks if a category is available based on progress
- `checkAndUnlockNextContent()` - Automatically unlocks new content when thresholds are met
- The thresholds are defined in the `CATEGORY_UNLOCK_THRESHOLDS` constant

### Writing Interface

#### Project Management
The writing interface includes a complete project management system:

- **Project Structure**: Projects are defined with title, genre, content, word count, and timestamps
- **Genre System**: Six writing genres (story, essay, poetry, journalism, letter, speech) with different UI representations
- **Storage**: Projects are automatically saved with Zustand persist middleware to AsyncStorage
- **UI Flows**:
  - Project listing screen with metadata display
  - Project creation modal with genre selection
  - Distraction-free writing editor

#### Focus Mode
The writing editor includes a distraction-free focus mode:
- Hides UI elements when typing
- Automatically hides/shows toolbar based on keyboard visibility 
- Adjustable text size for better readability
- Word count tracking

#### Implementation
Key implementation files:
- `stores/writing-store.ts`: State management for projects and editor
- `components/WritingEditor.tsx`: Distraction-free editor component
- `components/GenreSelector.tsx`: Genre selection with visual cues
- `components/ProjectList.tsx`: Project management UI
- `components/CreateProjectModal.tsx`: New project creation flow

### Real-World Applications

#### Writing Templates System
Comprehensive templates for different writing formats:

- **Genre-Specific Templates**: 
  - Essays (argumentative, expository)
  - Stories (narrative, fiction) 
  - Journalism (news articles)
  - Poetry (free verse)
  - Letters (persuasive)
  - Speeches (informative)

- **Template Structure**:
  - Each template defines structured sections with guidance
  - Section-specific instructions and placeholders
  - Word count recommendations
  - Example topics for inspiration
  - Difficulty ratings for age-appropriate assignments

#### Interest-Based Topics
Student interest categories with relevant topics:
- Science & Technology
- Social Issues
- Arts & Culture
- Sports & Health
- Personal Growth

#### Format Guidance
Interactive template guides provide:
- Expandable sections with detailed writing advice
- General tips for the specific genre
- Visual indicators of section structure
- Section-specific guidance on content and phrasing
- Example topics relevant to the template

#### Implementation
Key files:
- `constants/templates.ts`: Template definitions for all writing types
- `services/template-service.ts`: Topic and template management
- `components/TemplateSelector.tsx`: UI for browsing templates
- `components/TemplateGuide.tsx`: Interactive format guidance
- `app/modal.tsx`: Step-by-step wizard for template selection

### Developer Tools

#### Reset Progress During Development
For testing purposes, the app includes a mechanism to reset progress data on each app launch:

1. In `stores/progress-store.ts`, a `resetProgress()` function resets all progress to initial values
2. In `app/_layout.tsx`, a constant controls whether progress is reset on launch:
```typescript
// Set to true to reset progress on each app launch (development only)
const DEV_RESET_PROGRESS_ON_LAUNCH = true;
```

3. To disable progress reset for testing persistence, set this flag to `false`