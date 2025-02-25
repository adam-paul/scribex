import { StyleSheet, View, Text, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Award, BookOpen, Trophy } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';

export default function ProfileScreen() {
  const stats = [
    { icon: BookOpen, label: 'Words Written', value: '12,450' },
    { icon: Trophy, label: 'Challenges Won', value: '8' },
    { icon: Award, label: 'Achievements', value: '15' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Image
              source={{ uri: 'https://i.pravatar.cc/300' }}
              style={styles.avatar}
            />
            <View style={styles.headerText}>
              <Text style={styles.name}>Alex Johnson</Text>
              <Text style={styles.level}>Level 12 Writer</Text>
            </View>
          </View>
          <Button
            title="Settings"
            onPress={() => {}}
            variant="secondary"
            size="small"
          />
        </View>

        <View style={styles.statsGrid}>
          {stats.map((Stat, index) => (
            <Card key={index} style={styles.statCard}>
              <Stat.icon size={24} color={colors.primary} />
              <Text style={styles.statValue}>{Stat.value}</Text>
              <Text style={styles.statLabel}>{Stat.label}</Text>
            </Card>
          ))}
        </View>

        <Card style={styles.achievementsCard}>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          <View style={styles.achievementsList}>
            {/* Add achievement items here */}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  level: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  achievementsCard: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  achievementsList: {
    // Add styles for achievements list
  },
});