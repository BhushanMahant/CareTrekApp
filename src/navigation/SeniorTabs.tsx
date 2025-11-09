import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/theme/ThemeContext';
import { SeniorTabParamList } from '../types/navigation';

// Import screens
import HomeScreen from '../screens/Senior/HomeScreen';
import MapScreen from '../screens/Senior/MapScreen';
import HealthScreen from '../screens/Senior/HealthScreen';
import RemindersScreen from '../screens/Senior/RemindersScreen';

const Tab = createBottomTabNavigator<SeniorTabParamList>();

export const SeniorTabs = () => {
  const { isDark } = useTheme();

  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'help';

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Map':
              iconName = focused ? 'map' : 'map-outline';
              break;
            case 'Health':
              iconName = focused ? 'heart' : 'heart-outline';
              break;
            case 'Reminders':
              iconName = focused ? 'alarm' : 'alarm-outline';
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Map" component={MapScreen} options={{ title: 'Map' }} />
      <Tab.Screen name="Health" component={HealthScreen} options={{ title: 'Health' }} />
      <Tab.Screen 
        name="Reminders" 
        component={RemindersScreen} 
        options={{ title: 'Reminders' }} 
      />
    </Tab.Navigator>
  );
};
