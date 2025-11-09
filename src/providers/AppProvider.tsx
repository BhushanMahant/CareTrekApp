import React from 'react';
import { ThemeProvider } from '../contexts/theme/ThemeContext';
import { TranslationProvider } from '../contexts/translation/TranslationContext';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { SpaceMono_400Regular } from '@expo-google-fonts/space-mono';

type AppProviderProps = {
  children: React.ReactNode;
};

const AppContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <TranslationProvider>
      {children}
    </TranslationProvider>
  );
};

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    SpaceMono_400Regular,
  });

  if (!fontsLoaded) {
    return null; // Or a loading indicator
  }

  return (
    <ThemeProvider>
      <AppContent>
        {children}
      </AppContent>
    </ThemeProvider>
  );
};
