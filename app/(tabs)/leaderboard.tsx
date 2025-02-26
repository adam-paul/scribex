import { StyleSheet, View, Text, ScrollView, Image, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Crown } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Card } from '@/components/Card';
import { useEffect, useState, useCallback } from 'react';
import supabaseService, { UserProfile } from '@/services/supabase-service';
import { useAuth } from '@/contexts/AuthContext';

export default function LeaderboardScreen() {
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const fetchLeaderboard = useCallback(async () => {
    try {
      const data = await supabaseService.getLeaderboardRanking(10);
      if (data) {
        setLeaderboard(data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLeaderboard();
    setRefreshing(false);
  }, [fetchLeaderboard]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.subtitle}>Top Writers</Text>

        {leaderboard.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No writers on the leaderboard yet. Be the first!</Text>
          </Card>
        ) : (
          leaderboard.map((profile, index) => {
            const isCurrentUser = user?.id === profile.user_id;
            const displayName = profile.display_name || profile.username || 'Anonymous Writer';
            const avatarUrl = profile.avatar_url || `https://i.pravatar.cc/100?u=${profile.user_id}`;
            
            return (
              <Card 
                key={profile.user_id} 
                style={{
                  ...styles.userCard,
                  ...(isCurrentUser ? styles.currentUserCard : {})
                }}
              >
                <View style={styles.userInfo}>
                  <Text style={styles.rank}>#{index + 1}</Text>
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                  <View style={styles.nameContainer}>
                    <Text style={{
                      ...styles.name,
                      ...(isCurrentUser ? styles.currentUserText : {})
                    }}>
                      {displayName} {isCurrentUser && '(You)'}
                    </Text>
                    {index === 0 && <Crown size={16} color="#FFD700" />}
                  </View>
                  <Text style={styles.score}>{profile.xp} XP</Text>
                </View>
              </Card>
            );
          })
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
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
  currentUserCard: {
    borderColor: colors.primary,
    borderWidth: 2,
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
  currentUserText: {
    color: colors.primary,
    fontWeight: '700',
  },
  score: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});