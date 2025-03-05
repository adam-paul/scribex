import React from 'react';
import { StyleSheet, View, Text, Image, ScrollView, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Award, BookOpen, Trophy, LogOut } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import { useProgressStore } from '@/stores/progress-store';
import supabaseService from '@/services/supabase-service';

export default function ProfileScreen() {
  const { user, isAuthenticated, signOut, loadUserData } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  const totalScore = useProgressStore(state => state.progress.totalScore);
  const achievements = useProgressStore(state => state.progress.achievements);
  const completedLevels = useProgressStore(state => state.progress.completedLevels);
  
  // Load user rank - streamlined to avoid dependency issues
  const loadUserRank = useCallback(async () => {
    try {
      // Only fetch rank if user is authenticated
      if (user?.id) {
        const rank = await supabaseService.getUserRank('profile.loadUserRank');
        setUserRank(rank);
      }
    } catch (error) {
      console.error('Error loading user rank:', error);
    }
  }, []);
  
  // Load only rank data since user data should be loaded at app level
  const loadProfileData = useCallback(async () => {
    setLoading(true);
    try {
      // Just load rank data, user data should already be loaded
      await loadUserRank();
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Handle pull-to-refresh - reload all data
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // We'll reload everything on manual refresh
    await loadUserData();
    await loadUserRank();
    setRefreshing(false);
  }, [loadUserData]);
  
  // Just load rank when component mounts
  useEffect(() => {
    loadProfileData();
  }, []); // Empty dependency array - load only on mount
  
  // If not authenticated, don't render anything
  if (!isAuthenticated || !user) {
    return null;
  }
  
  const stats = [
    { icon: BookOpen, label: 'Total Score', value: totalScore.toString() },
    { icon: Trophy, label: 'Levels Completed', value: completedLevels.length.toString() },
    { icon: Award, label: 'Achievements', value: achievements.length.toString() },
  ];
  
  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          onPress: async () => {
            await signOut();
          },
          style: 'destructive'
        }
      ]
    );
  };

  const navigateToLeaderboard = () => {
    router.push('/leaderboard');
  };

  // Get username from profile or email
  const username = user.profile?.username || user.email?.split('@')[0] || 'User';
  // Get user level from profile or default to 1
  const userLevel = user.profile?.level || 1;
  // Get user XP from profile or default to 0
  const userXP = user.profile?.xp || 0;
  // Get user avatar URL or use a default one
  const avatarUrl = user.profile?.avatar_url || `https://i.pravatar.cc/300?u=${user.id}`;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Always show profile content, only show loading indicator on initial load */}
        {loading && !user?.profile ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <View style={styles.headerTop}>
                <Image
                  source={{ uri: avatarUrl }}
                  style={styles.avatar}
                />
                <View style={styles.headerText}>
                  <Text style={styles.name}>{username}</Text>
                  <Text style={styles.level}>Level {userLevel} Writer</Text>
                  {userRank ? (
                    <Text style={styles.rank}>Rank #{userRank}</Text>
                  ) : loading ? (
                    <Text style={styles.rank}>Loading rank...</Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.signOutContainer}>
                <Button
                  title="Leaderboard"
                  onPress={navigateToLeaderboard}
                  variant="primary"
                  size="small"
                  icon={<Trophy size={16} color="#FFFFFF" />}
                  style={styles.actionButton}
                />
                <Button
                  title="Sign Out"
                  onPress={handleSignOut}
                  variant="secondary"
                  size="small"
                  icon={<LogOut size={16} color={colors.textSecondary} />}
                  style={styles.actionButton}
                />
              </View>
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

            <Card style={styles.xpCard}>
              <Text style={styles.sectionTitle}>Experience Points</Text>
              <Text style={styles.xpValue}>{userXP} XP</Text>
              <Text style={styles.xpInfo}>
                Earn XP by completing levels and writing exercises
              </Text>
            </Card>

            <Card style={styles.achievementsCard}>
              <Text style={styles.sectionTitle}>Recent Achievements</Text>
              <View style={styles.achievementsList}>
                {achievements.length > 0 ? (
                  achievements.map((achievement, index) => (
                    <View key={index} style={styles.achievementItem}>
                      <Award size={20} color={colors.primary} />
                      <View style={styles.achievementText}>
                        <Text style={styles.achievementTitle}>{achievement.title}</Text>
                        <Text style={styles.achievementDesc}>{achievement.description}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No achievements yet. Keep writing!</Text>
                )}
              </View>
            </Card>
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
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  rank: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 4,
  },
  signOutContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  signOutButton: {
    marginLeft: 8,
  },
  loginPrompt: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 4,
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
    gap: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementText: {
    marginLeft: 12,
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  achievementDesc: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  xpCard: {
    marginBottom: 24,
    alignItems: 'center',
  },
  xpValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  xpInfo: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});