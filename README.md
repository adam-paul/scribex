# ScribeX

A comprehensive educational writing app designed to help students develop essential writing skills through a structured, gamified approach.

## Features

- **Progressive learning path**: Mechanics → Sequencing → Voice
- **Gamified exercises**: Multiple choice, fill-in-blank, matching, and reordering
- **Writing interface**: Distraction-free editor with focus mode
- **Creative tools**: AI-powered writing prompts and style enhancement
- **Progress tracking**: Achievement system and skill development metrics

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or bun
- Expo CLI (`npm install -g expo-cli`)

### Installation

1. Clone the repository:
   ```
   git clone [repository-url]
   cd scribex
   ```

2. Install dependencies:
   ```
   npm install
   ```
   
3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Add your OpenAI API key to enable AI features:
     ```
     OPENAI_API_KEY=your_api_key_here
     ```
   - Add your Supabase credentials to enable cloud sync:
     ```
     SUPABASE_URL=your_supabase_url_here
     SUPABASE_ANON_KEY=your_supabase_anon_key_here
     ```
   - **Important**: After changing the .env file, you must restart the dev server completely
     (not just reload the app) for environment variables to take effect.

### Running the App

- **Mobile (with Expo Go)**:
  ```
  npm run start
  ```

- **Web**:
  ```
  npm run start-web
  ```

- **Development mode with debugging**:
  ```
  npm run start-web-dev
  ```

## Structure

- `app/` - Main application screens and navigation
- `components/` - Reusable UI components
- `constants/` - App-wide constants and themes
- `contexts/` - React contexts for global state
- `services/` - Services including AI integration
- `stores/` - Global state management with Zustand
- `types/` - TypeScript type definitions

## AI Features

ScribeX incorporates AI capabilities powered by OpenAI's GPT-4o model for:

- Writing feedback and analysis
- Grammar and structure evaluation
- Writing prompts based on user preferences
- Style suggestions and enhancements
- Dynamic exercise generation

These features require an OpenAI API key to function. Without a key, the app will fall back to offline functionality with pre-defined content.

## Acknowledgments

- Built with React Native and Expo
- UI components from Lucide React Native
- State management with Zustand
- Database and authentication by Supabase