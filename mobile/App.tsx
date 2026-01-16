import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/navigation/RootNavigator';
import { DatabaseProvider } from './src/context/DatabaseContext';
import { SyncProvider } from './src/context/SyncContext';

export default function App() {
  useEffect(() => {
    // Initialize app
    console.log('🚀 Iniciando REURB App');
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <DatabaseProvider>
          <SyncProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </SyncProvider>
        </DatabaseProvider>
        <StatusBar barStyle="dark-content" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
