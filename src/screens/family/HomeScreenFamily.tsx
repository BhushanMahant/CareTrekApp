import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/theme/ThemeContext';
import { useTranslation } from '../../contexts/translation/TranslationContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { StyleProp, ViewStyle, TextStyle } from 'react-native';

type SeniorMember = {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'alert';
  lastActive: string;
  heartRate?: number;
  oxygen?: number;
  battery?: number;
  location?: string;
};

type QuickAction = {
  id: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  screen: string;
  color: string;
};

type RootStackParamList = {
  SeniorDetail: { seniorId: string };
  Messages: { seniorId: string };
  Alerts: { seniorId: string };
  Settings: undefined;
  ConnectSenior: undefined;
  TrackSenior: { seniorId: string };
  HealthHistory: { seniorId: string };
  [key: string]: undefined | object;
};

type HomeScreenFamilyNavigationProp = StackNavigationProp<RootStackParamList>;

const HomeScreenFamily = () => {
  const navigation = useNavigation<HomeScreenFamilyNavigationProp>();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    navigation.goBack();
  };

  // Quick Actions with updated colors to match theme
  const quickActions: QuickAction[] = [
    {
      id: '1',
      icon: 'location-on',
      title: 'Track Location',
      screen: 'TrackSenior',
      color: isDark ? '#63B3ED' : '#2B6CB0', // Blue
    },
    {
      id: '2',
      icon: 'history',
      title: 'Health History',
      screen: 'HealthHistory',
      color: isDark ? '#68D391' : '#2F855A', // Green
    },
    {
      id: '3',
      icon: 'chat',
      title: 'Messages',
      screen: 'Messages',
      color: isDark ? '#B794F4' : '#6B46C1', // Purple
    },
    {
      id: '4',
      icon: 'notifications',
      title: 'Alerts',
      screen: 'Alerts',
      color: isDark ? '#FC8181' : '#C53030', // Red
    },
  ];

  const seniorMembers: SeniorMember[] = [
    {
      id: '1',
      name: 'Ramesh Patel',
      status: 'online',
      lastActive: '2 min ago',
      heartRate: 72,
      oxygen: 98,
      battery: 85,
      location: 'Home',
    },
  ];

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate data refresh
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const renderQuickAction = ({ item }: { item: QuickAction }) => (
    <TouchableOpacity
      style={[styles.quickAction, { backgroundColor: item.color }]}
      onPress={() => navigation.navigate(item.screen as any, { seniorId: '1' })}
    >
      <MaterialIcons name={item.icon} size={24} color="white" />
      <Text style={styles.quickActionText}>{item.title}</Text>
    </TouchableOpacity>
  );

  const renderSeniorCard = ({ item }: { item: SeniorMember }) => (
    <TouchableOpacity
      style={[styles.seniorCard, { backgroundColor: colors.card }]}
      onPress={() => navigation.navigate('SeniorDetail', { seniorId: item.id })}
    >
      <View style={styles.seniorHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={32} color={colors.text} />
        </View>
        <View style={styles.seniorInfo}>
          <Text style={[styles.seniorName, { color: colors.text }]}>{item.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: item.status === 'online' ? '#38A169' : '#E53E3E' }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
      </View>
      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Ionicons name="heart" size={16} color="#E53E3E" />
          <Text style={[styles.metricText, { color: colors.text }]}>{item.heartRate} bpm</Text>
        </View>
        <View style={styles.metric}>
          <Ionicons name="water" size={16} color="#3182CE" />
          <Text style={[styles.metricText, { color: colors.text }]}>{item.oxygen}%</Text>
        </View>
        <View style={styles.metric}>
          <Ionicons 
            name="battery-charging" 
            size={16} 
            color={item.battery && item.battery < 20 ? '#E53E3E' : '#38A169'} 
          />
          <Text style={[styles.metricText, { color: colors.text }]}>{item.battery}%</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Back Button */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={colors.primary || (isDark ? '#81E6D9' : '#2C7A7B')} 
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('familyDashboard') || 'Family Dashboard'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[colors.primary || (isDark ? '#81E6D9' : '#2C7A7B')]}
            tintColor={colors.primary || (isDark ? '#81E6D9' : '#2C7A7B')}
          />
        }
        style={styles.scrollView}
      >
        {/* Welcome Section */}
        <View style={[styles.welcomeCard, { backgroundColor: colors.card }]}>
          <View>
            <Text style={[styles.welcomeText, { color: colors.text }]}>
              {t('welcomeBack') || 'Welcome back!'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.text }]}>
              {t('checkOnYourLovedOnes') || 'Check on your loved ones'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.settingsButton, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.quickActionsContainer}>
            {quickActions.map((action) => (
              <View key={action.id} style={styles.quickActionWrapper}>
                {renderQuickAction({ item: action })}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Connected Seniors
            </Text>
            <TouchableOpacity>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={seniorMembers}
            renderItem={renderSeniorCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.seniorList}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  headerRight: {
    width: 40, // Same as back button for balance
  },
  scrollView: {
    flex: 1,
  },
  welcomeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Additional styles
  greeting: {
    fontSize: 16,
    opacity: 0.8,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  settingsButton: {
    padding: 10,
    borderRadius: 20,
    elevation: 2,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionWrapper: {
    width: '48%',
    marginBottom: 15,
  },
  quickAction: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    minHeight: 100,
  },
  quickActionText: {
    color: 'white',
    marginTop: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
  seniorList: {
    paddingBottom: 10,
  },
  seniorCard: {
    width: 280,
    borderRadius: 12,
    padding: 15,
    marginRight: 15,
    elevation: 2,
  },
  seniorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  seniorInfo: {
    flex: 1,
  },
  seniorName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    marginLeft: 4,
    fontSize: 12,
  },
});

export default HomeScreenFamily;
