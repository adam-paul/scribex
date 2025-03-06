import { StyleSheet, View, Text } from 'react-native';
import { Trophy, Flame, WifiOff } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Card } from './Card';

type ProgressHeaderProps = {
  xp: number;
  streak: number;
  isOffline?: boolean;
};

export function ProgressHeader({ xp, streak, isOffline = false }: ProgressHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.welcomeText}>Welcome back!</Text>
        {isOffline && (
          <View style={styles.offlineIndicator}>
            <WifiOff size={14} color={colors.warning} />
            <Text style={styles.offlineText}>Offline</Text>
          </View>
        )}
      </View>
      <Text style={styles.title}>Your Journey</Text>
      
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Trophy size={24} color={colors.primary} />
          <Text style={styles.statValue}>{xp}</Text>
          <Text style={styles.statLabel}>XP</Text>
        </Card>
        
        <Card style={styles.statCard}>
          <Flame size={24} color={colors.secondary} />
          <Text style={styles.statValue}>{streak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(197, 165, 114, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  offlineText: {
    fontSize: 12,
    color: colors.warning,
    marginLeft: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});