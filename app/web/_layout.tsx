import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';

export default function WebLayout() {
  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#f7f5ee' }, // Paper-like color
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