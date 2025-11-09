import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Keyboard,
  Animated,
  Easing,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useTheme } from '../../contexts/theme/ThemeContext';
import { useAuth } from '../../contexts/auth/AuthContext';
import { Ionicons } from '@expo/vector-icons';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OTPVerification'>;

const LoginScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const phoneInputRef = useRef<TextInput>(null);
  
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { colors } = useTheme();
  const { loginWithPhone } = useAuth();

  // Format phone number as user types
  const formatPhoneNumber = (text: string) => {
    // Remove all non-digit characters
    const cleaned = ('' + text).replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX for US numbers
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
      const formatted = !match[2] 
        ? match[1] 
        : `(${match[1]}) ${match[2]}${match[3] ? `-${match[3]}` : ''}`;
      return formatted;
    }
    return text;
  };

  const handlePhoneNumberChange = (text: string) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');
    setPhoneNumber(cleaned);
  };

  const handlePhoneNumberSubmit = () => {
    if (phoneNumber.length < 10) {
      // Show error animation for invalid phone number
      shakeAnimation.setValue(0);
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
        easing: Easing.linear,
      }).start(() => {
        Animated.timing(shakeAnimation, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }).start(() => {
          Animated.timing(shakeAnimation, {
            toValue: 0,
            duration: 50,
            useNativeDriver: true,
          }).start();
        });
      });
      
      phoneInputRef.current?.focus();
      Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit phone number');
      return;
    }
    
    handleLogin();
  };

  const handleLogin = async () => {
    if (phoneNumber.length < 10) {
      // Show error animation for invalid phone number
      shakeAnimation.setValue(0);
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
        easing: Easing.linear,
      }).start(() => {
        Animated.timing(shakeAnimation, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }).start(() => {
          Animated.timing(shakeAnimation, {
            toValue: 0,
            duration: 50,
            useNativeDriver: true,
          }).start();
        });
      });
      return;
    }
    
    setIsLoading(true);
    Keyboard.dismiss();
    
    try {
      const formattedPhone = `+1${phoneNumber.replace(/\D/g, '')}`; // US numbers
      const confirmation = await loginWithPhone(formattedPhone);
      
      navigation.navigate('OTPVerification', {
        phoneNumber: formattedPhone,
        verificationId: 'web-sdk-verification' // This is a placeholder, not used in Web SDK
      });
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to send verification code. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestMode = () => {
    // Handle guest mode if needed
    console.log('Guest mode');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Welcome to CareTrek</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter your phone number to continue
            </Text>
          </View>

          <Animated.View 
            style={[
              styles.form,
              {
                transform: [{ translateX: shakeAnimation }],
                borderColor: phoneNumber.length > 0 && phoneNumber.length < 10 ? colors.error : colors.border
              }
            ]}
          >
            <View style={styles.inputContainer}>
              <View style={[styles.countryCode, { borderColor: colors.border }]}>
                <Text style={[styles.countryCodeText, { color: colors.text }]}>+1</Text>
              </View>
              <TextInput
                ref={phoneInputRef}
                style={[
                  styles.phoneInput, 
                  { 
                    color: colors.text, 
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                  }
                ]}
                placeholder="(555) 123-4567"
                placeholderTextColor={colors.textSecondary}
                value={formatPhoneNumber(phoneNumber)}
                onChangeText={handlePhoneNumberChange}
                keyboardType="phone-pad"
                autoFocus
                maxLength={14} // (XXX) XXX-XXXX
                returnKeyType="send"
                onSubmitEditing={handlePhoneNumberSubmit}
              />
            </View>
          </Animated.View>

          <TouchableOpacity
            style={[
              styles.continueButton,
              { 
                backgroundColor: colors.primary,
                opacity: phoneNumber.length >= 10 ? 1 : 0.7,
              }
            ]}
            onPress={handlePhoneNumberSubmit}
            disabled={isLoading || phoneNumber.length < 10}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.continueButtonText}>Continue</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textSecondary }]}>or</Text>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
          </View>

          <TouchableOpacity 
            style={[styles.guestButton, { borderColor: colors.border }]} 
            onPress={handleGuestMode}
            disabled={isLoading}
          >
            <Text style={[styles.guestButtonText, { color: colors.text }]}>Continue as Guest</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              By continuing, you agree to our{' '}
              <Text style={[styles.linkText, { color: colors.primary }]} onPress={() => {}}>
                Terms of Service
              </Text>{' '}
              and{' '}
              <Text style={[styles.linkText, { color: colors.primary }]} onPress={() => {}}>
                Privacy Policy
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  form: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  countryCode: {
    padding: 16,
    borderWidth: 1,
    borderRightWidth: 0,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    padding: 16,
    borderWidth: 1,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    fontSize: 16,
  },
  continueButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
  },
  guestButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 24,
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  linkText: {
    fontWeight: '600',
  },
});

export default LoginScreen;