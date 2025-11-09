import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Image,
  Linking,
  Alert,
  Share,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/theme/ThemeContext';
import { useTranslation } from '../../contexts/translation/TranslationContext';
import { useCachedTranslation } from '../../hooks/useCachedTranslation';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  SeniorDetail: { seniorId: string };
  TrackSenior: { seniorId: string };
  HealthHistory: { seniorId: string };
  Messages: { seniorId: string };
};

type SeniorDetailRouteProp = RouteProp<RootStackParamList, 'SeniorDetail'>;

type HealthMetric = {
  id: string;
  type: 'heart' | 'oxygen' | 'steps' | 'sleep' | 'medication' | 'activity' | 'battery';
  value: string;
  label: string;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  status?: 'normal' | 'warning' | 'critical';
};

type Activity = {
  id: string;
  type: 'walk' | 'medication' | 'alert' | 'location';
  title: string;
  time: string;
  details?: string;
  icon: string;
};

const SeniorDetailScreen = () => {
  const route = useRoute<SeniorDetailRouteProp>();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { isDark } = useTheme();
  const { currentLanguage } = useTranslation();
  const [senior, setSenior] = useState<{
    id: string;
    name: string;
    status: 'online' | 'offline' | 'alert';
    lastActive: string;
    avatar: string;
    heartRate: number;
    oxygen: number;
    steps: number;
    battery: number;
    location: string;
  } | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity'>('overview');

  // Translations
  const { translatedText: backText } = useCachedTranslation('Back', currentLanguage);
  const { translatedText: overviewText } = useCachedTranslation('Overview', currentLanguage);
  const { translatedText: activityText } = useCachedTranslation('Activity', currentLanguage);
  const { translatedText: callText } = useCachedTranslation('Call', currentLanguage);
  const { translatedText: messageText } = useCachedTranslation('Message', currentLanguage);
  const { translatedText: locationText } = useCachedTranslation('Location', currentLanguage);
  const { translatedText: healthMetricsText } = useCachedTranslation('Health Metrics', currentLanguage);
  const { translatedText: recentActivityText } = useCachedTranslation('Recent Activity', currentLanguage);
  const { translatedText: viewAllText } = useCachedTranslation('View All', currentLanguage);
  const { translatedText: noActivityText } = useCachedTranslation('No recent activity', currentLanguage);
  const { translatedText: bpmText } = useCachedTranslation('BPM', currentLanguage);
  const { translatedText: spo2Text } = useCachedTranslation('SpO₂', currentLanguage);
  const { translatedText: stepsText } = useCachedTranslation('Steps', currentLanguage);
  const { translatedText: batteryText } = useCachedTranslation('Battery', currentLanguage);
  const { translatedText: lastUpdatedText } = useCachedTranslation('Last updated', currentLanguage);
  const { translatedText: shareText } = useCachedTranslation('Share', currentLanguage);
  const { translatedText: viewOnMapText } = useCachedTranslation('View on Map', currentLanguage);
  const { translatedText: viewHealthHistoryText } = useCachedTranslation('View Health History', currentLanguage);
  const { translatedText: viewAllActivityText } = useCachedTranslation('View All Activity', currentLanguage);
  const { translatedText: callConfirmationText } = useCachedTranslation('Call {name}?', currentLanguage);
  const { translatedText: cancelText } = useCachedTranslation('Cancel', currentLanguage);
  const { translatedText: yesText } = useCachedTranslation('Yes', currentLanguage);
  const { translatedText: errorLoadingText } = useCachedTranslation('Error loading senior details', currentLanguage);
  const { translatedText: retryText } = useCachedTranslation('Retry', currentLanguage);

  // Mock data - replace with actual API call
  useEffect(() => {
    const fetchSeniorDetails = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const status: 'online' | 'offline' | 'alert' = route.params.seniorId === '1' ? 'online' : 'alert';
        
        const mockData = {
          id: route.params.seniorId,
          name: route.params.seniorId === '1' ? 'Ramesh Patel' : 'Sunita Sharma',
          status: status,
          lastActive: route.params.seniorId === '1' ? '2 min ago' : '5 min ago',
          avatar: route.params.seniorId === '1' 
            ? 'https://randomuser.me/api/portraits/men/1.jpg' 
            : 'https://randomuser.me/api/portraits/women/1.jpg',
          heartRate: route.params.seniorId === '1' ? 72 : 92,
          oxygen: route.params.seniorId === '1' ? 98 : 94,
          steps: route.params.seniorId === '1' ? 3421 : 1245,
          battery: 78,
          location: '123 Main St, Anytown, USA',
        };
        
        setSenior(mockData);
      } catch (error) {
        console.error('Error fetching senior details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSeniorDetails();
  }, [route.params.seniorId]);

  const healthMetrics: HealthMetric[] = [
    { id: '1', type: 'heart', value: senior?.heartRate.toString() || '--', label: bpmText, unit: 'BPM', trend: 'down', status: senior?.heartRate && senior.heartRate > 90 ? 'warning' : 'normal' },
    { id: '2', type: 'oxygen', value: senior?.oxygen.toString() || '--', label: spo2Text, unit: '%', trend: 'up', status: senior?.oxygen && senior.oxygen < 95 ? 'warning' : 'normal' },
    { id: '3', type: 'steps', value: senior?.steps.toLocaleString() || '0', label: stepsText, trend: 'up' },
    { id: '4', type: 'battery', value: senior?.battery.toString() || '--', label: batteryText, unit: '%', status: senior?.battery && senior.battery < 20 ? 'warning' : 'normal' },
  ];

  const recentActivity: Activity[] = [
    { id: '1', type: 'walk', title: 'Morning Walk', time: '2 hours ago', details: '1.2 km • 15 min', icon: 'walk' },
    { id: '2', type: 'medication', title: 'Medication Taken', time: '4 hours ago', details: 'Lisinopril 10mg', icon: 'medical-bag' },
    { id: '3', type: 'alert', title: 'High Heart Rate', time: '6 hours ago', details: '102 BPM', icon: 'heart-pulse' },
    { id: '4', type: 'location', title: 'Location Updated', time: '8 hours ago', details: '123 Main St', icon: 'map-marker' },
  ];

  const handleCall = () => {
    if (!senior) return;
    
    Alert.alert(
      callConfirmationText.replace('{name}', senior.name),
      '',
      [
        { text: cancelText, style: 'cancel' },
        { 
          text: yesText, 
          onPress: () => {
            // In a real app, this would initiate a call
            console.log('Calling', senior.name);
            // Linking.openURL(`tel:${senior.phoneNumber}`);
          } 
        },
      ]
    );
  };

  const handleMessage = () => {
    if (!senior) return;
    navigation.navigate('Messages', { seniorId: senior.id });
  };

  const handleLocation = () => {
    if (!senior) return;
    navigation.navigate('TrackSenior', { seniorId: senior.id });
  };

  const handleShare = async () => {
    if (!senior) return;
    
    try {
      await Share.share({
        message: `${senior.name}'s current status: ${senior.status === 'online' ? 'Online' : 'Needs Attention'}. Location: ${senior.location}`,
        title: `${senior.name}'s Status`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const renderHealthMetric = (metric: HealthMetric) => {
    const getIcon = () => {
      switch (metric.type) {
        case 'heart':
          return 'heart';
        case 'oxygen':
          return 'pulse';
        case 'steps':
          return 'walk';
        case 'battery':
          return 'battery-medium';
        default:
          return 'help-circle';
      }
    };

    const getIconColor = () => {
      if (metric.status === 'warning') return '#ED8936';
      if (metric.status === 'critical') return '#E53E3E';
      return isDark ? '#48BB78' : '#2F855A';
    };

    return (
      <View 
        key={metric.id}
        style={[styles.metricCard, { backgroundColor: isDark ? '#2D3748' : '#FFFFFF' }]}
      >
        <View style={styles.metricIconContainer}>
          <Ionicons 
            name={getIcon() as any} 
            size={20} 
            color={getIconColor()} 
          />
        </View>
        <View style={styles.metricContent}>
          <Text style={[styles.metricValue, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>
            {metric.value}{metric.unit ? ` ${metric.unit}` : ''}
          </Text>
          <Text style={[styles.metricLabel, { color: isDark ? '#A0AEC0' : '#718096' }]}>
            {metric.label}
          </Text>
        </View>
        {metric.trend && (
          <Ionicons 
            name={metric.trend === 'up' ? 'trending-up' : 'trending-down'} 
            size={20} 
            color={metric.trend === 'up' ? '#48BB78' : '#E53E3E'} 
          />
        )}
      </View>
    );
  };

  const renderActivityItem = (activity: Activity) => {
    const getIcon = () => {
      switch (activity.type) {
        case 'walk':
          return 'walk';
        case 'medication':
          return 'medical-bag';
        case 'alert':
          return 'alert-circle';
        case 'location':
          return 'map-marker';
        default:
          return 'information-circle';
      }
    };

    const getIconColor = () => {
      switch (activity.type) {
        case 'alert':
          return '#E53E3E';
        case 'medication':
          return '#4299E1';
        case 'walk':
          return '#48BB78';
        case 'location':
          return '#9F7AEA';
        default:
          return isDark ? '#A0AEC0' : '#718096';
      }
    };

    return (
      <View 
        key={activity.id}
        style={[styles.activityItem, { backgroundColor: isDark ? '#2D3748' : '#FFFFFF' }]}
      >
        <View 
          style={[
            styles.activityIconContainer, 
            { backgroundColor: `${getIconColor()}20` }
          ]}
        >
          <MaterialCommunityIcons 
            name={activity.icon as any} 
            size={20} 
            color={getIconColor()} 
          />
        </View>
        <View style={styles.activityItemContent}>
          <Text style={[styles.activityTitle, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>
            {activity.title}
          </Text>
          {activity.details && (
            <Text style={[styles.activityDetails, { color: isDark ? '#A0AEC0' : '#718096' }]}>
              {activity.details}
            </Text>
          )}
        </View>
        <Text style={[styles.activityTime, { color: isDark ? '#A0AEC0' : '#A0AEC0' }]}>
          {activity.time}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#171923' : '#FFFBEF' }]}>
        <ActivityIndicator size="large" color={isDark ? '#48BB78' : '#2F855A'} />
      </View>
    );
  }

  if (!senior) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: isDark ? '#171923' : '#FFFBEF' }]}>
        <Ionicons name="warning" size={48} color={isDark ? '#E53E3E' : '#C53030'} />
        <Text style={[styles.errorText, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>
          {errorLoadingText}
        </Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: isDark ? '#2D3748' : '#E2E8F0' }]}
          onPress={() => setLoading(true)}
        >
          <Text style={[styles.retryButtonText, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>
            {retryText}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#171923' : '#FFFBEF' }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? '#2D3748' : '#E2E8F0' }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={isDark ? '#E2E8F0' : '#1A202C'} 
          />
          <Text style={[styles.backButtonText, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>
            {backText}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleShare}>
          <Ionicons 
            name="share-social" 
            size={24} 
            color={isDark ? '#E2E8F0' : '#1A202C'} 
          />
        </TouchableOpacity>
      </View>

      {/* Profile Section */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {senior.avatar ? (
              <Image 
                source={{ uri: senior.avatar }} 
                style={styles.avatar} 
              />
            ) : (
              <View style={[styles.avatar, { backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="person" size={50} color="#718096" />
              </View>
            )}
            <View 
              style={[
                styles.statusBadge,
                { 
                  backgroundColor: senior.status === 'online' 
                    ? '#48BB78' 
                    : senior.status === 'alert' 
                      ? '#E53E3E' 
                      : '#A0AEC0',
                }
              ]} 
            />
          </View>
          
          <Text style={[styles.seniorName, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>
            {senior.name}
          </Text>
          
          <Text style={[styles.lastActive, { color: isDark ? '#A0AEC0' : '#718096' }]}>
            {`${lastUpdatedText} ${senior.lastActive}`}
          </Text>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: isDark ? '#2D3748' : '#E2E8F0' }]}
              onPress={handleCall}
            >
              <Ionicons 
                name="call" 
                size={20} 
                color={isDark ? '#48BB78' : '#2F855A'} 
              />
              <Text style={[styles.actionButtonText, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>
                {callText}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: isDark ? '#2D3748' : '#E2E8F0' }]}
              onPress={handleMessage}
            >
              <Ionicons 
                name="chatbubble-ellipses" 
                size={20} 
                color={isDark ? '#4299E1' : '#2B6CB0'} 
              />
              <Text style={[styles.actionButtonText, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>
                {messageText}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: isDark ? '#2D3748' : '#E2E8F0' }]}
              onPress={handleLocation}
            >
              <Ionicons 
                name="location" 
                size={20} 
                color={isDark ? '#9F7AEA' : '#6B46C1'} 
              />
              <Text style={[styles.actionButtonText, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>
                {locationText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabsContainer, { backgroundColor: isDark ? '#2D3748' : '#E2E8F0' }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'overview' && [
                styles.activeTab,
                { backgroundColor: isDark ? '#48BB78' : '#2F855A' }
              ]
            ]}
            onPress={() => setActiveTab('overview')}
          >
            <Text 
              style={[
                styles.tabText,
                { 
                  color: activeTab === 'overview' 
                    ? '#FFFFFF' 
                    : isDark ? '#A0AEC0' : '#4A5568' 
                }
              ]}
            >
              {overviewText}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'activity' && [
                styles.activeTab,
                { backgroundColor: isDark ? '#48BB78' : '#2F855A' }
              ]
            ]}
            onPress={() => setActiveTab('activity')}
          >
            <Text 
              style={[
                styles.tabText,
                { 
                  color: activeTab === 'activity' 
                    ? '#FFFFFF' 
                    : isDark ? '#A0AEC0' : '#4A5568' 
                }
              ]}
            >
              {activityText}
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'overview' ? (
          <View style={styles.overviewContent}>
            {/* Location Card */}
            <View style={[styles.locationCard, { backgroundColor: isDark ? '#2D3748' : '#FFFFFF' }]}>
              <View style={styles.locationHeader}>
                <Ionicons 
                  name="location" 
                  size={20} 
                  color={isDark ? '#9F7AEA' : '#6B46C1'} 
                />
                <Text style={[styles.locationTitle, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>
                  {locationText}
                </Text>
              </View>
              
              <Text style={[styles.locationAddress, { color: isDark ? '#A0AEC0' : '#4A5568' }]}>
                {senior.location}
              </Text>
              
              <TouchableOpacity 
                style={[styles.viewMapButton, { backgroundColor: isDark ? '#2D3748' : '#E2E8F0' }]}
                onPress={handleLocation}
              >
                <Text style={[styles.viewMapButtonText, { color: isDark ? '#9F7AEA' : '#6B46C1' }]}>
                  {viewOnMapText}
                </Text>
                <Ionicons 
                  name="arrow-forward" 
                  size={16} 
                  color={isDark ? '#9F7AEA' : '#6B46C1'} 
                />
              </TouchableOpacity>
            </View>

            {/* Health Metrics */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>
                {healthMetricsText}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('HealthHistory', { seniorId: senior.id })}>
                <Text style={[styles.viewAllText, { color: isDark ? '#48BB78' : '#2F855A' }]}>
                  {viewHealthHistoryText}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.metricsGrid}>
              {healthMetrics.map(metric => renderHealthMetric(metric))}
            </View>
          </View>
        ) : (
          <View style={styles.activityItemContent}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>
                {recentActivityText}
              </Text>
              <TouchableOpacity>
                <Text style={[styles.viewAllText, { color: isDark ? '#48BB78' : '#2F855A' }]}>
                  {viewAllActivityText}
                </Text>
              </TouchableOpacity>
            </View>
            
            {recentActivity.length > 0 ? (
              <View style={styles.activityList}>
                {recentActivity.map(activity => renderActivityItem(activity))}
              </View>
            ) : (
              <View style={styles.emptyActivity}>
                <Ionicons 
                  name="time" 
                  size={48} 
                  color={isDark ? '#4A5568' : '#A0AEC0'} 
                />
                <Text style={[styles.emptyText, { color: isDark ? '#A0AEC0' : '#718096' }]}>
                  {noActivityText}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBEF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
    color: '#1A202C',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    marginLeft: 8,
    color: '#1A202C',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    padding: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E2E8F0',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  seniorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 4,
  },
  lastActive: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#1A202C',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    padding: 4,
    backgroundColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#2F855A',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
  },
  overviewContent: {
    padding: 16,
  },
  locationCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#1A202C',
  },
  locationAddress: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 12,
  },
  viewMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  viewMapButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B46C1',
    marginRight: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A202C',
  },
  viewAllText: {
    fontSize: 14,
    color: '#2F855A',
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  metricCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    margin: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  metricIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(72, 187, 120, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  metricContent: {
    flex: 1,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 12,
    color: '#718096',
  },
  activityList: {
    marginTop: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityItemContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A202C',
    marginBottom: 2,
  },
  activityDetails: {
    fontSize: 12,
    color: '#718096',
  },
  activityTime: {
    fontSize: 12,
    color: '#A0AEC0',
    marginLeft: 8,
  },
  emptyActivity: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#718096',
    marginTop: 12,
    textAlign: 'center',
  },
});

export default SeniorDetailScreen;
