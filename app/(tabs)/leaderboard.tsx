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
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const USERS_PER_PAGE = 10;
  const { user } = useAuth();

  const fetchLeaderboard = useCallback(async (page: number = 0, reset: boolean = true) => {
    try {
      setLoading(reset);
      if (!reset) setLoadingMore(true);

      const response = await supabaseService.getLeaderboardRanking(page, USERS_PER_PAGE);
      
      if (response.data) {
        if (reset) {
          // Reset the leaderboard with the first page
          setLeaderboard(response.data);
        } else {
          // Append to existing leaderboard for pagination
          setLeaderboard(prev => [...prev, ...response.data]);
        }
        
        setTotalUsers(response.total);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLeaderboard(0, true);
    setRefreshing(false);
  }, [fetchLeaderboard]);

  const loadMore = useCallback(async () => {
    // Only load more if we haven't loaded all users
    if (leaderboard.length < totalUsers && !loadingMore) {
      const nextPage = currentPage + 1;
      await fetchLeaderboard(nextPage, false);
    }
  }, [currentPage, fetchLeaderboard, leaderboard.length, loadingMore, totalUsers]);

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
        onScroll={({nativeEvent}) => {
          // Load more when we're 80% of the way through the current content
          const {layoutMeasurement, contentOffset, contentSize} = nativeEvent;
          const paddingToBottom = 20;
          if (layoutMeasurement.height + contentOffset.y >= 
              contentSize.height - paddingToBottom) {
            loadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.subtitle}>
          Top Writers {totalUsers > 0 ? `(${leaderboard.length} of ${totalUsers})` : ''}
        </Text>

        {leaderboard.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No writers on the leaderboard yet. Be the first!</Text>
          </Card>
        ) : (
          <>
            {leaderboard.map((profile, index) => {
              const isCurrentUser = user?.id === profile.user_id;
              const displayName = profile.display_name || profile.username || 'Anonymous Writer';
              const avatarUrl = profile.avatar_url || `https://i.pravatar.cc/100?u=${profile.user_id}`;
              const rankNumber = (currentPage * USERS_PER_PAGE) + index + 1;
              
              return (
                <Card 
                  key={profile.user_id} 
                  style={{
                    ...styles.userCard,
                    ...(isCurrentUser ? styles.currentUserCard : {})
                  }}
                >
                  <View style={styles.userInfo}>
                    <Text style={styles.rank}>#{rankNumber}</Text>
                    <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                    <View style={styles.nameContainer}>
                      <Text style={{
                        ...styles.name,
                        ...(isCurrentUser ? styles.currentUserText : {})
                      }}>
                        {displayName} {isCurrentUser && '(You)'}
                      </Text>
                      {rankNumber === 1 && <Crown size={16} color="#FFD700" />}
                    </View>
                    <Text style={styles.score}>{profile.xp} XP</Text>
                  </View>
                </Card>
              );
            })}
            
            {loadingMore && (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingMoreText}>Loading more...</Text>
              </View>
            )}
            
            {!loadingMore && leaderboard.length < totalUsers && (
              <Text style={styles.moreAvailable}>
                Scroll down to load more writers
              </Text>
            )}
            
            {leaderboard.length === totalUsers && (
              <Text style={styles.allLoaded}>
                All writers loaded!
              </Text>
            )}
          </>
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
    paddingBottom: 40,
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
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  moreAvailable: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 8,
  },
  allLoaded: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: colors.success,
    marginTop: 16,
    marginBottom: 8,
  },
});