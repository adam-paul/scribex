# ScribeX Product Specifications

## Overview
ScribeX is a writing application designed to support both structured writing education and free-form creative expression. It features AI-assisted lessons, real-time feedback, and a welcoming design to encourage writers of all skill levels. The app is currently built in React Native, with a Supabase backend storing all writing in JSON-structured rows.

## Current Features
### Core Functionality
- **Duolingo-style exercises**
  - AI-generated lessons to improve writing skills
  - User profiles with progress tracking
  - A leaderboard for active users

- **"Just Write" Mode**
  - Open-world writing section without AI feedback
  - Designed to be a free-form creative space

### Backend & Data Storage
- Supabase backend stores all user writing in a JSON-structured format

### Design & User Experience
- Aiming for a **welcoming and encouraging design**, particularly for teens
- Writing interface uses an **off-white, creamy, papery texture** instead of a plain white page
- Considering **subtle background animations** to enhance the experience
- Overall design goal is a **minimalist cyberpunk/organic fusion**

## Planned Features & Improvements
### Adaptive Learning & AI Analysis
- **Adaptive difficulty system**
  - Users will rate lesson difficulty at the end of exercises
  - AI will adjust future lesson complexity accordingly
  - Scoring system to further refine personalized learning

- **Real-time AI feedback in writing mode**
  - Sidebar providing live analysis and suggestions
  - Two distinct feedback sections:
    1. **Technical Analysis:** Grammar, structure, flow, spelling, cohesion
    2. **Semantic Analysis:** Writing voice insights, comparison to well-known authors

### Web App & Cross-Device Sync
- **Web version** to complement the mobile app
- **Seamless data synchronization** between mobile and web versions
- **Transitioning users from mobile to web**
  - Implementing QR code or short URL for easy access

## Implementation Order
1. **Finalize backend schema** to support planned AI feedback features
2. **Implement web version** with cross-device syncing
3. **Integrate adaptive difficulty system** into AI-generated lessons
4. **Develop real-time AI feedback sidebar** for the writing mode
5. **Refine UI/UX elements** (animations, textures, and cyberpunk-organic fusion)

## Conclusion
ScribeX is evolving into a fully interactive writing assistant with adaptive learning and real-time feedback. The combination of structured lessons, free-form writing, and AI-powered guidance aims to create an engaging and supportive writing experience for users of all skill levels.


