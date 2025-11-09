import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Platform, 
  KeyboardAvoidingView, 
  ActivityIndicator, 
  Alert, 
  Keyboard, 
  TouchableWithoutFeedback 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StickyInput from '../../components/StickyInput';
import { useNavigation, useTheme as useNavTheme, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { addSenior } from '../../utils/seniorStorage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/theme/ThemeContext';
import { useTranslation } from '../../contexts/translation/TranslationContext';

// Define the navigation params type
type RootStackParamList = {
  Home: undefined;
  ConnectSenior: undefined;
  // Add other screens as needed
};

type NewConnectSeniorScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ConnectSenior'>;

const isHex = (s: string) => /^#([A-Fa-f0-9]{3,8})$/.test(s.trim());
const isRgb = (s: string) => /^rgba?\(/i.test(s.trim());
const isColorName = (s: string) => /^[a-zA-Z]+$/.test(s.trim());

/**
 * Recursively find a color string inside any nested theme object/value.
 * Returns a string color (hex, rgb(...), or color name) or fallback.
 */
function extractColor(value: any, fallback = '#000000'): string {
  if (!value && value !== 0) return fallback;

  // If it's already a string, return it
  if (typeof value === 'string') {
    const s = value.trim();
    // Basic sanity: return only if it looks like a color-ish string
    if (isHex(s) || isRgb(s) || isColorName(s)) return s;
    // If it's string but not color-like, still return (some theme libs use color tokens)
    return s;
  }

  // If it's a number (rare), convert to string
  if (typeof value === 'number') return String(value);

  // If it's an object/array: search for likely keys and any nested string that looks like color
  if (typeof value === 'object') {
    const priorityKeys = ['hex', 'color', 'value', 'main', 'DEFAULT', 'default', 'light', 'dark', 'primary'];
    for (const k of priorityKeys) {
      if (Object.prototype.hasOwnProperty.call(value, k)) {
        const candidate = extractColor(value[k], null as any);
        if (candidate) return candidate;
      }
    }
    // Otherwise iterate through properties recursively
    for (const k in value) {
      if (Object.prototype.hasOwnProperty.call(value, k)) {
        try {
          const candidate = extractColor(value[k], null as any);
          if (candidate) return candidate;
        } catch {
          // skip
        }
      }
    }
    if (Array.isArray(value)) {
      for (const v of value) {
        const candidate = extractColor(v, null as any);
        if (candidate) return candidate;
      }
    }
  }

  // fallback
  return fallback;
}

/** Append alpha to 6-digit hex '#RRGGBB' -> '#RRGGBBAA'. If not hex, return original color string. */
function hexWithAlpha(color: string, alphaHex = 'CC'): string {
  if (!color || typeof color !== 'string') return color;
  const trimmed = color.trim();
  if (isHex(trimmed)) {
    if (trimmed.length === 7) return `${trimmed}${alphaHex}`; // #RRGGBB
    if (trimmed.length === 4) {
      // convert short #RGB to #RRGGBB then add alpha
      const r = trimmed[1];
      const g = trimmed[2];
      const b = trimmed[3];
      return `#${r}${r}${g}${g}${b}${b}${alphaHex}`;
    }
    // already has alpha or 8-digit: return as is
    return trimmed;
  }
  // cannot safely add alpha to non-hex
  return trimmed;
}

const NewConnectSeniorScreen: React.FC = () => {
  const seniorNameInput = React.useRef<any>(null);
  const seniorIdInput = React.useRef<any>(null);
  const navigation = useNavigation<NewConnectSeniorScreenNavigationProp>();
  const theme = useTheme() as any;
  const { colors } = useNavTheme();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    seniorId: '',
    seniorName: ''
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [errors, setErrors] = useState({
    seniorId: '',
    seniorName: ''
  });
  const [suggestedName, setSuggestedName] = useState('');

  // Mock function to simulate name lookup - replace with your actual API call
  const lookupSeniorName = (id: string) => {
    // This is a mock implementation - replace with your actual name lookup logic
    const mockNames: Record<string, string> = {
      'ABC123': 'John Smith',
      'DEF456': 'Sarah Johnson',
      'GHI789': 'Robert Davis'
    };
    return mockNames[id] || '';
  };

  // Safely extract colors (always strings)
  const colorsObj = theme?.colors ?? {};
  const isDark = !!theme?.isDark;

  const bgColor = extractColor(colorsObj.background, isDark ? '#0f172a' : '#ffffff');
  const textColor = extractColor(colorsObj.text, isDark ? '#E2E8F0' : '#1A202C');
  const cardColor = extractColor(colorsObj.card, isDark ? '#111827' : '#F8FAFC');
  const borderColor = extractColor(colorsObj.border, isDark ? '#1F2937' : 'rgba(0,0,0,0.08)');
  const textTertiary = extractColor(colorsObj.textTertiary, isDark ? '#9CA3AF' : '#6B7280');
  const primaryColor = extractColor(colorsObj.primary, colors?.primary || (isDark ? '#48BB78' : '#2F855A'));

  const validateForm = () => {
    const newErrors = {
      seniorId: '',
      seniorName: ''
    };
    let isValid = true;

    if (!formData.seniorId) {
      newErrors.seniorId = 'Senior ID is required';
      isValid = false;
    } else if (!/^[A-Z0-9]{6}$/.test(formData.seniorId)) {
      newErrors.seniorId = 'ID must be 6 characters (letters/numbers)';
      isValid = false;
    }

    if (!formData.seniorName.trim()) {
      newErrors.seniorName = 'Senior name is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleInputChange = (field: string, value: string) => {
    const newValue = field === 'seniorId' ? value.toUpperCase() : value;
    
    setFormData(prev => ({
      ...prev,
      [field]: newValue
    }));
    
    // If we're updating the senior ID, try to look up the name
    if (field === 'seniorId') {
      if (newValue.length === 6) {
        const name = lookupSeniorName(newValue);
        setSuggestedName(name || '');
      } else {
        setSuggestedName('');
      }
    }
  };

  const handleConnect = async () => {
    if (!validateForm()) return;
    
    setIsConnecting(true);
    
    try {
      // Save the new senior to storage
      const newSenior = await addSenior({
        name: formData.seniorName,
        seniorId: formData.seniorId,
        status: 'online',
        lastActive: 'Just now',
        heartRate: Math.floor(Math.random() * 40) + 60, // Random heart rate between 60-100
        oxygen: Math.floor(Math.random() * 5) + 95, // Random oxygen between 95-100
        battery: Math.floor(Math.random() * 50) + 50, // Random battery between 50-100
        location: 'Home',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.seniorName)}&background=random`,
      });
      
      // Show success message
      Alert.alert(
        'Success',
        `Successfully connected with ${formData.seniorName}`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to the previous screen (HomeScreenFamily)
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Connection error:', error);
      Alert.alert('Error', 'Failed to connect. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const canSubmit = formData.seniorId.length === 6 && formData.seniorName.trim().length > 0;

  // Decide button background: if hex -> append alpha for disabled/connecting, otherwise use primaryColor directly
  const buttonBg = (() => {
    if (isConnecting) {
      return hexWithAlpha(primaryColor, 'CC'); // semi-opaque
    }
    if (canSubmit) return primaryColor;
    // disabled
    return hexWithAlpha(primaryColor, '88');
  })();

  // Use React Navigation's header instead of custom header
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Connect with Senior',
      headerTitleAlign: 'center',
      headerStyle: {
        backgroundColor: bgColor,
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 0,
      },
      headerTintColor: textColor,
      headerLeft: () => (
        <TouchableOpacity 
          onPress={handleBack} 
          style={styles.headerBackButton}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={primaryColor} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, bgColor, textColor, primaryColor]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
        >

          <View style={styles.content}>
            <View style={styles.illustrationContainer}>
              <Ionicons 
                name="people" 
                size={80} 
                color={hexWithAlpha(primaryColor, '33')} 
                style={styles.illustration}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: textColor, marginBottom: 8 }]}>
                Senior's 6-digit ID
              </Text>
              <View style={[styles.inputContainer, { 
                borderColor: errors.seniorId ? '#EF4444' : hexWithAlpha(primaryColor, '33'),
                backgroundColor: cardColor,
                shadowColor: isDark ? '#000' : hexWithAlpha(primaryColor, '15'),
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 1,
                shadowRadius: 8,
                elevation: 3,
                marginBottom: errors.seniorId ? 4 : 20
              }]}>
                <StickyInput
                  ref={seniorIdInput}
                  style={{ 
                    color: textColor,
                    flex: 1,
                    fontSize: 16,
                  }}
                  placeholder="e.g. AB1234"
                  placeholderTextColor={textTertiary}
                  value={formData.seniorId}
                  onChangeText={(val: string) => {
                    handleInputChange('seniorId', val);
                    if (val.length === 6 && suggestedName) {
                      handleInputChange('seniorName', suggestedName);
                      seniorNameInput.current?.focus();
                    }
                  }}
                  maxLength={6}
                  selectionColor={primaryColor}
                  returnKeyType={formData.seniorId.length === 5 ? 'next' : 'default'}
                  onSubmitEditing={() => {
                    if (formData.seniorId.length === 6) {
                      if (suggestedName) {
                        handleInputChange('seniorName', suggestedName);
                      }
                      seniorNameInput.current?.focus();
                    } else {
                      seniorIdInput.current?.focus();
                    }
                  }}
                />
                <Ionicons 
                  name="keypad" 
                  size={20} 
                  color={textTertiary} 
                  style={{ marginLeft: 12, opacity: 0.7 }}
                />
              </View>
              {suggestedName ? (
                <Text style={[styles.helperText, { color: primaryColor }]}>
                  Found: {suggestedName}
                </Text>
              ) : errors.seniorId ? (
                <Text style={styles.errorText}>{errors.seniorId}</Text>
              ) : null}
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: textColor, marginBottom: 8 }]}>
                Senior's Name
              </Text>
              <View style={[styles.inputContainer, { 
                borderColor: errors.seniorName ? '#EF4444' : hexWithAlpha(primaryColor, '33'),
                backgroundColor: cardColor,
                shadowColor: isDark ? '#000' : hexWithAlpha(primaryColor, '15'),
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 1,
                shadowRadius: 8,
                elevation: 3,
                marginBottom: errors.seniorName ? 4 : 20
              }]}>
                <StickyInput
                  ref={seniorNameInput}
                  style={{ 
                    color: textColor,
                    flex: 1,
                    fontSize: 16,
                  }}
                  placeholder="e.g. John Doe"
                  placeholderTextColor={textTertiary}
                  value={formData.seniorName}
                  onChangeText={(val: string) => handleInputChange('seniorName', val)}
                  autoCapitalize="words"
                  selectionColor={primaryColor}
                  returnKeyType="done"
                  onSubmitEditing={handleConnect}
                />
                <Ionicons 
                  name="person-outline" 
                  size={20} 
                  color={textTertiary} 
                  style={{ marginLeft: 12, opacity: 0.7 }}
                />
              </View>
              {errors.seniorName ? (
                <Text style={styles.errorText}>{errors.seniorName}</Text>
              ) : null}
            </View>

            <View style={styles.infoBox}>
              <Ionicons 
                name="information-circle-outline" 
                size={20} 
                color={textTertiary} 
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.helpText, { 
                color: textTertiary,
                flex: 1,
                lineHeight: 20
              }]}>
                Ask the senior for their unique 6-digit ID and enter their name to connect and start monitoring their health data.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.connectButton, { 
                backgroundColor: canSubmit ? primaryColor : hexWithAlpha(primaryColor, '66'),
                opacity: isConnecting ? 0.8 : 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center'
              }]}
              onPress={handleConnect}
              disabled={!canSubmit || isConnecting}
              activeOpacity={0.8}
            >
              {isConnecting ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={[styles.connectButtonText, { opacity: 0.9 }]}>
                    Connecting...
                  </Text>
                </>
              ) : (
                <Text style={styles.connectButtonText}>
                  {t('connect') || 'Connect'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  scrollContent: {
    flexGrow: 1, 
    padding: 24,
    paddingTop: 16
  },
  content: {
    flex: 1,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  illustration: {
    opacity: 0.8,
  },
  headerBackButton: {
    marginLeft: 16,
    padding: 8,
    borderRadius: 20,
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 12,
    marginLeft: 4,
  },
  helperText: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 12,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 24,
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
  helpText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  connectButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    letterSpacing: 0.5,
  },
});

export default NewConnectSeniorScreen;
