import React, { useState, useEffect, useCallback } from 'react';
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
  Image,
  Dimensions,
  Platform
} from 'react-native';
import { useNavigation, useIsFocused, useTheme as useNavTheme } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../contexts/theme/ThemeContext';
import { useTranslation } from '../../contexts/translation/TranslationContext';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCachedTranslation } from '../../hooks/useCachedTranslation';
import { getSeniors, saveSeniors, clearAllSeniors } from '../../utils/seniorStorage';
import type { SeniorData } from '../../utils/seniorStorage';


type QuickAction = {
  id: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  screen: string;
  color: string;
  bgColor: string;
};

type RootStackParamList = {
  SeniorDetail: { 
    seniorId: string;
    seniorName: string;
    status: 'online' | 'offline' | 'alert';
  };
  Messages: { seniorId?: string };
  Alerts: { seniorId?: string };
  Settings: undefined;
  HealthHistory: { seniorId: string };
  TrackSenior: { seniorId: string };
  SOSContacts: undefined;
  ConnectSenior: undefined;
  Home: undefined;
  MainTabs: undefined;
};

const { width } = Dimensions.get('window');


export type HomeScreenFamilyNavigationProp = StackNavigationProp<RootStackParamList>;


const HomeScreenFamily = () => {
  const navigation = useNavigation<HomeScreenFamilyNavigationProp>();
  const isFocused = useIsFocused();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Home');
  const [seniorMembers, setSeniorMembers] = useState<SeniorData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Clear all senior data on initial load (for development/testing)
  // Remove or comment this out in production
  // useEffect(() => {
  //   const clearData = async () => {
  //     try {
  //       await clearAllSeniors();
  //       console.log('Cleared all senior data');
  //     } catch (error) {
  //       console.error('Error clearing senior data:', error);
  //     }
  //   };
  //   
  //   clearData();
  // }, []);
  
  // Function to update senior data with new profiles
  const updateSeniorProfiles = async () => {
    try {
      const newSeniors: SeniorData[] = [
        {
          id: '1',
          name: 'Bhushan Mahant',
          seniorId: 'senior-001',
          status: 'online',
          lastActive: '2 min ago',
          heartRate: 75,
          oxygen: 97,
          battery: 85,
          location: 'Home'
        },
        {
          id: '2',
          name: 'Aditi Lanjewar',
          seniorId: 'senior-002',
          status: 'alert',
          lastActive: '5 min ago',
          heartRate: 88,
          oxygen: 95,
          battery: 72,
          location: 'Park'
        }
      ];
      await saveSeniors(newSeniors);
      setSeniorMembers(newSeniors);
    } catch (error) {
      console.error('Error updating senior profiles:', error);
    }
  };

  // Load connected seniors from storage
  const loadSeniors = useCallback(async () => {
    try {
      const savedSeniors = await getSeniors();
      
      // If no seniors exist, create default ones
      if (savedSeniors.length === 0) {
        await updateSeniorProfiles();
      } else {
        setSeniorMembers(savedSeniors);
      }
    } catch (error) {
      console.error('Error loading seniors:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Load data when screen comes into focus
  useEffect(() => {
    if (isFocused) {
      loadSeniors();
    }
  }, [isFocused, loadSeniors]);
  
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSeniors().finally(() => {
      setRefreshing(false);
    });
  }, [loadSeniors]);
  
  // Get translations
  const translations = {
    welcome: t('Welcome back') || 'Welcome back!',
    track: t('Track Location') || 'Track Location',
    health: t('Health') || 'Health',
    messages: t('Messages') || 'Messages',
    alerts: t('Alerts') || 'Alerts',
    sos: t('SOS') || 'SOS',
    quickActions: t('Quick Actions') || 'Quick Actions',
    connectedSeniors: t('Connected Seniors') || 'Connected Seniors',
    seeAll: t('See All') || 'See All',
    familyDashboard: t('Family Dashboard') || 'Family Dashboard',
    connectSenior: t('connectSenior.connectSenior') || 'Connect Senior',
    checkOnLovedOnes: t('Check on your loved ones') || 'Check on your loved ones'
  };

  // Handle back button press
  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs');
    }
  };

  // Handle navigation to different screens
  const navigateToScreen = <T extends keyof RootStackParamList>(
    screen: T,
    params?: RootStackParamList[T] extends undefined ? undefined : RootStackParamList[T]
  ) => {
    // @ts-ignore - Workaround for navigation type issues
    navigation.navigate(screen, params);
  };

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      onRefresh();
      console.log('Home screen focused');
      return () => {};
    }, [onRefresh])
  );

  const quickActions: QuickAction[] = [
    { id: '1', icon: 'heart-pulse', title: 'Health', screen: 'HealthHistory', color: '#E53E3E', bgColor: '#FED7D7' },
    { id: '2', icon: 'map-marker', title: 'Track', screen: 'TrackSenior', color: '#3182CE', bgColor: '#BEE3F8' },
    { id: '3', icon: 'message-text', title: 'Messages', screen: 'Messages', color: '#38A169', bgColor: '#C6F6D5' },
    { id: '4', icon: 'bell-alert', title: 'Alerts', screen: 'Alerts', color: '#DD6B20', bgColor: '#FEEBCF' },
  ];

  const renderQuickAction = ({ item }: { item: QuickAction }) => (
    <TouchableOpacity
      style={[styles.quickAction, { backgroundColor: isDark ? '#2D3748' : '#FFFFFF' }]}
      onPress={() => navigateToScreen(item.screen as keyof RootStackParamList, { seniorId: '1' })}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.bgColor }]}>
        <MaterialCommunityIcons name={item.icon} size={24} color={item.color} />
      </View>
      <Text style={[styles.quickActionText, { color: isDark ? '#E2E8F0' : '#2D3748' }]}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  const renderSeniorCard = ({ item }: { item: SeniorData }) => (
    <TouchableOpacity
      style={[styles.seniorCard, { backgroundColor: isDark ? '#2D3748' : '#FFFFFF' }]}
      onPress={() => navigateToScreen('SeniorDetail', { 
        seniorId: item.id,
        seniorName: item.name,
        status: item.status
      })}
    >
      <View style={styles.seniorHeader}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: isDark ? '#4A5568' : '#E2E8F0' }]}>
            <Ionicons name="person" size={24} color={isDark ? '#A0AEC0' : '#718096'} />
          </View>
        )}
        <View style={styles.seniorInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.seniorName, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>
              {item.name}
            </Text>
            <View style={[
              styles.statusDot, 
              { 
                backgroundColor: item.status === 'online' ? '#48BB78' : 
                                item.status === 'alert' ? '#E53E3E' : '#A0AEC0' 
              }
            ]} />
          </View>
          <Text style={[styles.seniorId, { color: isDark ? '#A0AEC0' : '#718096' }]}>
            ID: {item.seniorId}
          </Text>
          <Text style={[styles.lastSeen, { color: isDark ? '#A0AEC0' : '#718096' }]}>
            {item.lastActive}
          </Text>
        </View>
      </View>
      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Ionicons name="heart" size={16} color="#E53E3E" />
          <Text style={[styles.metricText, { color: isDark ? '#E2E8F0' : '#2D3748' }]}>
            {item.heartRate} <Text style={styles.metricUnit}>BPM</Text>
          </Text>
        </View>
        <View style={styles.metric}>
          <Ionicons name="water" size={16} color="#3182CE" />
          <Text style={[styles.metricText, { color: isDark ? '#E2E8F0' : '#2D3748' }]}>
            {item.oxygen}% <Text style={styles.metricUnit}>SpO₂</Text>
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people" size={64} color={isDark ? '#4A5568' : '#CBD5E0'} />
      <Text style={[styles.emptyStateText, { color: isDark ? '#A0AEC0' : '#718096' }]}>
        {t('No connected seniors yet')}
      </Text>
      <Text style={[styles.emptyStateSubtext, { color: isDark ? '#718096' : '#A0AEC0' }]}>
        {t('Tap the + button to add a senior')}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#171923' : '#FFFBEF' }]}>
      <View style={styles.contentContainer}>
        {/* Header with back button and title */}
        <View style={[styles.header, { backgroundColor: isDark ? '#1A202C' : '#FFFFFF' }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={isDark ? '#E2E8F0' : '#1A202C'} 
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>
            {translations.familyDashboard}
          </Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons 
              name="settings-outline" 
              size={24} 
              color={isDark ? '#E2E8F0' : '#1A202C'} 
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[isDark ? '#48BB78' : '#2F855A']}
              tintColor={isDark ? '#48BB78' : '#2F855A'}
            />
          }
          style={styles.scrollView}
        >
          {/* Welcome Section */}
          <View style={[styles.welcomeCard, { backgroundColor: isDark ? '#2D3748' : '#FFFFFF' }]}>
            <View>
              <Text style={[styles.welcomeText, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>
                {translations.welcome}
              </Text>
              <Text style={[styles.subtitle, { color: isDark ? '#A0AEC0' : '#4A5568' }]}>
                {translations.checkOnLovedOnes}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.sosButton, { backgroundColor: isDark ? '#E53E3E' : '#F56565' }]}
              onPress={() => console.log('SOS Pressed')}
            >
              <Ionicons name="alert-circle" size={28} color="white" />
              <Text style={styles.sosButtonText}>{translations.sos}</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>
              {translations.quickActions}
            </Text>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action) => (
                <View key={action.id} style={styles.quickActionWrapper}>
                  <TouchableOpacity
                    style={[styles.quickAction, { backgroundColor: isDark ? '#2D3748' : '#FFFFFF' }]}
                    onPress={() => navigateToScreen(action.screen as keyof RootStackParamList, { seniorId: '1' })}
                  >
                    <View style={[styles.iconContainer, { backgroundColor: action.bgColor }]}>
                      <MaterialCommunityIcons name={action.icon} size={24} color={action.color} />
                    </View>
                    <Text style={[styles.quickActionText, { color: isDark ? '#E2E8F0' : '#2D3748' }]}>
                      {action.title}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Connected Seniors */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>
                {translations.connectedSeniors}
              </Text>
              {seniorMembers.length > 0 && (
                <TouchableOpacity onPress={() => navigateToScreen('ConnectSenior')}>
                  <Text style={[styles.seeAll, { color: colors.primary }]}>
                    {translations.seeAll}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            
            {isLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : seniorMembers.length > 0 ? (
              <FlatList
                data={seniorMembers}
                renderItem={renderSeniorCard}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.seniorList}
              />
            ) : (
              renderEmptyState()
            )}
          </View>

          {/* Add Senior Button */}
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => navigateToScreen('ConnectSenior')}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
            <Text style={styles.addButtonText}>{t('Add Senior')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Loading indicator
  loader: {
    padding: 32,
  },
  // Empty state styles
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    width: '100%',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  // Add button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    margin: 16,
    marginBottom: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Status dot
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  // Senior ID text
  seniorId: {
    fontSize: 12,
    marginTop: 2,
    color: '#718096',
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  settingsButton: {
    padding: 8,
    marginRight: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  welcomeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    margin: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  sosButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 6,
  },
  section: {
    marginTop: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionWrapper: {
    width: '48%',
    marginBottom: 16,
  },
  quickAction: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 120,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  seniorListContainer: {
    minHeight: 200, // Ensure there's enough space for the cards
  },
  seniorList: {
    paddingBottom: 4,
    paddingRight: 16,
  },
  addSeniorCard: {
    width: 160,
    height: 200,
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addSeniorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  addSeniorText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  seniorCard: {
    width: 280,
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  seniorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  seniorInfo: {
    flex: 1,
  },
  seniorName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  lastSeen: {
    fontSize: 12,
    opacity: 0.8,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  metricUnit: {
    fontSize: 12,
    fontWeight: '400',
    opacity: 0.7,
  },
});

export default HomeScreenFamily;