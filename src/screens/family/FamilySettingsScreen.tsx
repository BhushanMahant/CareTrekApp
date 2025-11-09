import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Switch, 
  TouchableOpacity, 
  SafeAreaView,
  Alert,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useTheme } from '../../contexts/theme/ThemeContext';
import { useTranslation } from '../../contexts/translation/TranslationContext';
import { useCachedTranslation } from '../../hooks/useCachedTranslation';

type SettingsStackParamList = {
  EditProfile: undefined;
  NotificationSettings: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  HelpCenter: undefined;
  ContactSupport: undefined;
};

const FamilySettingsScreen = () => {
  const navigation = useNavigation<StackNavigationProp<SettingsStackParamList>>();
  const { isDark, toggleTheme } = useTheme();
  const { currentLanguage, changeLanguage } = useTranslation();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationSharingEnabled, setLocationSharingEnabled] = useState(true);
  const [emergencyAlertsEnabled, setEmergencyAlertsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(isDark);

  // Translations
  const { translatedText: settingsText } = useCachedTranslation('Settings', currentLanguage);
  const { translatedText: accountText } = useCachedTranslation('Account', currentLanguage);
  const { translatedText: editProfileText } = useCachedTranslation('Edit Profile', currentLanguage);
  const { translatedText: notificationSettingsText } = useCachedTranslation('Notification Settings', currentLanguage);
  const { translatedText: preferencesText } = useCachedTranslation('Preferences', currentLanguage);
  const { translatedText: darkModeText } = useCachedTranslation('Dark Mode', currentLanguage);
  const { translatedText: notificationsText } = useCachedTranslation('Notifications', currentLanguage);
  const { translatedText: locationSharingText } = useCachedTranslation('Location Sharing', currentLanguage);
  const { translatedText: emergencyAlertsText } = useCachedTranslation('Emergency Alerts', currentLanguage);
  const { translatedText: supportText } = useCachedTranslation('Support', currentLanguage);
  const { translatedText: helpCenterText } = useCachedTranslation('Help Center', currentLanguage);
  const { translatedText: contactSupportText } = useCachedTranslation('Contact Support', currentLanguage);
  const { translatedText: aboutText } = useCachedTranslation('About', currentLanguage);
  const { translatedText: privacyPolicyText } = useCachedTranslation('Privacy Policy', currentLanguage);
  const { translatedText: termsOfServiceText } = useCachedTranslation('Terms of Service', currentLanguage);
  const { translatedText: versionText } = useCachedTranslation('Version', currentLanguage);
  const { translatedText: signOutText } = useCachedTranslation('Sign Out', currentLanguage);
  const { translatedText: signOutConfirmationText } = useCachedTranslation('Are you sure you want to sign out?', currentLanguage);
  const { translatedText: cancelText } = useCachedTranslation('Cancel', currentLanguage);
  const { translatedText: confirmText } = useCachedTranslation('Confirm', currentLanguage);

  const handleSignOut = () => {
    Alert.alert(
      signOutText,
      signOutConfirmationText,
      [
        {
          text: cancelText,
          style: 'cancel',
        },
        {
          text: confirmText,
          onPress: () => {
            // Handle sign out logic here
            console.log('User signed out');
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  const openLink = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      console.error('Error opening link:', error);
    }
  };

  const openEmail = (email: string) => {
    Linking.openURL(`mailto:${email}?subject=CareTrek Support`);
  };

  const toggleDarkMode = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    toggleTheme();
  };

  const renderSectionHeader = (title: string) => (
    <Text style={[styles.sectionHeader, { color: isDark ? '#A0AEC0' : '#718096' }]}>
      {title}
    </Text>
  );

  const renderSettingItem = ({
    icon,
    label,
    onPress,
    isSwitch = false,
    switchValue,
    onSwitchValueChange,
    showChevron = true,
    isLast = false,
  }: {
    icon: string;
    label: string;
    onPress?: () => void;
    isSwitch?: boolean;
    switchValue?: boolean;
    onSwitchValueChange?: (value: boolean) => void;
    showChevron?: boolean;
    isLast?: boolean;
  }) => (
    <TouchableOpacity
      style={[
        styles.settingItem,
        !isLast && { borderBottomWidth: 1, borderBottomColor: isDark ? '#2D3748' : '#E2E8F0' },
      ]}
      onPress={onPress}
      disabled={isSwitch}
    >
      <View style={styles.settingLeft}>
        <MaterialIcons 
          name={icon as any} 
          size={24} 
          color={isDark ? '#E2E8F0' : '#4A5568'} 
          style={styles.settingIcon}
        />
        <Text style={[styles.settingLabel, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>
          {label}
        </Text>
      </View>
      
      {isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchValueChange}
          trackColor={{ false: isDark ? '#4A5568' : '#E2E8F0', true: isDark ? '#48BB78' : '#38A169' }}
          thumbColor="#FFFFFF"
          ios_backgroundColor={isDark ? '#4A5568' : '#E2E8F0'}
        />
      ) : showChevron ? (
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={isDark ? '#A0AEC0' : '#718096'} 
        />
      ) : null}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#171923' : '#F7FAFC' }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>
          {settingsText}
        </Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {/* Account Section */}
        {renderSectionHeader(accountText)}
        <View style={[styles.sectionContainer, { backgroundColor: isDark ? '#1A202C' : '#FFFFFF' }]}>
          {renderSettingItem({
            icon: 'person-outline',
            label: editProfileText,
            onPress: () => navigation.navigate('EditProfile'),
          })}
          {renderSettingItem({
            icon: 'notifications-none',
            label: notificationSettingsText,
            onPress: () => navigation.navigate('NotificationSettings'),
          })}
        </View>

        {/* Preferences Section */}
        {renderSectionHeader(preferencesText)}
        <View style={[styles.sectionContainer, { backgroundColor: isDark ? '#1A202C' : '#FFFFFF' }]}>
          {renderSettingItem({
            icon: 'dark-mode',
            label: darkModeText,
            isSwitch: true,
            switchValue: darkMode,
            onSwitchValueChange: toggleDarkMode,
            showChevron: false,
          })}
          {renderSettingItem({
            icon: 'notifications-none',
            label: notificationsText,
            isSwitch: true,
            switchValue: notificationsEnabled,
            onSwitchValueChange: setNotificationsEnabled,
            showChevron: false,
          })}
          {renderSettingItem({
            icon: 'location-on',
            label: locationSharingText,
            isSwitch: true,
            switchValue: locationSharingEnabled,
            onSwitchValueChange: setLocationSharingEnabled,
            showChevron: false,
          })}
          {renderSettingItem({
            icon: 'warning',
            label: emergencyAlertsText,
            isSwitch: true,
            switchValue: emergencyAlertsEnabled,
            onSwitchValueChange: setEmergencyAlertsEnabled,
            showChevron: false,
            isLast: true,
          })}
        </View>

        {/* Support Section */}
        {renderSectionHeader(supportText)}
        <View style={[styles.sectionContainer, { backgroundColor: isDark ? '#1A202C' : '#FFFFFF' }]}>
          {renderSettingItem({
            icon: 'help-outline',
            label: helpCenterText,
            onPress: () => navigation.navigate('HelpCenter'),
          })}
          {renderSettingItem({
            icon: 'email',
            label: contactSupportText,
            onPress: () => openEmail('support@caretrek.app'),
            isLast: true,
          })}
        </View>

        {/* About Section */}
        {renderSectionHeader(aboutText)}
        <View style={[styles.sectionContainer, { backgroundColor: isDark ? '#1A202C' : '#FFFFFF' }]}>
          {renderSettingItem({
            icon: 'privacy-tip',
            label: privacyPolicyText,
            onPress: () => navigation.navigate('PrivacyPolicy'),
          })}
          {renderSettingItem({
            icon: 'description',
            label: termsOfServiceText,
            onPress: () => navigation.navigate('TermsOfService'),
          })}
          <View style={styles.versionContainer}>
            <Text style={[styles.versionText, { color: isDark ? '#A0AEC0' : '#718096' }]}>
              {versionText} 1.0.0
            </Text>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity 
          style={[styles.signOutButton, { backgroundColor: isDark ? '#2D3748' : '#E2E8F0' }]}
          onPress={handleSignOut}
        >
          <Text style={[styles.signOutText, { color: '#E53E3E' }]}>{signOutText}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionContainer: {
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  settingLabel: {
    fontSize: 16,
    color: '#1A202C',
    flex: 1,
  },
  versionContainer: {
    padding: 16,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    color: '#718096',
  },
  signOutButton: {
    marginTop: 8,
    marginBottom: 32,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E53E3E',
  },
});

export default FamilySettingsScreen;
