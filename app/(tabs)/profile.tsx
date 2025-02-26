import { StyleSheet, View, Text, Image, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Award, BookOpen, Trophy, LogOut } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useProgressStore } from '@/stores/progress-store';

export default function ProfileScreen() {
  const { user, isAuthenticated, signOut, loadUserData } = useAuth();
  const router = useRouter();
  // removed refreshing state
  const totalScore = useProgressStore(state => state.progress.totalScore);
  const achievements = useProgressStore(state => state.progress.achievements);
  
  // Force redirection if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('Profile screen: Not authenticated, redirecting to auth');
      router.replace('/auth');
      return;
    }
    
    // Load user data if authenticated
    loadUserData();
  }, [isAuthenticated, router]);
  
  // If not authenticated, don't render anything
  if (!isAuthenticated || !user) {
    return null;
  }
  
  const stats = [
    { icon: BookOpen, label: 'Total Score', value: totalScore.toString() },
    { icon: Trophy, label: 'Levels Completed', value: useProgressStore(state => state.progress.completedLevels.length).toString() },
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Image
              source={{ uri: `https://i.pravatar.cc/300?u=${user.id}` }}
              style={styles.avatar}
            />
            <View style={styles.headerText}>
              <Text style={styles.name}>{user.email?.split('@')[0] || 'User'}</Text>
              <Text style={styles.level}>Level 12 Writer</Text>
            </View>
          </View>
          <View style={styles.signOutContainer}>
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
    // Add styles for achievements list
  },
});