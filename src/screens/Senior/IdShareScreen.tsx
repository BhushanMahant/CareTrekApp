import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  Share,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useTheme } from '../../contexts/theme/ThemeContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from '../../contexts/translation/TranslationContext';
import { getOrCreateSeniorId, getFamilyMembers, addFamilyMember, removeFamilyMember } from '../../utils/idManager';

type IdShareScreenNavigationProp = StackNavigationProp<RootStackParamList, 'IdShare'>;

interface FamilyMember {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  role?: string;
}

const IdShareScreen = () => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<IdShareScreenNavigationProp>();
  const [isLoading, setIsLoading] = useState(true);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [email, setEmail] = useState('');
  const [seniorId, setSeniorId] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [id, members] = await Promise.all([
          getOrCreateSeniorId(),
          getFamilyMembers()
        ]);
        setSeniorId(id);
        setFamilyMembers(members);
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleAddFamilyMember = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const name = email.split('@')[0];
      const success = await addFamilyMember(email, name);
      
      if (success) {
        const updatedMembers = await getFamilyMembers();
        setFamilyMembers(updatedMembers);
        setEmail('');
        Alert.alert('Success', 'Family member added successfully');
      } else {
        Alert.alert('Error', 'This email is already added');
      }
    } catch (error) {
      console.error('Error adding family member:', error);
      Alert.alert('Error', 'Failed to add family member');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (id: string) => {
    try {
      await removeFamilyMember(id);
      const updatedMembers = await getFamilyMembers();
      setFamilyMembers(updatedMembers);
    } catch (error) {
      console.error('Error removing family member:', error);
      Alert.alert('Error', 'Failed to remove family member');
    }
  };

  const copyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(seniorId);
      Alert.alert('Copied!', 'Senior ID has been copied to clipboard');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert('Error', 'Failed to copy ID to clipboard');
    }
  };

  const shareViaEmail = async () => {
    try {
      const message = `I'd like to share my CareTrek Senior ID with you. My ID is: ${seniorId}\n\nPlease use this ID to connect with me in the CareTrek app.`;
      const shareOptions = {
        message,
        title: 'Share Senior ID',
        ...(Platform.OS === 'android' && { subject: 'CareTrek Senior ID' }),
      };
      await Share.share(shareOptions);
    } catch (error) {
      Alert.alert('Error', 'Failed to share ID. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}
      >
        {/* <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Share ID
          </Text>
        </View> */}

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Your Senior ID
            </Text>
            <View style={styles.idContainer}>
              <Text style={[styles.seniorId, { color: colors.text }]}>
                {seniorId || 'Generating ID...'}
              </Text>
              <TouchableOpacity 
                onPress={copyToClipboard} 
                style={[styles.copyButton, { backgroundColor: colors.primary + '20' }]}
                accessibilityLabel="Copy ID to clipboard"
              >
                <MaterialCommunityIcons
                  name="content-copy"
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={shareViaEmail}
                accessibilityLabel="Share ID"
              >
                <Ionicons name="share-social" size={18} color="#FFFFFF" />
                <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>
                  Share
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.helperText, { color: colors.textSecondary }]}>
              Share this ID with family members to connect with you
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Add Family Member
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: colors.inputBackground,
                    color: colors.text,
                    borderColor: colors.border
                  },
                ]}
                placeholder="Enter email address"
                placeholderTextColor={colors.placeholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleAddFamilyMember}
              />
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.primary }]}
                onPress={handleAddFamilyMember}
                disabled={isLoading || !email.trim()}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Ionicons name="add" size={24} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Family Members
            </Text>
            {familyMembers.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No family members added yet
              </Text>
            ) : (
              familyMembers.map((member) => (
                <View 
                  key={member.id} 
                  style={[styles.memberItem, { borderBottomColor: colors.border }]}
                >
                  <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, { color: colors.text }]}>
                      {member.name}
                    </Text>
                    <Text style={[styles.memberEmail, { color: colors.textSecondary }]}>
                      {member.email}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => handleRemoveMember(member.id)}
                    style={styles.removeButton}
                    accessibilityLabel={`Remove ${member.name}`}
                  >
                    <MaterialCommunityIcons
                      name="account-remove"
                      size={24}
                      color={colors.error || '#E53E3E'}
                    />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 16,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  seniorId: {
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginRight: 12,
    flex: 1,
  },
  copyButton: {
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
  },
  actionButtonText: {
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 16,
  },
  helperText: {
    fontSize: 14,
    marginTop: 8,
    opacity: 0.8,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 16,
    fontSize: 16,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  memberInfo: {
    flex: 1,
    marginRight: 8,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 14,
    opacity: 0.8,
  },
  removeButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default IdShareScreen;