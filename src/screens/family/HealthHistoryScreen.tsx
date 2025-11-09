import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/theme/ThemeContext';
import { useTranslation } from 'react-i18next';

type HealthHistoryScreenProps = {
  route: {
    params: {
      seniorId: string;
    };
  };
};

const HealthHistoryScreen: React.FC<HealthHistoryScreenProps> = ({ route }) => {
  const { seniorId } = route.params;
  const { isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#171923' : '#F7FAFC' }]}>
      <Text style={[styles.title, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>
        {t('Health History')}
      </Text>
      <Text style={{ color: isDark ? '#A0AEC0' : '#4A5568' }}>
        {t('Senior ID')}: {seniorId}
      </Text>
      {/* Add your health history components here */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});

export default HealthHistoryScreen;
