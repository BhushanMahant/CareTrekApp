import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/theme/ThemeContext';
import { useTranslation } from 'react-i18next';

// Import all family screens
import HomeScreenFamily from '../screens/family/HomeScreenFamily';
import SeniorsListScreen from '../screens/family/SeniorsListScreen';
import SeniorDetailScreen from '../screens/family/SeniorDetailScreen';
import AlertsScreen from '../screens/family/AlertsScreen';
import MessagesScreen from '../screens/family/MessagesScreen';
import FamilySettingsScreen from '../screens/family/FamilySettingsScreen';
import NewConnectSeniorScreen from '../screens/family/NewConnectSeniorScreen';
import HealthHistoryScreen from '../screens/family/HealthHistoryScreen';

// Type definitions for tab navigation
export type FamilyTabParamList = {
  Home: undefined;
  Seniors: { refresh?: boolean };
  Alerts: undefined;
  Messages: undefined;
  Settings: undefined;
};

// Type definitions for stack navigation
export type FamilyStackParamList = {
  // Tabs
  MainTabs: undefined;
  
  // Screens
  Home: undefined;
  Seniors: { refresh?: boolean };
  SeniorDetail: { seniorId: string };
  ConnectSenior: undefined;
  Alerts: undefined;
  Messages: { recipientId?: string };
  Settings: undefined;
  
  // Other family screens
  SeniorDetailScreen: { seniorId: string };
  NewConnectSenior: undefined;
  FamilySettings: undefined;
  HealthHistory: { seniorId: string };
};

const Tab = createBottomTabNavigator<FamilyTabParamList>();
const Stack = createStackNavigator<FamilyStackParamList>();

// Tab Navigator for the main family screens
const TabNavigator = () => {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  // Translations
  const homeText = t('Home') || 'Home';
  const seniorsText = t('Seniors') || 'Seniors';
  const alertsText = t('Alerts') || 'Alerts';
  const messagesText = t('Messages') || 'Messages';
  const settingsText = t('Settings') || 'Settings';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'Home') {
            return <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />;
          } else if (route.name === 'Seniors') {
            return <Ionicons name={focused ? 'people' : 'people-outline'} size={size} color={color} />;
          } else if (route.name === 'Alerts') {
            return (
              <MaterialCommunityIcons
                name={focused ? 'bell' : 'bell-outline'}
                size={size}
                color={color}
              />
            );
          } else if (route.name === 'Messages') {
            return (
              <Ionicons
                name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
                size={size}
                color={color}
              />
            );
          } else if (route.name === 'Settings') {
            return <Ionicons name={focused ? 'settings' : 'settings-outline'} size={size} color={color} />;
          }
        },
        tabBarActiveTintColor: isDark ? '#48BB78' : '#2F855A',
        tabBarInactiveTintColor: isDark ? '#A0AEC0' : '#718096',
        tabBarStyle: {
          backgroundColor: isDark ? '#1A202C' : '#FFFFFF',
          borderTopColor: isDark ? '#2D3748' : '#E2E8F0',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 4,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreenFamily} 
        options={{ title: homeText }}
      />
      <Tab.Screen 
        name="Seniors" 
        component={SeniorsListScreen} 
        options={{ title: seniorsText }}
      />
      <Tab.Screen 
        name="Alerts" 
        component={AlertsScreen} 
        options={{ title: alertsText }}
      />
      <Tab.Screen 
        name="Messages" 
        component={MessagesScreen} 
        options={{ 
          title: messagesText,
          tabBarLabelStyle: {
            fontSize: 10,
          },
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={FamilySettingsScreen} 
        options={{ title: settingsText }}
      />
    </Tab.Navigator>
  );
};

// Main Family Navigator with Stack Navigation
const FamilyNavigator = () => {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  
  // Translations
  const homeText = t('Home') || 'Home';
  const seniorsText = t('Seniors') || 'Seniors';
  const alertsText = t('Alerts') || 'Alerts';
  const messagesText = t('Messages') || 'Messages';
  const settingsText = t('Settings') || 'Settings';
  const connectSeniorText = t('Connect Senior') || 'Connect Senior';
  const seniorDetailsText = t('Senior Details') || 'Senior Details';

  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? '#1A202C' : '#FFFFFF',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTintColor: isDark ? '#E2E8F0' : '#1A202C',
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerBackTitle: '', // This replaces headerBackTitleVisible: false
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        component={TabNavigator} 
        options={{ headerShown: false }} 
      />
      
      {/* Screens that should not be in tabs */}
      <Stack.Screen 
        name="SeniorDetail" 
        component={SeniorDetailScreen} 
        options={{ title: seniorDetailsText }} 
      />
      
      <Stack.Screen 
        name="NewConnectSenior" 
        component={NewConnectSeniorScreen} 
        options={{ title: connectSeniorText }}
      />
      
      <Stack.Screen 
        name="Messages" 
        component={MessagesScreen}
        options={({ route }) => ({
          title: route.params?.recipientId 
            ? `${t('Messages')} - ${route.params.recipientId}`
            : t('Messages') || 'Messages',
          headerShown: true,
        })} 
      />
      
      <Stack.Screen 
        name="FamilySettings" 
        component={FamilySettingsScreen} 
        options={{ 
          title: t('Settings') || 'Settings',
          headerShown: true,
        }} 
      />
      
      <Stack.Screen 
        name="HealthHistory" 
        component={HealthHistoryScreen}
        options={{
          title: t('Health History') || 'Health History',
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
};

export default FamilyNavigator;
