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

# ScribeX Supabase Backend Setup

This document provides instructions for setting up the Supabase backend for the ScribeX application.

## Database Schema

The ScribeX application uses the following tables in Supabase:

1. `user_profiles` - Stores user profile information
2. `user_progress` - Stores user learning progress
3. `writing_projects` - Stores user writing projects

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign in or create an account
2. Create a new project
3. Note your project URL and anon key for later use in the app

### 2. Set Up the Database Schema

1. Navigate to the SQL Editor in your Supabase dashboard
2. Create a new query
3. Copy the contents of the `supabase-schema.sql` file
4. Run the query to create the necessary tables, views, and policies

### 3. Configure Authentication

1. Go to the Authentication settings in your Supabase dashboard
2. Enable Email/Password sign-in
3. Configure any additional authentication providers as needed
4. Set up email templates for verification, password reset, etc.

### 4. Update Environment Variables

1. Update your app's environment variables with your Supabase URL and anon key
2. For local development, update the `.env` file
3. For production, update the environment variables in your hosting platform

## Database Structure

### User Profiles Table

The `user_profiles` table stores information about each user:

- `id` - Unique identifier for the profile
- `user_id` - Reference to the Supabase auth user
- `username` - User's display name
- `display_name` - Optional full name
- `level` - User's current level (1-15)
- `xp` - Experience points
- `avatar_url` - URL to the user's avatar image
- `created_at` - When the profile was created
- `updated_at` - When the profile was last updated

### User Progress Table

The `user_progress` table stores the user's learning progress:

- `id` - Unique identifier for the progress record
- `user_id` - Reference to the Supabase auth user
- `progress_data` - JSON object containing progress information
- `created_at` - When the progress was created
- `updated_at` - When the progress was last updated

### Writing Projects Table

The `writing_projects` table stores the user's writing projects:

- `id` - Unique identifier for the project
- `user_id` - Reference to the Supabase auth user
- `project_data` - JSON object containing project information
- `created_at` - When the project was created
- `updated_at` - When the project was last updated

## Leaderboard View

The `leaderboard` view provides a ranked list of users based on their XP:

- `user_id` - Reference to the Supabase auth user
- `username` - User's display name
- `display_name` - Optional full name
- `level` - User's current level
- `xp` - Experience points
- `avatar_url` - URL to the user's avatar image
- `rank` - User's rank based on XP

## Security

The database uses Row Level Security (RLS) to ensure that users can only access their own data. The following policies are in place:

- Users can view all profiles
- Users can only update their own profile
- Users can only insert their own profile
- Users can only view, update, and insert their own progress and writing projects

## Troubleshooting

If you encounter issues with the Supabase setup:

1. Check that all tables and views have been created correctly
2. Verify that RLS policies are in place
3. Ensure that the app is using the correct Supabase URL and anon key
4. Check the Supabase logs for any errors 