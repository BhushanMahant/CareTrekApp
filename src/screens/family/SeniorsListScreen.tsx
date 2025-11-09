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
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/theme/ThemeContext';
import { useTranslation } from '../../contexts/translation/TranslationContext';
import { useCachedTranslation } from '../../hooks/useCachedTranslation';

type RootStackParamList = {
  SeniorDetail: { seniorId: string };
  ConnectSenior: undefined;
};

type Senior = {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'alert';
  lastActive: string;
  avatar: string;
  heartRate?: number;
  oxygen?: number;
  steps?: number;
};

const SeniorsListScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { isDark } = useTheme();
  const { currentLanguage } = useTranslation();
  const [seniors, setSeniors] = useState<Senior[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Translations
  const { translatedText: mySeniorsText } = useCachedTranslation('My Seniors', currentLanguage);
  const { translatedText: addSeniorText } = useCachedTranslation('Add Senior', currentLanguage);
  const { translatedText: onlineText } = useCachedTranslation('Online', currentLanguage);
  const { translatedText: offlineText } = useCachedTranslation('Offline', currentLanguage);
  const { translatedText: alertText } = useCachedTranslation('Needs Attention', currentLanguage);
  const { translatedText: lastSeenText } = useCachedTranslation('Last seen', currentLanguage);
  const { translatedText: noSeniorsText } = useCachedTranslation('No seniors connected yet', currentLanguage);
  const { translatedText: connectNowText } = useCachedTranslation('Connect now', currentLanguage);

  // Mock data - replace with actual API call
  const fetchSeniors = async () => {
    setRefreshing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockData: Senior[] = [
        {
          id: '1',
          name: 'Bhushan Mahant',
          status: 'online',
          lastActive: '2 min ago',
          avatar: 'https://randomuser.me/api/portraits/men/42.jpg',
          heartRate: 75,
          oxygen: 97,
          steps: 4280
        },
        {
          id: '2',
          name: 'Aditi Lanjewar',
          status: 'alert',
          lastActive: '5 min ago',
          avatar: 'https://randomuser.me/api/portraits/women/42.jpg',
          heartRate: 88,
          oxygen: 95,
          steps: 3560
        },
      ];
      setSeniors(mockData);
    } catch (error) {
      console.error('Error fetching seniors:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSeniors();
  }, []);

  const renderStatusBadge = (status: Senior['status']) => {
    const statusConfig = {
      online: { color: '#48BB78', text: onlineText },
      offline: { color: '#A0AEC0', text: offlineText },
      alert: { color: '#F56565', text: alertText },
    };

    const config = statusConfig[status] || statusConfig.offline;
    
    return (
      <View style={[styles.statusBadge, { backgroundColor: `${config.color}20` }]}>
        <View style={[styles.statusDot, { backgroundColor: config.color }]} />
        <Text style={[styles.statusText, { color: config.color }]}>
          {config.text}
        </Text>
      </View>
    );
  };

  const renderSeniorItem = ({ item }: { item: Senior }) => (
    <TouchableOpacity 
      style={[styles.seniorCard, { backgroundColor: isDark ? '#2D3748' : '#FFFFFF' }]}
      onPress={() => navigation.navigate('SeniorDetail', { seniorId: item.id })}
    >
      {item.avatar ? (
        <Image 
          source={{ uri: item.avatar }} 
          style={styles.avatar} 
        />
      ) : (
        <View style={[styles.avatar, { backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="person" size={24} color="#718096" />
        </View>
      )}
      <View style={styles.seniorInfo}>
        <View style={styles.seniorHeader}>
          <Text style={[styles.seniorName, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>
            {item.name}
          </Text>
          {renderStatusBadge(item.status)}
        </View>
        <Text style={[styles.lastSeen, { color: isDark ? '#A0AEC0' : '#718096' }]}>
          {`${lastSeenText} ${item.lastActive}`}
        </Text>
        <View style={styles.metricsContainer}>
          {item.heartRate !== undefined && (
            <View style={styles.metricItem}>
              <Ionicons name="heart" size={16} color="#F56565" />
              <Text style={[styles.metricText, { color: isDark ? '#E2E8F0' : '#4A5568' }]}>
                {item.heartRate} BPM
              </Text>
            </View>
          )}
          {item.oxygen !== undefined && (
            <View style={styles.metricItem}>
              <Ionicons name="pulse" size={16} color="#4299E1" />
              <Text style={[styles.metricText, { color: isDark ? '#E2E8F0' : '#4A5568' }]}>
                {item.oxygen}% SpO₂
              </Text>
            </View>
          )}
          {item.steps !== undefined && (
            <View style={styles.metricItem}>
              <Ionicons name="walk" size={16} color="#48BB78" />
              <Text style={[styles.metricText, { color: isDark ? '#E2E8F0' : '#4A5568' }]}>
                {item.steps.toLocaleString()}
              </Text>
            </View>
          )}
        </View>
      </View>
      <Ionicons 
        name="chevron-forward" 
        size={24} 
        color={isDark ? '#718096' : '#A0AEC0'} 
      />
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
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>
          {mySeniorsText}
        </Text>
      </View>

      {seniors.length > 0 ? (
        <FlatList
          data={seniors}
          renderItem={renderSeniorItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchSeniors}
              colors={[isDark ? '#48BB78' : '#2F855A']}
              tintColor={isDark ? '#48BB78' : '#2F855A'}
            />
          }
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons 
            name="people" 
            size={64} 
            color={isDark ? '#4A5568' : '#A0AEC0'} 
          />
          <Text style={[styles.emptyStateText, { color: isDark ? '#E2E8F0' : '#4A5568' }]}>
            {noSeniorsText}
          </Text>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: isDark ? '#2D3748' : '#E2E8F0' }]}
            onPress={() => navigation.navigate('ConnectSenior')}
          >
            <Ionicons 
              name="person-add" 
              size={20} 
              color={isDark ? '#48BB78' : '#2F855A'} 
              style={styles.addButtonIcon}
            />
            <Text style={[styles.addButtonText, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>
              {connectNowText}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {seniors.length > 0 && (
        <TouchableOpacity 
          style={[styles.floatingButton, { backgroundColor: isDark ? '#2F855A' : '#38A169' }]}
          onPress={() => navigation.navigate('ConnectSenior')}
        >
          <Ionicons name="person-add" size={24} color="white" />
        </TouchableOpacity>
      )}
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
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2F855A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  seniorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
    backgroundColor: '#E2E8F0',
  },
  seniorInfo: {
    flex: 1,
  },
  seniorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  seniorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
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
    color: '#718096',
    marginBottom: 8,
  },
  metricsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metricText: {
    fontSize: 12,
    marginLeft: 4,
    color: '#4A5568',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    color: '#4A5568',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  addButtonIcon: {
    marginRight: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A202C',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default SeniorsListScreen;
