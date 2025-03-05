import React from 'react';
import { Tabs } from 'expo-router';
import { Home, BookOpen, Sparkles, Trophy, User } from 'lucide-react-native';
import { Platform } from 'react-native';
import { colors } from '@/constants/colors';

// Set the initial route to Journey (index) so when users exit exercises,
// they return to the Journey tab instead of Write
const initialRouteName = 'index';

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName={initialRouteName}
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopWidth: 1,
          borderTopColor: 'rgba(44, 24, 16, 0.05)',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabBarInactive,
        headerShown: false, // This removes the navigation headers completely
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
        },
        // Improve performance
        lazy: true,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Journey',
          tabBarIcon: ({ color }) => <Home size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="write"
        options={{
          title: 'Write',
          tabBarIcon: ({ color }) => <BookOpen size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="creative"
        options={{
          title: 'Creative',
          tabBarIcon: ({ color }) => <Sparkles size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Ranks',
          tabBarIcon: ({ color }) => <Trophy size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}