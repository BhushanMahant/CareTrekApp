import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useTheme } from '../contexts/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

type MainAppScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MainApp'>;

type Props = {
  route: {
    params?: {
      isGuest?: boolean;
    };
  };
};

const MainApp = ({ route }: Props) => {
  const navigation = useNavigation<MainAppScreenNavigationProp>();
  const { isDark, theme } = useTheme();
  const isGuest = route.params?.isGuest || false;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          {isGuest ? 'Guest Mode' : 'Welcome Back'}
        </Text>
        {isGuest && (
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            You're using the app in guest mode. Some features may be limited.
          </Text>
        )}
      </View>

      <View style={styles.content}>
        {/* Add your main app content here */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Ionicons 
            name={isGuest ? 'person-outline' : 'person'} 
            size={60} 
            color={theme.primary} 
            style={styles.icon}
          />
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            {isGuest ? 'Guest User' : 'Authenticated User'}
          </Text>
          <Text style={[styles.cardText, { color: theme.textSecondary }]}>
            {isGuest 
              ? 'Sign up for a full account to unlock all features and save your progress.'
              : 'You have full access to all features.'}
          </Text>
          
          {isGuest && (
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={() => navigation.navigate('Auth', { screen: 'Register' })}
            >
              <Text style={styles.buttonText}>Sign Up for Full Access</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { borderTopColor: theme.border }]}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color={theme.primary} />
          <Text style={[styles.navText, { color: theme.primary }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="search" size={24} color={theme.textSecondary} />
          <Text style={[styles.navText, { color: theme.textSecondary }]}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="notifications-outline" size={24} color={theme.textSecondary} />
          <Text style={[styles.navText, { color: theme.textSecondary }]}>Alerts</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Profile')}
        >
          <Ionicons name="person-outline" size={24} color={theme.textSecondary} />
          <Text style={[styles.navText, { color: theme.textSecondary }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  navItem: {
    alignItems: 'center',
    padding: 8,
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default MainApp;
