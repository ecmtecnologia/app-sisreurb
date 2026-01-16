import { Stack } from 'expo-router';
import React from 'react';

export default function VistoriaLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="[propertyId]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
