import React from 'react';
import { StyleSheet, View, Text, Image, ScrollView, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, BookOpen, Trophy, LogOut } from 'lucide-react-native';
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
  
  const totalXp = useProgressStore(state => state.progress.totalXp);
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
  }, [user?.id]);
  
  // Load only rank data since user data is handled by AuthContext
  const loadProfileData = useCallback(async () => {
    setLoading(true);
    try {
      await loadUserRank();
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  }, [loadUserRank]);
  
  // Handle pull-to-refresh - reload all data
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Explicitly refresh user data on pull-to-refresh
      await Promise.all([
        loadUserData(),
        loadUserRank()
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [loadUserData, loadUserRank]);
  
  // Just load rank when component mounts
  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);
  
  // If not authenticated, don't render anything
  if (!isAuthenticated || !user) {
    return null;
  }
  
  const stats = [
    { icon: BookOpen, label: 'Total XP', value: totalXp.toString() },
    { icon: Trophy, label: 'Levels Completed', value: completedLevels.length.toString() },
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
  // Calculate level from progress store's XP
  const userLevel = user.profile?.level || 1;
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
              <Text style={styles.xpValue}>{totalXp} XP</Text>
              <Text style={styles.xpInfo}>
                Earn XP by completing levels and writing exercises
              </Text>
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
    color: colors.textSecondary,
    marginTop: 4,
  },
  signOutContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    minWidth: 120,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
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
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
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