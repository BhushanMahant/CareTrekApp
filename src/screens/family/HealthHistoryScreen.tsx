import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  Alert,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/theme/ThemeContext';
import { useTranslation } from 'react-i18next';

// Extend dayjs with relativeTime plugin
dayjs.extend(relativeTime);

/* --------- Types --------- */
interface HealthMetric {
  value: number | string;
  unit: string;
  trend?: 'up' | 'down' | 'stable';
  lastUpdated: Date;
}

interface BloodPressure {
  systolic: number;
  diastolic: number;
  lastUpdated: Date;
}

interface SleepData {
  duration: number;
  quality: number;
  lastUpdated: Date;
}

type RecordType = 'appointment' | 'medication' | 'symptom' | 'other' | 'activity' | 'vital';

interface HealthRecord {
  id: string;
  date: Date;
  title: string;
  description?: string;
  type: RecordType;
  severity?: 'low' | 'medium' | 'high';
  doctor?: string;
  location?: string;
  notes?: string;
  icon?: string;
  value?: string;
  unit?: string;
}

interface HealthData {
  heartRate: HealthMetric;
  bloodOxygen: HealthMetric;
  bloodPressure: BloodPressure;
  steps: HealthMetric;
  calories: HealthMetric;
  sleep: SleepData;
  lastSync: Date;
  records: HealthRecord[];
}

type HealthHistoryScreenProps = {
  route: {
    params: {
      seniorId: string;
    };
  };
};

/* --------- Theme helpers (defensive) --------- */
const isHex = (s?: string) => typeof s === 'string' && /^#([A-Fa-f0-9]{3,8})$/.test(s.trim());
const isRgb = (s?: string) => typeof s === 'string' && /^rgba?\(/i.test(s.trim());
const isColorName = (s?: string) => typeof s === 'string' && /^[a-zA-Z]+$/.test(s.trim());

function extractColor(value: any, fallback = '#000000'): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') {
    const s = value.trim();
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

/* --------- Component --------- */
const HealthHistoryScreen: React.FC<HealthHistoryScreenProps> = ({ route }) => {
  const { seniorId } = route.params;
  const themeHook: any = useTheme();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const CHART_WIDTH = Math.max(300, width - 40);

  // Defensive theme extraction
  const isDark = !!themeHook?.isDark;
  const colorsObj = themeHook?.colors ?? themeHook?.theme ?? themeHook ?? {};
  const bgColor = extractColor(colorsObj.background, isDark ? '#0f172a' : '#ffffff');
  const cardColor = extractColor(colorsObj.card, isDark ? '#1F2937' : '#FFFFFF');
  const textColor = extractColor(colorsObj.text, isDark ? '#E2E8F0' : '#1A202C');
  const primaryColor = extractColor(colorsObj.primary, isDark ? '#4FD1C5' : '#2C7A7B');
  const borderColor = extractColor(colorsObj.border, isDark ? '#2D3748' : 'rgba(0,0,0,0.06)');
  const borderBottomColor = extractColor(colorsObj.border ?? colorsObj.separator, isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)');
  const tertiaryText = extractColor(colorsObj.textSecondary ?? colorsObj.textTertiary, isDark ? '#9CA3AF' : '#6B7280');

  // State
  const [healthData, setHealthData] = useState<HealthData>(() => ({
    heartRate: { value: 72, unit: 'bpm', trend: 'stable', lastUpdated: new Date() },
    bloodOxygen: { value: 98, unit: '%', trend: 'up', lastUpdated: new Date() },
    bloodPressure: { systolic: 120, diastolic: 80, lastUpdated: new Date() },
    steps: { value: 5423, unit: 'steps', trend: 'up', lastUpdated: new Date() },
    calories: { value: 1245, unit: 'kcal', trend: 'up', lastUpdated: new Date() },
    sleep: { duration: 420, quality: 85, lastUpdated: new Date() },
    lastSync: new Date(),
    records: [],
  }));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null);

  /* --------- Helpers --------- */
  const formatDate = (d?: Date) => (d ? dayjs(d).format('MMM D, YYYY') : 'N/A');
  const formatRelative = (d?: Date) => (d ? dayjs(d).fromNow() : 'N/A');

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <MaterialIcons name="arrow-upward" size={16} color="#48BB78" />;
      case 'down':
        return <MaterialIcons name="arrow-downward" size={16} color="#F56565" />;
      default:
        return <MaterialIcons name="remove" size={16} color={tertiaryText} />;
    }
  };

  const getRecordIconName = (type: RecordType) => {
    switch (type) {
      case 'appointment':
        return 'event';
      case 'medication':
        return 'medication';
      case 'symptom':
        return 'warning';
      case 'activity':
        return 'directions-walk';
      case 'vital':
        return 'favorite';
      default:
        return 'info';
    }
  };

  const severityColor = (s?: 'low' | 'medium' | 'high') => {
    switch (s) {
      case 'high':
        return '#F56565';
      case 'medium':
        return '#D69E2E';
      case 'low':
        return '#48BB78';
      default:
        return tertiaryText;
    }
  };

  /* --------- Data loader (mock) --------- */
  const loadHealthRecords = useCallback(async () => {
    try {
      setError(null);
      setRefreshing(true);

      // Simulate network latency
      await new Promise((res) => setTimeout(res, 700));

      // Create mock data
      const now = new Date();
      const mock: HealthData = {
        heartRate: {
          value: Math.floor(Math.random() * 30) + 60,
          unit: 'bpm',
          trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as any,
          lastUpdated: now,
        },
        bloodOxygen: {
          value: Math.floor(Math.random() * 6) + 95,
          unit: '%',
          trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as any,
          lastUpdated: now,
        },
        bloodPressure: {
          systolic: Math.floor(Math.random() * 30) + 100,
          diastolic: Math.floor(Math.random() * 20) + 60,
          lastUpdated: now,
        },
        steps: {
          value: Math.floor(Math.random() * 5000) + 2000,
          unit: 'steps',
          trend: 'up',
          lastUpdated: now,
        },
        calories: {
          value: Math.floor(Math.random() * 1000) + 800,
          unit: 'kcal',
          trend: 'up',
          lastUpdated: now,
        },
        sleep: {
          duration: Math.floor(Math.random() * 240) + 360,
          quality: Math.floor(Math.random() * 30) + 70,
          lastUpdated: now,
        },
        lastSync: now,
        records: [
          {
            id: 'hr1',
            date: new Date(),
            title: 'Heart Rate',
            description: 'Current heart rate reading',
            type: 'vital',
            icon: 'heart-pulse',
            value: String(Math.floor(Math.random() * 30) + 60),
            unit: 'bpm',
          },
          {
            id: 'bp1',
            date: new Date(),
            title: 'Blood Pressure',
            description: 'Blood pressure reading',
            type: 'vital',
            icon: 'blood-pressure',
            value: '120/80',
            unit: 'mmHg',
          },
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
        ],
      };

      mock.records.sort((a, b) => b.date.getTime() - a.date.getTime());
      setHealthData(mock);
    } catch (err) {
      console.error(err);
      setError(t('Failed to load health records. Please try again.') || 'Failed to load health records. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    loadHealthRecords();
  }, [loadHealthRecords]);

  const onRefresh = useCallback(() => {
    loadHealthRecords();
  }, [loadHealthRecords]);

  /* --------- Chart data helpers --------- */
  const generateChartData = (dataPoints: number[], labels: string[]) => ({
    labels,
    datasets: [
      {
        data: dataPoints,
        color: (opacity = 1) => primaryColor,
        strokeWidth: 2,
      },
    ],
  });

  const heartRateData = useMemo(
    () => generateChartData([72, 75, 71, 70, 69, 73, Number(healthData.heartRate.value as number)], ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
    [healthData.heartRate.value, primaryColor]
  );

  const stepsData = useMemo(
    () => generateChartData([3421, 4123, 3876, 4532, 4890, Number(healthData.steps.value as number), 0], ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
    [healthData.steps.value, primaryColor]
  );

  /* --------- Render record item --------- */
  const renderRecordItem = ({ item }: { item: HealthRecord }) => (
    <TouchableOpacity
      style={[
        styles.recordCard,
        {
          backgroundColor: cardColor,
          borderColor,
        },
      ]}
      onPress={() => {
        setSelectedRecord(item);
        setShowRecordModal(true);
      }}
    >
      <View style={styles.recordHeader}>
        <View style={styles.recordType}>
          <MaterialIcons name={getRecordIconName(item.type)} size={16} color={tertiaryText} />
          <Text style={[styles.recordTypeText, { color: tertiaryText }]}>{item.type}</Text>
        </View>
        <Text style={[styles.recordDate, { color: tertiaryText }]}>{formatDate(item.date)}</Text>
      </View>

      <Text style={[styles.recordTitle, { color: textColor }]}>{item.title}</Text>

      {item.description ? <Text style={[styles.recordDescription, { color: tertiaryText }]}>{item.description}</Text> : null}

      {item.severity ? (
        <View style={[styles.severityBadge, { backgroundColor: `${severityColor(item.severity)}33` }]}>
          <Text style={[styles.severityText, { color: severityColor(item.severity) }]}>{item.severity.toUpperCase()}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );

  /* --------- Empty / Loading / Error states --------- */
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: bgColor }]}>
        <MaterialIcons name="error-outline" size={48} color={primaryColor} />
        <Text style={[styles.errorText, { color: textColor }]}>{error}</Text>
        <TouchableOpacity style={[styles.retryButton, { borderColor: primaryColor }]} onPress={loadHealthRecords}>
          <Text style={[styles.retryButtonText, { color: primaryColor }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* --------- Main UI --------- */
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView
        contentContainerStyle={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[primaryColor]} tintColor={primaryColor} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: textColor }]}>Health Overview</Text>
          <Text style={[styles.lastUpdated, { color: tertiaryText }]}>Last sync: {formatRelative(healthData.lastSync)}</Text>
        </View>

        {/* Metrics grid */}
        <View style={styles.metricsGrid}>
          {/** Heart Rate */}
          <View style={[styles.healthMetric, { backgroundColor: cardColor, borderColor }]}>
            <View style={styles.metricHeader}>
              <MaterialCommunityIcons name="heart-pulse" size={22} color={primaryColor} />
              <Text style={[styles.metricTitle, { color: textColor }]}>Heart Rate</Text>
              <View style={styles.trendContainer}>{getTrendIcon(healthData.heartRate.trend)}</View>
            </View>
            <Text style={[styles.metricValue, { color: primaryColor }]}>
              {healthData.heartRate.value} <Text style={[styles.metricUnit, { color: tertiaryText }]}>{healthData.heartRate.unit}</Text>
            </Text>
          </View>

          {/** Blood Oxygen */}
          <View style={[styles.healthMetric, { backgroundColor: cardColor, borderColor }]}>
            <View style={styles.metricHeader}>
              <MaterialCommunityIcons name="water" size={22} color={primaryColor} />
              <Text style={[styles.metricTitle, { color: textColor }]}>SpO₂</Text>
              <View style={styles.trendContainer}>{getTrendIcon(healthData.bloodOxygen.trend)}</View>
            </View>
            <Text style={[styles.metricValue, { color: primaryColor }]}>
              {healthData.bloodOxygen.value} <Text style={[styles.metricUnit, { color: tertiaryText }]}>{healthData.bloodOxygen.unit}</Text>
            </Text>
          </View>

          {/** Blood Pressure */}
          <View style={[styles.healthMetric, { backgroundColor: cardColor, borderColor }]}>
            <View style={styles.metricHeader}>
              <MaterialCommunityIcons name="blood-bag" size={22} color={primaryColor} />
              <Text style={[styles.metricTitle, { color: textColor }]}>Blood Pressure</Text>
            </View>
            <Text style={[styles.metricValue, { color: primaryColor }]}>
              {healthData.bloodPressure.systolic}/{healthData.bloodPressure.diastolic} <Text style={[styles.metricUnit, { color: tertiaryText }]}>mmHg</Text>
            </Text>
          </View>

          {/** Steps */}
          <View style={[styles.healthMetric, { backgroundColor: cardColor, borderColor }]}>
            <View style={styles.metricHeader}>
              <MaterialCommunityIcons name="walk" size={22} color={primaryColor} />
              <Text style={[styles.metricTitle, { color: textColor }]}>Steps</Text>
              <View style={styles.trendContainer}>{getTrendIcon(healthData.steps.trend)}</View>
            </View>
            <Text style={[styles.metricValue, { color: primaryColor }]}>
              {healthData.steps.value} <Text style={[styles.metricUnit, { color: tertiaryText }]}>{healthData.steps.unit}</Text>
            </Text>
          </View>
        </View>

        {/* Charts */}
        <View style={[styles.chartContainer, { backgroundColor: cardColor, borderColor }]}>
          <Text style={[styles.chartTitle, { color: textColor }]}>Heart Rate Trend</Text>
          <LineChart
            data={heartRateData}
            width={CHART_WIDTH}
            height={220}
            chartConfig={{
              backgroundColor: 'transparent',
              backgroundGradientFrom: 'transparent',
              backgroundGradientTo: 'transparent',
              decimalPlaces: 0,
              color: (opacity = 1) => primaryColor,
              labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
              style: {
                borderRadius: 12,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: primaryColor,
              },
            }}
            bezier
            style={{ marginVertical: 8, borderRadius: 12 }}
          />
        </View>

        <View style={[styles.chartContainer, { backgroundColor: cardColor, borderColor }]}>
          <Text style={[styles.chartTitle, { color: textColor }]}>Daily Steps</Text>
          <LineChart
            data={stepsData}
            width={CHART_WIDTH}
            height={220}
            chartConfig={{
              backgroundColor: 'transparent',
              backgroundGradientFrom: 'transparent',
              backgroundGradientTo: 'transparent',
              decimalPlaces: 0,
              color: (opacity = 1) => primaryColor,
              labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
              style: { borderRadius: 12 },
              propsForDots: { r: '4', strokeWidth: '2', stroke: primaryColor },
            }}
            bezier
            style={{ marginVertical: 8, borderRadius: 12 }}
          />
        </View>

        {/* Records */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>Recent Records</Text>
        <FlatList data={healthData.records} renderItem={renderRecordItem} keyExtractor={(i) => i.id} scrollEnabled={false} contentContainerStyle={styles.recordsList} ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="folder-open" size={48} color={tertiaryText} />
            <Text style={[styles.emptyText, { color: tertiaryText }]}>No health records found</Text>
          </View>
        } />
      </ScrollView>

      {/* Record Modal */}
      <Modal visible={showRecordModal} animationType="slide" transparent onRequestClose={() => setShowRecordModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
            <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>{selectedRecord?.title}</Text>
            <TouchableOpacity onPress={() => setShowRecordModal(false)} style={styles.closeButton}>
              <MaterialIcons name="close" size={22} color={tertiaryText} />
            </TouchableOpacity>
          </View>

            <ScrollView style={styles.modalBody}>
              {selectedRecord?.description ? <Text style={{ color: textColor, marginBottom: 12 }}>{selectedRecord.description}</Text> : null}

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: tertiaryText, fontSize: 13, marginBottom: 4 }}>Date</Text>
                <Text style={{ color: textColor }}>{formatDate(selectedRecord?.date)}</Text>
              </View>

              {selectedRecord?.doctor && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: tertiaryText, fontSize: 13, marginBottom: 4 }}>Doctor</Text>
                  <Text style={{ color: textColor }}>{selectedRecord.doctor}</Text>
                </View>
              )}

              {selectedRecord?.location && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: tertiaryText, fontSize: 13, marginBottom: 4 }}>Location</Text>
                  <Text style={{ color: textColor }}>{selectedRecord.location}</Text>
                </View>
              )}

              {selectedRecord?.notes && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: tertiaryText, fontSize: 13, marginBottom: 4 }}>Notes</Text>
                  <Text style={{ color: textColor }}>{selectedRecord.notes}</Text>
                </View>
              )}

              {selectedRecord?.value && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: tertiaryText, fontSize: 13, marginBottom: 4 }}>Value</Text>
                  <Text style={{ color: textColor }}>{selectedRecord.value} {selectedRecord.unit ?? ''}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

/* --------- Styles --------- */
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  lastUpdated: { fontSize: 12, color: '#6B7280' },
  metricsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 8
  },
  healthMetric: { 
    width: '48%', 
    marginBottom: 12, 
    padding: 12, 
    borderRadius: 10, 
    borderWidth: 1 
  },
  metricHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  metricTitle: { fontSize: 14, marginLeft: 8, flex: 1 },
  trendContainer: { marginLeft: 4 },
  metricValue: { fontSize: 22, fontWeight: '700' },
  metricUnit: { fontSize: 12, fontWeight: '400', marginLeft: 6 },
  chartContainer: { borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1 },
  chartTitle: { fontSize: 16, fontWeight: '500', marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  recordsList: { paddingBottom: 30 },
  recordCard: { borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1 },
  recordHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' },
  recordType: { flexDirection: 'row', alignItems: 'center' },
  recordTypeText: { marginLeft: 8, fontSize: 12, textTransform: 'capitalize' },
  recordDate: { fontSize: 12 },
  recordTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  recordDescription: { fontSize: 14, marginBottom: 6 },
  severityBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginTop: 4 },
  severityText: { fontSize: 12, fontWeight: '600' },

  // Loading / Error
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { marginTop: 16, fontSize: 16, textAlign: 'center' },
  retryButton: { borderWidth: 1, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 4 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '85%', paddingBottom: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '700', flex: 1, marginRight: 8 },
  closeButton: { padding: 6 },
  modalBody: { padding: 12 },
});

export default HealthHistoryScreen;
