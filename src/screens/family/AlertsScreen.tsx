import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView, 
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/theme/ThemeContext';
import { useTranslation } from '../../contexts/translation/TranslationContext';
import { useCachedTranslation } from '../../hooks/useCachedTranslation';

type RootStackParamList = {
  SeniorDetail: { seniorId: string };
  AlertDetail: { alertId: string };
};

type AlertType = 'medication' | 'fall' | 'heart' | 'location' | 'battery' | 'general';

interface AlertItem {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  seniorId: string;
  seniorName: string;
  seniorAvatar: string;
  timestamp: Date;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
}

const AlertsScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { isDark } = useTheme();
  const { currentLanguage } = useTranslation();
  
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = 'all'; // 'all', 'unread', 'high', 'medication', 'fall', 'heart', 'location', 'battery'

  // Translations
  const { translatedText: alertsText } = useCachedTranslation('Alerts', currentLanguage);
  const { translatedText: markAllAsReadText } = useCachedTranslation('Mark all as read', currentLanguage);
  const { translatedText: noAlertsText } = useCachedTranslation('No alerts to display', currentLanguage);
  const { translatedText: allText } = useCachedTranslation('All', currentLanguage);
  const { translatedText: unreadText } = useCachedTranslation('Unread', currentLanguage);
  const { translatedText: highPriorityText } = useCachedTranslation('High Priority', currentLanguage);
  const { translatedText: medicationText } = useCachedTranslation('Medication', currentLanguage);
  const { translatedText: fallDetectionText } = useCachedTranslation('Fall Detection', currentLanguage);
  const { translatedText: heartRateText } = useCachedTranslation('Heart Rate', currentLanguage);
  const { translatedText: locationText } = useCachedTranslation('Location', currentLanguage);
  const { translatedText: batteryText } = useCachedTranslation('Battery', currentLanguage);
  const { translatedText: minutesAgoText } = useCachedTranslation('{minutes} min ago', currentLanguage);
  const { translatedText: hoursAgoText } = useCachedTranslation('{hours} hr ago', currentLanguage);
  const { translatedText: daysAgoText } = useCachedTranslation('{days} d ago', currentLanguage);
  const { translatedText: markAsReadText } = useCachedTranslation('Mark as read', currentLanguage);
  const { translatedText: viewDetailsText } = useCachedTranslation('View details', currentLanguage);
  const { translatedText: errorLoadingAlertsText } = useCachedTranslation('Error loading alerts', currentLanguage);
  const { translatedText: retryText } = useCachedTranslation('Retry', currentLanguage);

  // Mock data - replace with actual API calls
  const fetchAlerts = async () => {
    setRefreshing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockAlerts: AlertItem[] = [
        {
          id: '1',
          type: 'fall',
          title: 'Fall Detected',
          message: 'A potential fall was detected. Please check on John immediately.',
          seniorId: '1',
          seniorName: 'John Doe',
          seniorAvatar: 'https://randomuser.me/api/portraits/men/1.jpg',
          timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
          read: false,
          priority: 'high'
        },
        {
          id: '2',
          type: 'medication',
          title: 'Medication Missed',
          message: 'John has not taken his 2:00 PM medication (Lisinopril 10mg).',
          seniorId: '1',
          seniorName: 'John Doe',
          seniorAvatar: 'https://randomuser.me/api/portraits/men/1.jpg',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          read: false,
          priority: 'medium'
        },
        {
          id: '3',
          type: 'heart',
          title: 'High Heart Rate',
          message: 'John\'s heart rate is elevated (112 BPM).',
          seniorId: '1',
          seniorName: 'John Doe',
          seniorAvatar: 'https://randomuser.me/api/portraits/men/1.jpg',
          timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
          read: true,
          priority: 'high'
        },
        {
          id: '4',
          type: 'location',
          title: 'Unusual Location',
          message: 'John has left his usual area and is now at Central Park.',
          seniorId: '1',
          seniorName: 'John Doe',
          seniorAvatar: 'https://randomuser.me/api/portraits/men/1.jpg',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
          read: true,
          priority: 'medium'
        },
        {
          id: '5',
          type: 'battery',
          title: 'Low Battery',
          message: 'John\'s device battery is low (15%). Please remind him to charge it.',
          seniorId: '1',
          seniorName: 'John Doe',
          seniorAvatar: 'https://randomuser.me/api/portraits/men/1.jpg',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
          read: true,
          priority: 'low'
        },
        {
          id: '6',
          type: 'general',
          title: 'Weekly Report',
          message: 'Weekly health report for John is now available.',
          seniorId: '1',
          seniorName: 'John Doe',
          seniorAvatar: 'https://randomuser.me/api/portraits/men/1.jpg',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
          read: true,
          priority: 'low'
        },
      ];
      
      setAlerts(mockAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const markAsRead = (alertId: string) => {
    setAlerts(prevAlerts => 
      prevAlerts.map(alert => 
        alert.id === alertId ? { ...alert, read: true } : alert
      )
    );
  };

  const markAllAsRead = () => {
    setAlerts(prevAlerts => 
      prevAlerts.map(alert => ({ ...alert, read: true }))
    );
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInMins < 60) {
      return minutesAgoText.replace('{minutes}', diffInMins.toString());
    } else if (diffInHours < 24) {
      return hoursAgoText.replace('{hours}', diffInHours.toString());
    } else {
      return daysAgoText.replace('{days}', diffInDays.toString());
    }
  };

  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case 'fall':
        return 'alert-circle';
      case 'medication':
        'medical-bag';
      case 'heart':
        return 'heart-pulse';
      case 'location':
        return 'map-marker';
      case 'battery':
        return 'battery-alert';
      case 'general':
      default:
        return 'information';
    }
  };

  const getAlertColor = (type: AlertType) => {
    switch (type) {
      case 'fall':
        return '#E53E3E';
      case 'medication':
        return '#4299E1';
      case 'heart':
        return '#F56565';
      case 'location':
        return '#9F7AEA';
      case 'battery':
        return '#ED8936';
      case 'general':
      default:
        return '#718096';
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return '#E53E3E';
      case 'medium':
        return '#ED8936';
      case 'low':
      default:
        return '#718096';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !alert.read;
    if (filter === 'high') return alert.priority === 'high';
    return alert.type === filter;
  });

  const renderAlertItem = ({ item }: { item: AlertItem }) => (
    <TouchableOpacity 
      style={[
        styles.alertItem, 
        { 
          backgroundColor: isDark ? '#2D3748' : '#FFFFFF',
          borderLeftColor: getAlertColor(item.type),
          opacity: item.read ? 0.8 : 1,
        }
      ]}
      onPress={() => {
        if (!item.read) markAsRead(item.id);
        navigation.navigate('AlertDetail', { alertId: item.id });
      }}
      activeOpacity={0.8}
    >
      <View style={styles.alertHeader}>
        <View style={styles.alertTitleContainer}>
          <MaterialCommunityIcons 
            name={getAlertIcon(item.type) as any}
            size={20} 
            color={getAlertColor(item.type)} 
            style={styles.alertIcon}
          />
          <Text 
            style={[
              styles.alertTitle, 
              { color: isDark ? '#E2E8F0' : '#1A202C' },
              !item.read && { fontWeight: '600' }
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
        </View>
        
        <View style={styles.alertMeta}>
          <View 
            style={[
              styles.priorityBadge, 
              { backgroundColor: `${getPriorityColor(item.priority)}20` }
            ]}
          >
            <View 
              style={[
                styles.priorityDot, 
                { backgroundColor: getPriorityColor(item.priority) }
              ]} 
            />
            <Text 
              style={[
                styles.priorityText, 
                { color: getPriorityColor(item.priority) }
              ]}
            >
              {item.priority === 'high' 
                ? highPriorityText 
                : item.priority === 'medium' 
                  ? 'Medium' 
                  : 'Low'}
            </Text>
          </View>
          
          <Text 
            style={[
              styles.alertTime, 
              { color: isDark ? '#A0AEC0' : '#718096' }
            ]}
          >
            {getTimeAgo(item.timestamp)}
          </Text>
        </View>
      </View>
      
      <Text 
        style={[
          styles.alertMessage, 
          { color: isDark ? '#A0AEC0' : '#4A5568' }
        ]}
        numberOfLines={2}
      >
        {item.message}
      </Text>
      
      <View style={styles.alertFooter}>
        <View style={styles.seniorInfo}>
          {item.seniorAvatar ? (
            <Image 
              source={{ uri: item.seniorAvatar }} 
              style={styles.seniorAvatar} 
            />
          ) : (
            <View style={[styles.seniorAvatar, { backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="person" size={24} color="#718096" />
            </View>
          )}
          <Text 
            style={[
              styles.seniorName, 
              { color: isDark ? '#E2E8F0' : '#1A202C' }
            ]}
          >
            {item.seniorName}
          </Text>
        </View>
        
        <View style={styles.alertActions}>
          {!item.read && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                markAsRead(item.id);
              }}
            >
              <Text style={[styles.actionButtonText, { color: isDark ? '#48BB78' : '#2F855A' }]}>
                {markAsReadText}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.actionButton, styles.viewDetailsButton]}
            onPress={(e) => {
              e.stopPropagation();
              navigation.navigate('AlertDetail', { alertId: item.id });
            }}
          >
            <Text style={[styles.actionButtonText, { color: isDark ? '#4299E1' : '#2B6CB0' }]}>
              {viewDetailsText}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {!item.read && <View style={styles.unreadBadge} />}
    </TouchableOpacity>
  );

  const renderFilterButton = (filterType: string, label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterType && [
          styles.activeFilterButton,
          { 
            backgroundColor: isDark ? '#48BB78' : '#2F855A',
            borderColor: isDark ? '#48BB78' : '#2F855A',
          }
        ],
        { 
          borderColor: isDark ? '#4A5568' : '#CBD5E0',
        }
      ]}
      onPress={() => setFilter(filterType)}
    >
      <Text 
        style={[
          styles.filterButtonText,
          { 
            color: filter === filterType 
              ? '#FFFFFF' 
              : isDark ? '#A0AEC0' : '#4A5568' 
          }
        ]}
      >
        {label}
      </Text>
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
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? '#2D3748' : '#E2E8F0' }]}>
        <Text style={[styles.headerTitle, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>
          {alertsText}
        </Text>
        
        <TouchableOpacity 
          style={styles.markAllButton}
          onPress={markAllAsRead}
          disabled={alerts.every(alert => alert.read)}
        >
          <Text 
            style={[
              styles.markAllButtonText,
              { 
                color: alerts.every(alert => alert.read) 
                  ? (isDark ? '#4A5568' : '#A0AEC0') 
                  : (isDark ? '#48BB78' : '#2F855A')
              }
            ]}
          >
            {markAllAsReadText}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <FlatList
          data={[
            { id: 'all', label: allText },
            { id: 'unread', label: unreadText },
            { id: 'high', label: highPriorityText },
            { id: 'medication', label: medicationText },
            { id: 'fall', label: fallDetectionText },
            { id: 'heart', label: heartRateText },
            { id: 'location', label: locationText },
            { id: 'battery', label: batteryText },
          ]}
          renderItem={({ item }) => renderFilterButton(item.id, item.label)}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
        />
      </View>
      
      {/* Alerts List */}
      {filteredAlerts.length > 0 ? (
        <FlatList
          data={filteredAlerts}
          renderItem={renderAlertItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.alertsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchAlerts}
              colors={[isDark ? '#48BB78' : '#2F855A']}
              tintColor={isDark ? '#48BB78' : '#2F855A'}
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons 
            name="notifications-off" 
            size={64} 
            color={isDark ? '#4A5568' : '#A0AEC0'} 
          />
          <Text style={[styles.emptyText, { color: isDark ? '#A0AEC0' : '#718096' }]}>
            {noAlertsText}
          </Text>
        </View>
      )}
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
    backgroundColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A202C',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  markAllButton: {
    padding: 4,
  },
  markAllButtonText: {
    fontSize: 14,
    color: '#2F855A',
    fontWeight: '500',
  },
  filterContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterList: {
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    height: 32,
    justifyContent: 'center',
  },
  activeFilterButton: {
    backgroundColor: '#2F855A',
    borderColor: '#2F855A',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#4A5568',
  },
  alertsList: {
    padding: 16,
  },
  alertItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  unreadBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    backgroundColor: '#E53E3E',
    borderBottomLeftRadius: 8,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  alertTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  alertIcon: {
    marginRight: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A202C',
    flexShrink: 1,
  },
  alertMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  alertTime: {
    fontSize: 12,
    color: '#718096',
  },
  alertMessage: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
    marginBottom: 12,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  seniorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seniorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  seniorName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1A202C',
  },
  alertActions: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  viewDetailsButton: {
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
    color: '#718096',
  },
});

export default AlertsScreen;
