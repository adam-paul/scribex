import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';

/**
 * Web layout with minimal structure for web-specific routes
 * This layout doesn't require authentication and is standalone
 */
export default function WebLayout() {
  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#f7f5ee' }, // Paper-like color
          animation: 'none', // Disable animations for web
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f5ee', // Paper-like color
  },
});