import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1a73e8',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'REURB - Vistoria',
        }}
      />
      <Stack.Screen
        name="vistoria/[id]"
        options={{
          title: 'Nova Vistoria',
        }}
      />
    </Stack>
  );
}
