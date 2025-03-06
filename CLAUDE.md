# ScribeX Development Guidelines

## CRITICAL PROTOCOL: The Claude Layer

The first and last action in every development session MUST be to consult the `.claude/` directory. This directory serves as a universal Claude layer and the fundamental source of truth for all codebase information.

## CRITICAL PROTOCOL: The Claude Loop

In addition to the Claude layer described above, a Claude Loop describes the specific set of actions you must take when attempting to solve the user's requests. The Claude Loop looks like this: 

1. Consult your Claude Layer to gain a comprehensive understanding of the codebase. 
2. Map the user's requests onto the appropriate sections of the Claude Layer in your context. 
3. Now establish a plan to resolve the user's request(s). 
4. Resolve the request. 
5. Ask the user if the request was resolved.
6. If so, consult your Claude Layer again and see if anything needs to be updated, added, changed, or removed based on this Claude Loop. 
7. If not, request to begin the Claude Loop again, and do so if the user approves. 

### .claude Directory Structure

The `.claude/` directory contains these specialized components:

- **metadata/**: Normalized information about the codebase structure, component dependencies, and file classifications
- **code_index/**: Pre-analyzed semantic relationships including function call graphs and type relationships
- **debug_history/**: Logs of debugging sessions with error-solution pairs
- **patterns/**: Implementation patterns with canonical examples for reliability
- **cheatsheets/**: Component-specific quick reference guides with operations and pitfalls
- **qa/**: Database of previously solved problems indexed by component
- **delta/**: Semantic change logs documenting API and behavior changes

**IMPORTANT**: Update the `.claude/` directory appropriately when making changes to the codebase. Add new patterns, update debug history, and maintain accurate documentation.

## Project Overview: ScribeX

ScribeX is a writing application designed for junior high students with two complementary approaches:

### Two-Pronged Approach to Writing Instruction

1. **REDI (Reflective Exercise on Direct Instruction)**
   - Structured lessons focusing on analytical writing skills
   - Three layers of instruction: Mechanics, Sequencing, and Voice
   - AI-generated exercises requiring 90% accuracy to advance
   - Adaptive difficulty with gamified elements

2. **OWL (Open World Learning)**
   - Sandbox-style learning for creative expression
   - Real-world writing applications across multiple genres
   - AI reviews with structured feedback
   - "Writer's Block" assistance for creative inspiration

### Three-Layer Writing Instruction Model
- **Mechanics & Grammar**: Sentence structure, syntax, spelling, grammar rules
- **Sequencing & Logic**: Paragraph structure, transitions, essay organization, logical arguments
- **Voice & Rhetoric**: Finding your voice, audience awareness, descriptive writing, style

## Build Commands
- Start app: `npm run start` (uses Expo with tunnel)
- Start web: `npm run start-web` or `npm run start-web-dev` (with DEBUG flag)
- Type checking: `npx tsc --noEmit`

## Technical Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                      ScribeX Application                           │
└───────────────┬─────────────────────────────────┬─────────────────┘
                │                                 │
┌───────────────▼───────────────┐   ┌─────────────▼─────────────┐
│        Core Infrastructure     │   │      User Management      │
└───────────────┬───────────────┘   └────────────┬──────────────┘
                │                                │
                ▼                                ▼
┌───────────────────────────────────────────────────────────────────┐
│                        Navigation Layer                            │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  │ Journey  │   │  Write   │   │ Creative │   │ Leader-  │   │ Profile  │
│  │ (REDI)   │   │ (OWL)    │   │ Tools    │   │ board    │   │          │
└───────┼──────────────┼──────────────┼──────────────┼──────────────┼─────┘
        │              │              │              │              │
        ▼              ▼              ▼              ▼              ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        AI Services Layer                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │
│  │ Exercise        │  │ Writing         │  │ Writer's Block          │ │
│  │ Generation      │  │ Feedback        │  │ Assistance              │ │
└───────────┼─────────────────────┼────────────────────────┼──────────────┘
            │                     │                        │
            ▼                     ▼                        ▼
┌───────────────────┐      ┌──────────────────┐     ┌──────────────────┐
│ REDI Module       │      │ OWL Module       │     │ Social Features  │
└─────────┬─────────┘      └────────┬─────────┘     └────────┬─────────┘
          │                         │                        │
          ▼                         ▼                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     State Management Layer                           │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌──────────┐ │
│  │ Progress    │   │ Writing     │   │ User        │   │ Settings │ │
│  │ Store       │   │ Store       │   │ Store       │   │ Store    │ │
└─────────┼─────────────────┼─────────────────┼──────────────┼─────────┘
          │                 │                 │              │
          ▼                 ▼                 ▼              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Data Access Layer                             │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────────────┐    │
│  │ Local Cache │◄──┤ AsyncStorage│◄──┤ Supabase Database       │    │
│  │ (Zustand)   │   │             │   │ & Storage               │    │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Technology Components

- **React Native**: Mobile-first design with iOS & Android compatibility
- **Supabase**: Backend for user data and cloud storage
- **OpenAI API**: GPT models for NLP capabilities (rate limited at 30 req/min)
- **Zustand**: State management with persistence middleware
- **Expo**: Development and build toolchain

## Implementation Guidelines

### AI Integration
- Set up `.env` file with OPENAI_API_KEY before running
- Environment variables passed via app.config.js
- AI features degrade gracefully when API is unavailable
- After changing .env, restart dev server completely

### Code Style
- **Imports**: Use absolute imports with `@/` prefix
- **Components**: Functional components with named exports
- **Typing**: Always use TypeScript interfaces/types
- **State**: Zustand for global state
- **Naming**: PascalCase for components, camelCase for functions/variables
- **Styling**: StyleSheet.create() with objects at bottom of file
- **Error handling**: try/catch with specific messages
- **File structure**: Domain-specific folder organization
- **Colors**: Import from constants (`@/constants/colors`)

### Exercise Implementation
- Four types: Multiple Choice, Fill-in-blank, Matching, Reordering
- 90% accuracy required to advance
- Bonus points from difficulty multiplier and answer streaks
- Sequential unlocking through category thresholds

### Writing Interface
- Project management with metadata display
- Six genres with different UI representations
- Distraction-free focus mode
- Templates with structured guidance
- Interest-based topics for student engagement

## Planned Features
1. Adaptive difficulty system based on user feedback
2. Real-time AI feedback sidebar with technical and semantic analysis
3. Web version with cross-device synchronization
4. Enhanced UI with cyberpunk/organic fusion design

## Development Protocol
- Always consult the `.claude/` directory first and last
- Update pattern libraries when creating new components
- Document solutions to bugs in the debug history
- Maintain accurate semantic change logs in the delta directory
- Follow existing code patterns for consistency
