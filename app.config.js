// Load environment variables
const path = require('path');
const dotenv = require('dotenv');

// Attempt to load from .env file
dotenv.config();

export default {
  name: "ScribeX",
  slug: "scribex",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "scribex",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#FAF9F6"
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.scribex.app"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#FAF9F6"
    },
    package: "com.scribex.app"
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png"
  },
  plugins: [
    "expo-router"
  ],
  experiments: {
    typedRoutes: true
  },
  extra: {
    // Pass environment variables to the app
    openaiApiKey: process.env.OPENAI_API_KEY,
    enableAiFeatures: process.env.ENABLE_AI_FEATURES === "true",
    // Supabase configuration
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    // For internal use
    eas: {
      projectId: "scribex-educational-app"
    }
  }
};