import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  FlatList,
  Modal,
  Platform,
} from 'react-native';
import { useTheme } from '../../contexts/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

// Extend dayjs with relativeTime plugin
dayjs.extend(relativeTime);

interface HealthRecord {
  id: string;
  date: Date;
  title: string;
  description: string;
  type: 'appointment' | 'medication' | 'symptom' | 'other';
  severity?: 'low' | 'medium' | 'high';
  doctor?: string;
  location?: string;
  notes?: string;
}

interface HealthData {
  records: HealthRecord[];
  lastUpdated: Date;
}

type HealthHistoryScreenProps = {
  route: {
    params: {
      seniorId: string;
    };
  };
};

const isHex = (s: string) => /^#([A-Fa-f0-9]{3,8})$/.test(s?.trim?.() ?? '');
const isRgb = (s: string) => /^rgba?\(/i.test(s?.trim?.() ?? '');
const isColorName = (s: string) => /^[a-zA-Z]+$/.test(s?.trim?.() ?? '');

/** Recursively try to extract a color string from theme values (fallback to provided fallback) */
function extractColor(value: any, fallback = '#000000') {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') {
    const s = value.trim();
    // If it looks like a color return, otherwise still return string (themes often use token names)
    if (isHex(s) || isRgb(s) || isColorName(s) || s.length > 0) return s;
    return fallback;
  }
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    const priorityKeys = ['hex', 'color', 'value', 'main', 'DEFAULT', 'default', 'light', 'dark', 'primary'];
    for (const k of priorityKeys) {
      if (Object.prototype.hasOwnProperty.call(value, k)) {
        const candidate = extractColor(value[k], null as any);
        if (candidate) return candidate;
      }
    }
    for (const k in value) {
      if (Object.prototype.hasOwnProperty.call(value, k)) {
        const candidate = extractColor(value[k], null as any);
        if (candidate) return candidate;
      }
    }
    if (Array.isArray(value)) {
      for (const v of value) {
        const candidate = extractColor(v, null as any);
        if (candidate) return candidate;
      }
    }
  }
  return fallback;
}

const HealthHistoryScreen: React.FC<HealthHistoryScreenProps> = ({ route }) => {
  const { seniorId } = route.params;
  const themeHook = useTheme() as any;
  const { t } = useTranslation();

  // defensive theme handling: support shapes like { colors: {...}, isDark } or { theme: {...}, isDark }
  const isDark = !!(themeHook?.isDark);
  const colorsObj = themeHook?.colors ?? themeHook?.theme ?? themeHook ?? {};
  const bgColor = extractColor(colorsObj.background, isDark ? '#0f172a' : '#ffffff');
  const textColor = extractColor(colorsObj.text, isDark ? '#E2E8F0' : '#1A202C');
  const cardColor = extractColor(colorsObj.card, isDark ? '#111827' : '#F8FAFC');
  const borderColor = extractColor(colorsObj.border, isDark ? '#1F2937' : 'rgba(0,0,0,0.08)');
  const primaryColor = extractColor(colorsObj.primary, isDark ? '#4FD1C5' : '#2C7A7B');
  const tertiaryText = extractColor(colorsObj.textTertiary, isDark ? '#9CA3AF' : '#6B7280');

  const [healthData, setHealthData] = useState<HealthData>({ records: [], lastUpdated: new Date() });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null);
  const [showRecordModal, setShowRecordModal] = useState(false);

  // Load health records
  const loadHealthRecords = useCallback(async () => {
    try {
      setError(null);
      // Simulate network latency
      await new Promise((res) => setTimeout(res, 800));

      // Mock data — replace with API call
      const mockRecords: HealthRecord[] = [
        {
          id: '1',
          date: new Date(2025, 10, 1),
          title: 'Annual Checkup',
          description: 'Routine physical examination with Dr. Smith',
          type: 'appointment',
          severity: 'low',
          doctor: 'Dr. Sarah Smith',
          location: 'City Medical Center',
          notes: 'Blood work scheduled for next visit',
        },
        {
          id: '2',
          date: new Date(2025, 9, 15),
          title: 'Blood Pressure Medication',
          description: 'Prescribed Lisinopril 10mg daily',
          type: 'medication',
          severity: 'medium',
          doctor: 'Dr. Michael Johnson',
          notes: 'Monitor blood pressure twice daily',
        },
        {
          id: '3',
          date: new Date(2025, 9, 10),
          title: 'Knee Pain',
          description: 'Reported persistent knee pain, recommended to see orthopedic',
          type: 'symptom',
          severity: 'high',
          doctor: 'Dr. Robert Chen',
          notes: 'Schedule MRI if pain persists for more than 2 weeks',
        },
        {
          id: '4',
          date: new Date(2025, 8, 22),
          title: 'Dental Cleaning',
          description: 'Regular dental checkup and cleaning',
          type: 'appointment',
          severity: 'low',
          doctor: 'Dr. Emily Wilson',
          location: 'Bright Smile Dental',
          notes: 'No cavities found, next cleaning in 6 months',
        },
        {
          id: '5',
          date: new Date(2025, 8, 5),
          title: 'Allergy Medication',
          description: 'Prescribed Loratadine 10mg as needed for allergies',
          type: 'medication',
          severity: 'low',
          doctor: 'Dr. Sarah Smith',
        },
      ];

      setHealthData({
        records: mockRecords.sort((a, b) => b.date.getTime() - a.date.getTime()),
        lastUpdated: new Date(),
      });
      setError(null);
    } catch (err) {
      console.error('Error loading health records:', err);
      setError(t('Failed to load health records. Please try again.') || 'Failed to load health records. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  // initial load
  useEffect(() => {
    loadHealthRecords();
  }, [loadHealthRecords]);

  // pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHealthRecords();
  }, [loadHealthRecords]);

  // date helpers
  const formatDate = (date: Date) => dayjs(date).format('MMM D, YYYY');
  const formatRelativeTime = (date: Date) => dayjs(date).fromNow();

  // icons & severity color
  const getRecordIcon = (type: HealthRecord['type']) => {
    switch (type) {
      case 'appointment':
        return 'event';
      case 'medication':
        return 'medication';
      case 'symptom':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getSeverityColor = (severity?: HealthRecord['severity']) => {
    switch (severity) {
      case 'high':
        return '#E53E3E';
      case 'medium':
        return '#D69E2E';
      case 'low':
        return '#38A169';
      default:
        return isDark ? '#A0AEC0' : '#4A5568';
    }
  };

  // record press
  const handleRecordPress = (record: HealthRecord) => {
    setSelectedRecord(record);
    setShowRecordModal(true);
  };

  const closeRecordModal = () => {
    setShowRecordModal(false);
    setSelectedRecord(null);
  };

  // Handle add record button press
  const handleAddRecord = () => {
    Alert.alert(
      'Add Health Record',
      'What type of record would you like to add?',
      [
        {
          text: 'Appointment',
          onPress: () => showAddRecordForm('appointment'),
        },
        {
          text: 'Medication',
          onPress: () => showAddRecordForm('medication'),
        },
        {
          text: 'Symptom',
          onPress: () => showAddRecordForm('symptom'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  // Show add record form
  const showAddRecordForm = (type: HealthRecord['type']) => {
    Alert.alert('Add ' + type.charAt(0).toUpperCase() + type.slice(1), `This would open a form to add a new ${type} record.`, [
      {
        text: 'OK',
        onPress: () => {
          const newRecord: HealthRecord = {
            id: Date.now().toString(),
            date: new Date(),
            title: `New ${type}`,
            description: `Details about the ${type}`,
            type,
            severity: 'medium',
          };
          setHealthData((prev) => ({ ...prev, records: [newRecord, ...prev.records], lastUpdated: new Date() }));
          Alert.alert('Success', 'Record added successfully!');
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const renderRecordItem = ({ item }: { item: HealthRecord }) => (
    <TouchableOpacity
      style={[
        styles.recordCard,
        {
          backgroundColor: cardColor,
          borderLeftWidth: 4,
          borderLeftColor: getSeverityColor(item.severity),
        },
      ]}
      onPress={() => handleRecordPress(item)}
    >
      <View style={styles.recordHeader}>
        <View style={styles.recordType}>
          <MaterialIcons name={getRecordIcon(item.type) as any} size={20} color={primaryColor} />
          <Text style={[styles.recordTypeText, { color: primaryColor }]}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Text>
        </View>
        <Text style={[styles.recordDate, { color: tertiaryText }]}>{formatDate(item.date)}</Text>
      </View>

      <Text style={[styles.recordTitle, { color: textColor }]}>{item.title}</Text>

      <Text style={[styles.recordDescription, { color: tertiaryText }]} numberOfLines={2} ellipsizeMode="tail">
        {item.description}
      </Text>

      {item.severity && (
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) + '33' }]}>
          <Text style={[styles.severityText, { color: getSeverityColor(item.severity) }]}>{item.severity.toUpperCase()}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="folder-open" size={48} color={isDark ? '#4A5568' : '#A0AEC0'} />
      <Text style={[styles.emptyText, { color: tertiaryText }]}>No health records found. Add your first record to get started.</Text>
    </View>
  );

  // Loading state (one central place)
  if (isLoading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={{ marginTop: 16, color: textColor, fontSize: 16 }}>Loading health records...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: bgColor }]}>
        <MaterialIcons name="error-outline" size={48} color="#E53E3E" />
        <Text style={[styles.errorText, { color: textColor }]}>{error}</Text>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: primaryColor }]} onPress={loadHealthRecords}>
          <MaterialIcons name="refresh" size={18} color="white" style={{ marginRight: 8 }} />
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Main render
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Text style={[styles.title, { color: textColor }]}>Health History</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.refreshButton, { backgroundColor: isDark ? '#2D3748' : '#E2E8F0' }]}
            onPress={onRefresh}
            disabled={refreshing}
          >
            <MaterialIcons name="refresh" size={20} color={isDark ? primaryColor : primaryColor} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.addButton, { backgroundColor: primaryColor }]} onPress={handleAddRecord}>
            <MaterialIcons name="add" size={20} color="white" />
            <Text style={styles.buttonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.lastUpdated}>
        <Text style={{ color: tertiaryText, fontSize: 12 }}>Last updated: {formatRelativeTime(healthData.lastUpdated)}</Text>
      </View>

      <FlatList
        data={healthData.records}
        renderItem={renderRecordItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[primaryColor]} tintColor={primaryColor} />}
        showsVerticalScrollIndicator={false}
      />

      {/* Record Details Modal */}
      <Modal visible={showRecordModal && selectedRecord !== null} animationType="slide" transparent={true} onRequestClose={closeRecordModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
            <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
              <Text style={[styles.modalTitle, { color: textColor }]}>{selectedRecord?.title}</Text>
              <TouchableOpacity onPress={closeRecordModal} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color={tertiaryText} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.detailRow}>
                <MaterialIcons name={getRecordIcon(selectedRecord?.type ?? 'other') as any} size={20} color={getSeverityColor(selectedRecord?.severity)} style={styles.detailIcon} />
                <View>
                  <Text style={[styles.detailLabel, { color: tertiaryText }]}>Type</Text>
                  <Text style={[styles.detailValue, { color: textColor }]}>{selectedRecord?.type ? selectedRecord.type.charAt(0).toUpperCase() + selectedRecord.type.slice(1) : 'N/A'}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <MaterialIcons name="date-range" size={20} color={getSeverityColor(selectedRecord?.severity)} style={styles.detailIcon} />
                <View>
                  <Text style={[styles.detailLabel, { color: tertiaryText }]}>Date</Text>
                  <Text style={[styles.detailValue, { color: textColor }]}>{selectedRecord?.date ? formatDate(selectedRecord.date) : 'N/A'}</Text>
                </View>
              </View>

              {selectedRecord?.doctor && (
                <View style={styles.detailRow}>
                  <MaterialIcons name="person" size={20} color={getSeverityColor(selectedRecord?.severity)} style={styles.detailIcon} />
                  <View>
                    <Text style={[styles.detailLabel, { color: tertiaryText }]}>Doctor</Text>
                    <Text style={[styles.detailValue, { color: textColor }]}>{selectedRecord.doctor}</Text>
                  </View>
                </View>
              )}

              {selectedRecord?.location && (
                <View style={styles.detailRow}>
                  <MaterialIcons name="location-on" size={20} color={getSeverityColor(selectedRecord?.severity)} style={styles.detailIcon} />
                  <View>
                    <Text style={[styles.detailLabel, { color: tertiaryText }]}>Location</Text>
                    <Text style={[styles.detailValue, { color: textColor }]}>{selectedRecord.location}</Text>
                  </View>
                </View>
              )}

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Description</Text>
                <Text style={[styles.sectionContent, { color: tertiaryText }]}>{selectedRecord?.description || 'No description available.'}</Text>
              </View>

              {selectedRecord?.notes && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: textColor }]}>Notes</Text>
                  <Text style={[styles.sectionContent, { color: tertiaryText }]}>{selectedRecord.notes}</Text>
                </View>
              )}

              {selectedRecord?.severity && (
                <View style={[styles.severityContainer, { backgroundColor: getSeverityColor(selectedRecord.severity) + '1A', borderColor: getSeverityColor(selectedRecord.severity) + '4D' }]}>
                  <Text style={[styles.severityLabel, { color: getSeverityColor(selectedRecord.severity) }]}>{selectedRecord.severity.charAt(0).toUpperCase() + selectedRecord.severity.slice(1)} Priority</Text>
                </View>
              )}
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: borderColor }]}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: primaryColor }]} onPress={closeRecordModal}>
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },

  // Last updated text
  lastUpdated: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },

  // Buttons
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 12,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 4,
  },

  // List
  listContent: {
    padding: 16,
    paddingTop: 12,
  },

  // Record Card
  recordCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
  },
  recordType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordTypeText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '600',
  },
  recordDate: {
    fontSize: 12,
    opacity: 0.8,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  recordDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },

  // Severity Badge
  severityBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginTop: 4,
  },
  severityText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 280,
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  detailIcon: {
    marginRight: 16,
    marginTop: 2,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 15,
    lineHeight: 22,
  },
  severityContainer: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  severityLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  modalButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HealthHistoryScreen;
