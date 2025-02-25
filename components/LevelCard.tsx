import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Lock, CheckCircle } from 'lucide-react-native';
import { colors, shadows } from '@/constants/colors';
import { LearningLevel } from '@/types/learning';
import { LEVEL_COLORS } from '@/constants/levels';

type ThemeColors = {
  primary: string;
  secondary: string;
  accent: string;
};

type LevelCardProps = {
  level: LearningLevel;
  onPress: () => void;
  themeColors?: ThemeColors;
};

export function LevelCard({ level, onPress, themeColors }: LevelCardProps) {
  // Use theme colors if provided, otherwise use default level colors
  const primaryColor = themeColors?.primary || LEVEL_COLORS[level.type] || colors.primary;
  
  return (
    <Pressable
      onPress={level.unlocked ? onPress : undefined}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
        !level.unlocked && styles.locked,
      ]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{level.title}</Text>
          {!level.unlocked && <Lock size={20} color={colors.textMuted} />}
          {level.completed && <CheckCircle size={20} color={colors.success} />}
        </View>
        
        <Text style={styles.description}>{level.description}</Text>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${level.progress}%`, backgroundColor: primaryColor }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{level.progress}%</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.difficultyContainer}>
            {Array.from({ length: level.difficulty }).map((_, i) => (
              <View 
                key={i}
                style={[styles.difficultyDot, { backgroundColor: primaryColor }]} 
              />
            ))}
          </View>
          <Text style={styles.typeLabel}>{level.type}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(44, 24, 16, 0.05)',
    ...shadows.small,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: 2,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    width: 40,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  difficultyContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  difficultyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  typeLabel: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'capitalize',
  },
  pressed: {
    opacity: 0.9,
  },
  locked: {
    opacity: 0.6,
  },
});