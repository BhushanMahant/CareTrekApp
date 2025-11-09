import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useTheme } from '../../contexts/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../../contexts/translation/TranslationContext';
import { useCachedTranslation } from '../../hooks/useCachedTranslation';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { isDark } = useTheme();
  const { currentLanguage } = useTranslation();

  // Translations
  const { translatedText: welcomeText } = useCachedTranslation('Welcome back', currentLanguage);
  const { translatedText: healthText } = useCachedTranslation('Health', currentLanguage);
  const { translatedText: remindersText } = useCachedTranslation('Reminders', currentLanguage);
  const { translatedText: mapText } = useCachedTranslation('Map', currentLanguage);
  const { translatedText: idShareText } = useCachedTranslation('ID Share', currentLanguage);
  const { translatedText: sosText } = useCachedTranslation('SOS', currentLanguage);
  const { translatedText: sosContactsText } = useCachedTranslation('SOS Contacts', currentLanguage);
  const { translatedText: quickActionsText } = useCachedTranslation('Quick Actions', currentLanguage);
  const { translatedText: backText } = useCachedTranslation('Back', currentLanguage);

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#171923' : '#FFFBEF' }]}>
      {/* Back Button */}
      <TouchableOpacity
        style={[styles.backButton, { borderColor: isDark ? '#4A5568' : '#E2E8F0' }]}
        onPress={handleBack}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={20} color={isDark ? '#E2E8F0' : '#4A5568'} />
        <Text style={[styles.backButtonText, { color: isDark ? '#E2E8F0' : '#4A5568' }]}>
          {backText}
        </Text>
      </TouchableOpacity>

      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: isDark ? '#2F855A' : '#2F855A' }]}>
            {welcomeText},
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? '#A0AEC0' : '#4A5568' }]}>
            How can we help you today?
          </Text>
        </View>

        {/* SOS Button */}
        <TouchableOpacity
          style={[styles.sosButton, { backgroundColor: isDark ? '#E53E3E' : '#F56565' }]}
          onPress={() => navigation.navigate('SOSContacts')}
        >
          <Ionicons name="alert-circle" size={40} color="white" />
          <Text style={styles.sosButtonText}>{sosText}</Text>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#2F855A' : '#2F855A' }]}>
            {quickActionsText}
          </Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: isDark ? '#2D3748' : '#FFFFFF' }]}
              onPress={() => navigation.navigate('Health')}
            >
              <View style={[styles.iconContainer, { backgroundColor: isDark ? '#2F855A' : '#E6FFFA' }]}>
                <Ionicons name="medical" size={24} color={isDark ? '#FFFFFF' : '#2F855A'} />
              </View>
              <Text style={[styles.quickActionText, { color: isDark ? '#E2E8F0' : '#2D3748' }]}>
                {healthText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: isDark ? '#2D3748' : '#FFFFFF' }]}
              onPress={() => navigation.navigate('Reminders')}
            >
              <View style={[styles.iconContainer, { backgroundColor: isDark ? '#D69E2E' : '#FFFAF0' }]}>
                <Ionicons name="alarm" size={24} color={isDark ? '#FFFFFF' : '#D69E2E'} />
              </View>
              <Text style={[styles.quickActionText, { color: isDark ? '#E2E8F0' : '#2D3748' }]}>
                {remindersText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: isDark ? '#2D3748' : '#FFFFFF' }]}
              onPress={() => navigation.navigate('Map')}
            >
              <View style={[styles.iconContainer, { backgroundColor: isDark ? '#3182CE' : '#EBF8FF' }]}>
                <Ionicons name="map" size={24} color={isDark ? '#FFFFFF' : '#3182CE'} />
              </View>
              <Text style={[styles.quickActionText, { color: isDark ? '#E2E8F0' : '#2D3748' }]}>
                {mapText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: isDark ? '#2D3748' : '#FFFFFF' }]}
              onPress={() => navigation.navigate('IdShare')}
            >
              <View style={[styles.iconContainer, { backgroundColor: isDark ? '#805AD5' : '#FAF5FF' }]}>
                <Ionicons name="share-social" size={24} color={isDark ? '#FFFFFF' : '#805AD5'} />
              </View>
              <Text style={[styles.quickActionText, { color: isDark ? '#E2E8F0' : '#2D3748' }]}>
                {idShareText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
    paddingTop: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2F855A',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  quickActionsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#2F855A',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  sosButton: {
    width: '100%',
    paddingVertical: 24,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  sosButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 12,
  },
});

export default HomeScreen;
