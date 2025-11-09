import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ScrollView, 
  ActivityIndicator,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/theme/ThemeContext';
import { useTranslation } from '../../contexts/translation/TranslationContext';
import { RootStackParamList } from '../../navigation/RootNavigator';

type NewConnectSeniorScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ConnectSenior'>;

const NewConnectSeniorScreen = () => {
  const navigation = useNavigation<NewConnectSeniorScreenNavigationProp>();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  
  // Use direct string literals for now
  const translations = {
    qrScanning: 'QR Scanning',
    qrScanningMessage: 'Point your camera at the QR code to connect with a senior',
    ok: 'OK',
    enterManually: 'Enter Manually',
    error: 'Error',
    pleaseEnterSeniorId: 'Please enter a senior ID',
    success: 'Success',
    connectionRequestSent: 'Connection request sent successfully',
    connectionFailed: 'Failed to connect. Please try again.',
    connectSenior: 'Connect Senior',
    scanQR: 'Scan QR',
    pointCameraAtQR: 'Point your camera at the QR code',
    scanQRCode: 'Scan QR Code',
    enterSeniorId: 'Enter Senior ID',
    seniorIdPlaceholder: 'Enter 6-digit ID',
    askSeniorForId: 'Ask the senior for their 6-digit ID',
    connect: 'Connect'
  };
  const [seniorId, setSeniorId] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState<'qr' | 'manual'>('qr');

  const handleScanQR = () => {
    // In a real app, this would open the camera for QR scanning
    Alert.alert(
      'QR Scanning',
      'Point your camera at the QR code to connect with a senior',
      [
        {
          text: 'OK',
          style: 'default' as const
        },
        {
          text: 'Enter Manually',
          onPress: () => setActiveTab('manual'),
          style: 'default' as const
        }
      ]
    );
  };

  const handleConnect = async () => {
    if (!seniorId.trim()) {
      Alert.alert('Error', 'Please enter a senior ID');
      return;
    }

    setIsConnecting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show success message
      Alert.alert(
        'Success',
        'Connection request sent successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
            style: 'default' as const
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to connect. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBack}
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={colors.text} 
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {translations.connectSenior}
        </Text>
        <View style={styles.headerRight} />
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            {translations.connectSenior}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'qr' && styles.activeTab,
              { borderColor: colors.primary }
            ]}
            onPress={() => setActiveTab('qr')}
          >
            <Ionicons 
              name="qr-code" 
              size={24} 
              color={activeTab === 'qr' ? 'white' : colors.text} 
            />
            <Text 
              style={[
                styles.tabText, 
                { 
                  color: activeTab === 'qr' ? 'white' : colors.text,
                  marginLeft: 8
                }
              ]}
            >
              {translations.scanQR}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'manual' && styles.activeTab,
              { borderColor: colors.primary, marginLeft: 10 }
            ]}
            onPress={() => setActiveTab('manual')}
          >
            <Ionicons 
              name="pencil" 
              size={20} 
              color={activeTab === 'manual' ? 'white' : colors.text} 
            />
            <Text 
              style={[
                styles.tabText, 
                { 
                  color: activeTab === 'manual' ? 'white' : colors.text,
                  marginLeft: 8
                }
              ]}
            >
              {t('enterManually')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {activeTab === 'qr' ? (
            <View style={styles.qrContainer}>
              <View style={[styles.qrPlaceholder, { borderColor: colors.border }]}>
                <Ionicons name="qr-code" size={80} color={colors.primary} />
                <Text style={[styles.qrText, { color: colors.text }]}>
                  {translations.pointCameraAtQR}
                </Text>
              </View>
              <TouchableOpacity 
                style={[styles.scanButton, { backgroundColor: colors.primary }]}
                onPress={handleScanQR}
              >
                <Ionicons name="scan" size={20} color="white" />
                <Text style={styles.scanButtonText}>{translations.scanQRCode}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.manualContainer}>
              <Text style={[styles.label, { color: colors.text }]}>
                {translations.enterSeniorId}
              </Text>
              <View style={[styles.inputContainer, { borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder={translations.seniorIdPlaceholder}
                  placeholderTextColor={colors.text + '80'}
                  value={seniorId}
                  onChangeText={setSeniorId}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <Ionicons name="person" size={20} color={colors.text + '80'} />
              </View>
              <Text style={[styles.helpText, { color: colors.text + '80' }]}>
                {translations.askSeniorForId}
              </Text>
              
              <TouchableOpacity 
                style={[
                  styles.connectButton, 
                  { 
                    backgroundColor: isConnecting ? colors.primary + '80' : colors.primary,
                    opacity: seniorId.trim() ? 1 : 0.7
                  }
                ]}
                onPress={handleConnect}
                disabled={isConnecting || !seniorId.trim()}
              >
                {isConnecting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.connectButtonText}>
                    {translations.connect}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  headerRight: {
    width: 40, // Same as back button for balance
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  activeTab: {
    backgroundColor: '#3182CE',
    borderColor: '#3182CE',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  qrContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  qrPlaceholder: {
    width: 250,
    height: 250,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  qrText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  manualContainer: {
    marginTop: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingRight: 10,
  },
  helpText: {
    fontSize: 14,
    marginBottom: 24,
  },
  connectButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NewConnectSeniorScreen;
