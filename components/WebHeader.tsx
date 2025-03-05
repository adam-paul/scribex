import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeftCircle, LogOut } from 'lucide-react-native';

interface WebHeaderProps {
  showBackButton?: boolean;
  onBackPress?: () => void;
}

export function WebHeader({ showBackButton, onBackPress }: WebHeaderProps) {
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.leftSection}>
          {showBackButton && (
            <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
              <ArrowLeftCircle size={20} color={colors.primary} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.logo}>ScribeX</Text>
        </View>
        
        {user && (
          <View style={styles.rightSection}>
            <Text style={styles.username}>{user.email}</Text>
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <LogOut size={16} color={colors.textSecondary} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  backButtonText: {
    color: colors.primary,
    marginLeft: 4,
    fontSize: 16,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    color: colors.textSecondary,
    marginRight: 16,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceHighlight,
  },
  signOutText: {
    color: colors.textSecondary,
    marginLeft: 4,
  },
}); 