import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text, Animated, Easing } from 'react-native';
import { CheckCircle, Trophy, ArrowUp } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { LearningLevel } from '@/types/learning';

type AnimationType = 'complete' | 'unlock' | 'levelUp';

interface LevelAnimationProps {
  type: AnimationType;
  level?: LearningLevel;
  onAnimationComplete?: () => void;
}

export function LevelAnimation({ 
  type, 
  level, 
  onAnimationComplete 
}: LevelAnimationProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;
  const translateY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Sequence of animations
    Animated.sequence([
      // Fade in and scale up
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)),
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)),
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)),
        }),
      ]),
      // Hold animation
      Animated.delay(1500),
      // Fade out
      Animated.timing(opacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Call callback when animation completes
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    });
  }, [opacity, scale, translateY, onAnimationComplete]);

  // Determine animation content based on type
  const renderContent = () => {
    switch (type) {
      case 'complete':
        return (
          <>
            <CheckCircle size={50} color={colors.success} />
            <Text style={styles.title}>Level Complete!</Text>
            {level && <Text style={styles.subtitle}>{level.title}</Text>}
          </>
        );
      case 'unlock':
        return (
          <>
            <View style={styles.iconContainer}>
              <CheckCircle size={50} color={colors.success} />
            </View>
            <Text style={styles.title}>New Level Unlocked!</Text>
            {level && <Text style={styles.subtitle}>{level.title}</Text>}
          </>
        );
      case 'levelUp':
        return (
          <>
            <View style={styles.iconContainer}>
              <ArrowUp size={50} color={colors.primary} />
            </View>
            <Text style={styles.title}>Level Up!</Text>
            <Text style={styles.subtitle}>You've reached a new milestone!</Text>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.container,
          {
            opacity,
            transform: [{ scale }, { translateY }],
          },
        ]}
      >
        {renderContent()}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  container: {
    backgroundColor: colors.surface,
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    maxWidth: '80%',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginVertical: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});