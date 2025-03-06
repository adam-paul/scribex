import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useProgressStore } from '@/stores/progress-store';
import { LEVELS } from '@/constants/levels';
import { colors } from '@/constants/colors';
import { LevelCard } from '@/components/LevelCard';
import { ProgressHeader } from '@/components/ProgressHeader';
import { LevelAnimation } from '@/components/LevelAnimation';
import { useTheme } from '@/contexts/ThemeContext';
import { LearningLevel } from '@/types/learning';
import NetInfo from '@react-native-community/netinfo';

export default function MapScreen() {
  const progress = useProgressStore((state) => state.progress);
  const { offlineChanges, syncWithServer } = useProgressStore();
  const { currentTheme } = useTheme();
  
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationType, setAnimationType] = useState<'complete' | 'unlock' | 'levelUp'>('complete');
  const [animationLevel, setAnimationLevel] = useState<LearningLevel | undefined>(undefined);
  const [isOffline, setIsOffline] = useState(false);
  
  // Handle level selection
  const handleLevelPress = (levelId: string) => {
    router.push(`/exercise/${levelId}`);
  };
  
  // Check for network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
      
      // Try to sync when connection is restored
      if (state.isConnected && offlineChanges) {
        syncWithServer();
      }
    });
    
    return () => unsubscribe();
  }, [offlineChanges, syncWithServer]);
  
  // Check for any level unlocks needed when the Journey page loads
  // This helps fix cases where levels weren't properly unlocked
  useEffect(() => {
    const checkForUnlocks = async () => {
      console.log('Journey screen loaded, checking for any pending level unlocks...');
      const checkAndUnlockNextContent = useProgressStore.getState().checkAndUnlockNextContent;
      await checkAndUnlockNextContent();
    };
    
    checkForUnlocks();
  }, []);
  
  // Animation logic would be triggered by level completion elsewhere
  // Demo animation has been removed to prevent showing on every app launch
  
  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground 
        source={currentTheme.backgroundImage}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <ProgressHeader 
            score={progress.totalScore}
            streak={progress.dailyStreak}
            isOffline={isOffline}
          />
          
          {LEVELS.map((level) => (
            <LevelCard
              key={level.id}
              level={{
                ...level,
                // For mechanics, we need to track each level individually now
                progress: progress.completedLevels.includes(level.id) ? 100 : // If completed, show 100%
                          level.type === 'mechanics' ? 
                            // For mechanics levels, check if this specific level is being tracked
                            (level.id === progress.currentLevel && level.type === 'mechanics') ? 
                              progress.mechanicsProgress : 0 :
                          level.type === 'sequencing' ? progress.sequencingProgress : 
                          level.type === 'voice' ? progress.voiceProgress : 0,
                isCompleted: progress.completedLevels.includes(level.id),
                isUnlocked: progress.unlockedLevels.includes(level.id),
              }}
              onPress={() => handleLevelPress(level.id)}
              themeColors={{
                primary: currentTheme.primaryColor,
                secondary: currentTheme.secondaryColor,
                accent: currentTheme.accentColor,
              }}
            />
          ))}
        </ScrollView>
      </ImageBackground>
      
      {showAnimation && (
        <LevelAnimation 
          type={animationType}
          level={animationLevel}
          onAnimationComplete={() => setShowAnimation(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  backgroundImageStyle: {
    opacity: 0.1,
  },
  content: {
    padding: 16,
    paddingBottom: 100, // Extra padding at bottom for scrolling
  },
});