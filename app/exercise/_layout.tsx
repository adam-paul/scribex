import React from 'react';
import { Stack } from 'expo-router';

export default function ExerciseLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
} 