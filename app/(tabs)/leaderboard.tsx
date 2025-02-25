import { StyleSheet, View, Text, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Crown } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Card } from '@/components/Card';

const MOCK_LEADERBOARD = [
  { id: '1', name: 'Sarah K.', score: 2500, avatar: 'https://i.pravatar.cc/100?img=1' },
  { id: '2', name: 'Michael R.', score: 2350, avatar: 'https://i.pravatar.cc/100?img=2' },
  { id: '3', name: 'Emma L.', score: 2200, avatar: 'https://i.pravatar.cc/100?img=3' },
  { id: '4', name: 'James T.', score: 2100, avatar: 'https://i.pravatar.cc/100?img=4' },
  { id: '5', name: 'Alex M.', score: 2000, avatar: 'https://i.pravatar.cc/100?img=5' },
];

export default function LeaderboardScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.subtitle}>Top Writers This Week</Text>

        {MOCK_LEADERBOARD.map((user, index) => (
          <Card key={user.id} style={styles.userCard}>
            <View style={styles.userInfo}>
              <Text style={styles.rank}>#{index + 1}</Text>
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
              <View style={styles.nameContainer}>
                <Text style={styles.name}>{user.name}</Text>
                {index === 0 && <Crown size={16} color="#FFD700" />}
              </View>
              <Text style={styles.score}>{user.score}</Text>
            </View>
          </Card>
        ))}
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  userCard: {
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rank: {
    width: 40,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  nameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  score: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
});