import React from 'react';
import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { ThemeProvider } from './src/contexts/theme/ThemeContext';
import { TranslationProvider } from './src/contexts/translation/TranslationContext';
import RootNavigator from './src/navigation/RootNavigator';

// Main App component
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <TranslationProvider>
          <ThemeProvider>
            <PaperProvider>
              <NavigationContainer>
                <RootNavigator />
                <StatusBar style="auto" />
              </NavigationContainer>
            </PaperProvider>
          </ThemeProvider>
        </TranslationProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
