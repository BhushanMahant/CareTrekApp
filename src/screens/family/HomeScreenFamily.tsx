import React, { useState, useEffect } from 'react';
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
  Dimensions
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../../contexts/theme/ThemeContext';
import { useTranslation } from '../../contexts/translation/TranslationContext';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCachedTranslation } from '../../hooks/useCachedTranslation';

const { width } = Dimensions.get('window');

type SeniorMember = {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'alert';
  lastActive: string;
  heartRate?: number;
  oxygen?: number;
  battery?: number;
  location?: string;
  avatar?: string;
};

type QuickAction = {
  id: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  screen: string;
  color: string;
  bgColor: string;
};

type RootStackParamList = {
  SeniorDetail: { seniorId: string };
  Messages: { seniorId: string };
  Alerts: { seniorId: string };
  Settings: undefined;
  ConnectSenior: undefined;
  TrackSenior: { seniorId: string };
  HealthHistory: { seniorId: string };
  SOSContacts: undefined;
  [key: string]: undefined | object;
};

type HomeScreenFamilyNavigationProp = StackNavigationProp<RootStackParamList>;

const HomeScreenFamily = () => {
  const navigation = useNavigation<HomeScreenFamilyNavigationProp>();
  const { colors, isDark } = useTheme();
  const { currentLanguage } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Translations
  const { translatedText: welcomeText } = useCachedTranslation('Welcome back', currentLanguage);
  const { translatedText: trackText } = useCachedTranslation('Track Location', currentLanguage);
  const { translatedText: healthText } = useCachedTranslation('Health', currentLanguage);
  const { translatedText: messagesText } = useCachedTranslation('Messages', currentLanguage);
  const { translatedText: alertsText } = useCachedTranslation('Alerts', currentLanguage);
  const { translatedText: sosText } = useCachedTranslation('SOS', currentLanguage);
  const { translatedText: quickActionsText } = useCachedTranslation('Quick Actions', currentLanguage);
  const { translatedText: connectedSeniorsText } = useCachedTranslation('Connected Seniors', currentLanguage);
  const { translatedText: seeAllText } = useCachedTranslation('See All', currentLanguage);
  const { translatedText: familyDashboardText } = useCachedTranslation('Family Dashboard', currentLanguage);

  const handleBack = () => {
    navigation.goBack();
  };

  // Quick Actions with updated colors to match theme
  const quickActions: QuickAction[] = [
    {
      id: '1',
      icon: 'map-marker-radius',
      title: trackText,
      screen: 'TrackSenior',
      color: isDark ? '#63B3ED' : '#2B6CB0',
      bgColor: isDark ? '#2C5282' : '#BEE3F8',
    },
    {
      id: '2',
      icon: 'heart-pulse',
      title: healthText,
      screen: 'HealthHistory',
      color: isDark ? '#68D391' : '#2F855A',
      bgColor: isDark ? '#22543D' : '#C6F6D5',
    },
    {
      id: '3',
      icon: 'message-text',
      title: messagesText,
      screen: 'Messages',
      color: isDark ? '#B794F4' : '#6B46C1',
      bgColor: isDark ? '#44337A' : '#E9D8FD',
    },
    {
      id: '4',
      icon: 'bell-alert',
      title: alertsText,
      screen: 'Alerts',
      color: isDark ? '#FC8181' : '#C53030',
      bgColor: isDark ? '#742A2A' : '#FED7D7',
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
      avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    },
    {
      id: '2',
      name: 'Meena Sharma',
      status: 'alert',
      lastActive: '15 min ago',
      heartRate: 92,
      oxygen: 94,
      battery: 42,
      location: 'Park',
      avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
    },
  ];

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate data refresh
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const renderQuickAction = ({ item }: { item: QuickAction }) => (
    <TouchableOpacity
      style={[styles.quickAction, { backgroundColor: isDark ? '#2D3748' : '#FFFFFF' }]}
      onPress={() => navigation.navigate(item.screen as any, { seniorId: '1' })}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.bgColor }]}>
        <MaterialCommunityIcons 
          name={item.icon} 
          size={24} 
          color={item.color} 
        />
      </View>
      <Text style={[styles.quickActionText, { color: isDark ? '#E2E8F0' : '#2D3748' }]}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  const renderSeniorCard = ({ item }: { item: SeniorMember }) => (
    <TouchableOpacity
      style={[styles.seniorCard, { backgroundColor: isDark ? '#2D3748' : '#FFFFFF' }]}
      onPress={() => navigation.navigate('SeniorDetail', { seniorId: item.id })}
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
          <View style={styles.seniorHeaderText}>
            <Text style={[styles.seniorName, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>
              {item.name}
            </Text>
            <View style={[styles.statusBadge, { 
              backgroundColor: item.status === 'online' 
                ? (isDark ? '#2F855A' : '#C6F6D5') 
                : item.status === 'alert'
                  ? (isDark ? '#C53030' : '#FED7D7')
                  : (isDark ? '#4A5568' : '#E2E8F0')
            }]}>
              <View style={[styles.statusDot, { 
                backgroundColor: item.status === 'online' 
                  ? '#38A169' 
                  : item.status === 'alert' 
                    ? '#E53E3E' 
                    : '#A0AEC0' 
              }]} />
              <Text style={[styles.statusText, { 
                color: item.status === 'online' 
                  ? (isDark ? '#9AE6B4' : '#2F855A')
                  : item.status === 'alert'
                    ? (isDark ? '#FEB2B2' : '#C53030')
                    : (isDark ? '#A0AEC0' : '#4A5568')
              }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </View>
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
        <View style={styles.metric}>
          <Ionicons 
            name="battery-charging" 
            size={16} 
            color={item.battery && item.battery < 20 ? '#E53E3E' : '#38A169'} 
          />
          <Text style={[
            styles.metricText, 
            { 
              color: item.battery && item.battery < 20 
                ? '#E53E3E' 
                : (isDark ? '#E2E8F0' : '#2D3748')
            }
          ]}>
            {item.battery}%
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#171923' : '#FFFBEF' }]}>
        <ActivityIndicator size="large" color={isDark ? '#48BB78' : '#2F855A'} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#171923' : '#FFFBEF' }]}>
      {/* Header with Back Button */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1A202C' : '#FFFFFF' }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={handleBack}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={isDark ? '#E2E8F0' : '#2D3748'} 
            />
            <Text style={[styles.backButtonText, { color: isDark ? '#E2E8F0' : '#2D3748' }]}>
              Back
            </Text>
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>
            {familyDashboardText || 'Family Dashboard'}
          </Text>
          
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={styles.settingsButton}
          >
            <Ionicons 
              name="settings-outline" 
              size={24} 
              color={isDark ? '#A0AEC0' : '#4A5568'} 
            />
          </TouchableOpacity>
        </View>
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
              {welcomeText || 'Welcome back!'}
            </Text>
            <Text style={[styles.subtitle, { color: isDark ? '#A0AEC0' : '#4A5568' }]}>
              Check on your loved ones
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.sosButton, { backgroundColor: isDark ? '#E53E3E' : '#F56565' }]}
            onPress={() => navigation.navigate('SOSContacts')}
          >
            <Ionicons name="alert-circle" size={28} color="white" />
            <Text style={styles.sosButtonText}>{sosText || 'SOS'}</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>
            {quickActionsText || 'Quick Actions'}
          </Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <View key={action.id} style={styles.quickActionWrapper}>
                {renderQuickAction({ item: action })}
              </View>
            ))}
          </View>
        </View>

        {/* Connected Seniors */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>
              {connectedSeniorsText || 'Connected Seniors'}
            </Text>
            <TouchableOpacity>
              <Text style={[styles.seeAll, { color: isDark ? '#48BB78' : '#2F855A' }]}>
                {seeAllText || 'See All'}
              </Text>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    zIndex: 1,
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 40, // Add space for back button and settings
  },
  settingsButton: {
    padding: 8,
    marginLeft: 'auto',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sosButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  seniorList: {
    paddingBottom: 4,
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
  seniorHeaderText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  seniorName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
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
