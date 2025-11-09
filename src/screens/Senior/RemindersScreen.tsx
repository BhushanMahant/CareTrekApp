// RemindersScreen.tsx
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Switch,
  Alert,
  Vibration,
  Platform,
  TextInput,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useTheme } from '../../contexts/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../../contexts/translation/TranslationContext';
import { useCachedTranslation } from '../../hooks/useCachedTranslation';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Notification handler (foreground behavior)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

type Reminder = {
  id: string;
  title: string;
  time: string; // "hh:mm AM/PM"
  date: Date;
  type: 'medication' | 'activity';
  enabled: boolean;
  notificationId?: string | null;
};

type RemindersScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Reminders'>;
const STORAGE_KEY = '@CareTrek/reminders';

// Haptics / vibration helper
const triggerNotificationFeedback = async () => {
  try {
    if (Platform.OS === 'ios') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      }, 120);
    } else {
      Vibration.vibrate([0, 300, 200, 300], false);
    }
  } catch (e) {
    console.warn('Haptic error', e);
    Vibration.vibrate(300);
  }
};

// Helper: parse "hh:mm AM/PM" to {hours, minutes}
const parseTimeString = (timeStr = '08:00 AM') => {
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return { hours, minutes };
};

// Helper: convert "hh:mm AM/PM" to Date (next occurrence)
const timeStringToDate = (timeStr = '08:00 AM') => {
  const now = new Date();
  const { hours, minutes } = parseTimeString(timeStr);
  const d = new Date(now);
  d.setHours(hours, minutes, 0, 0);
  if (d <= now) d.setDate(d.getDate() + 1);
  return d;
};

const RemindersScreen: React.FC = () => {
  const navigation = useNavigation<RemindersScreenNavigationProp>();
  const { isDark } = useTheme();
  const { currentLanguage } = useTranslation();

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [newReminder, setNewReminder] = useState<Partial<Reminder>>({
    title: '',
    time: '08:00 AM',
    date: new Date(),
    type: 'medication',
    enabled: true,
  });
  const [isFormVisible, setIsFormVisible] = useState(false);

  // Persist reminders
  const saveReminders = useCallback(async (updatedReminders: Reminder[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReminders));
    } catch (e) {
      console.error('saveReminders error', e);
    }
  }, []);

  // Schedule a notification for a reminder (returns notificationId or null)
  const scheduleNotification = useCallback(
    async (reminder: Reminder) => {
      try {
        // Request/check permissions
        const permission = await Notifications.getPermissionsAsync();
        if (permission.status !== 'granted') {
          const req = await Notifications.requestPermissionsAsync();
          if (req.status !== 'granted') {
            console.warn('Notifications permission denied');
            return null;
          }
        }

        // Create Android channel if needed
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('reminders', {
            name: 'Reminders',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 300, 200, 300],
            enableVibrate: true,
            sound: 'default',
          });
        }

        // Cancel existing scheduled notification for this reminder if exists
        if (reminder.notificationId) {
          try {
            await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
          } catch (e) {
            // ignore
          }
        }

        // Compute next occurrence
        const scheduledDate = timeStringToDate(reminder.time);

        // Schedule daily repeating notification at hour/minute
        const trigger: any = {
          hour: scheduledDate.getHours(),
          minute: scheduledDate.getMinutes(),
          repeats: true,
        };

        const content: any = {
          title: `CareTrek Reminder: ${reminder.title || 'Reminder'}`,
          body: `Time for your ${reminder.type === 'medication' ? 'medication' : 'activity'}.`,
          data: { reminderId: reminder.id },
          sound: 'default',
        };

        if (Platform.OS === 'android') {
          content.channelId = 'reminders';
        }

        const notificationId = await Notifications.scheduleNotificationAsync({
          content,
          trigger,
        });

        // Save notificationId functionally
        setReminders(prev => {
          const updated = prev.map(r => (r.id === reminder.id ? { ...r, notificationId } : r));
          saveReminders(updated).catch(() => {});
          return updated;
        });

        // small feedback
        triggerNotificationFeedback();

        return notificationId;
      } catch (e) {
        console.warn('scheduleNotification error', e);
        return null;
      }
    },
    [saveReminders]
  );

  // Load reminders from storage; schedule ones lacking notificationId
  const loadReminders = useCallback(async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (!json) return;
      const parsed = JSON.parse(json) as any[];
      const normalized: Reminder[] = parsed.map(r => ({ ...r, date: r.date ? new Date(r.date) : new Date() }));
      setReminders(normalized);

      // schedule enabled reminders missing notificationId
      normalized.forEach(rem => {
        if (rem.enabled && !rem.notificationId) {
          scheduleNotification(rem).catch(() => {});
        }
      });
    } catch (e) {
      console.error('loadReminders error', e);
    }
  }, [scheduleNotification]);

  // Stop (disable) a reminder
  const handleStopReminder = useCallback(
    async (reminderId: string) => {
      setReminders(prev => {
        const updated = prev.map(r => (r.id === reminderId ? { ...r, enabled: false } : r));
        saveReminders(updated).catch(() => {});
        return updated;
      });

      // cancel scheduled notification if present (read latest state after the update)
      const target = reminders.find(r => r.id === reminderId);
      if (target?.notificationId) {
        try {
          await Notifications.cancelScheduledNotificationAsync(target.notificationId);
          setReminders(prev => {
            const updated = prev.map(r => (r.id === reminderId ? { ...r, notificationId: null } : r));
            saveReminders(updated).catch(() => {});
            return updated;
          });
        } catch (e) {
          console.warn('Failed to cancel scheduled notification on stop', e);
        }
      }
    },
    [reminders, saveReminders]
  );

  // Snooze once for X minutes
  const handleSnoozeReminder = useCallback(
    async (reminderId: string, minutes: number) => {
      const reminder = reminders.find(r => r.id === reminderId);
      if (!reminder) return;

      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Snoozed: ${reminder.title || 'Reminder'}`,
            body: `Snoozed for ${minutes} minutes`,
            data: { reminderId: reminder.id, isSnoozed: true },
            sound: 'default',
          },
          trigger: { seconds: minutes * 60 } as any,
        });
      } catch (e) {
        console.warn('Snooze failed', e);
      }
    },
    [reminders]
  );

  // Show action choices when tapping notification
  const showReminderActions = useCallback(
    (reminderId: string) => {
      Alert.alert('Reminder', 'What would you like to do?', [
        {
          text: 'Stop Reminder',
          style: 'destructive',
          onPress: () => handleStopReminder(reminderId),
        },
        {
          text: 'Snooze 5m',
          onPress: () => handleSnoozeReminder(reminderId, 5),
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    },
    [handleStopReminder, handleSnoozeReminder]
  );

  // Setup notification listeners
  const setupNotificationListeners = useCallback(() => {
    // Foreground: play feedback
    notificationListener.current = Notifications.addNotificationReceivedListener(n => {
      // Quick feedback
      triggerNotificationFeedback();
      if (Platform.OS === 'android') Vibration.vibrate([0, 300, 200], false);
    });

    // When user taps notification or action
    responseListener.current = Notifications.addNotificationResponseReceivedListener(async response => {
      const reminderId = response.notification.request.content.data?.reminderId;
      const actionId = response.actionIdentifier;

      // feedback
      await triggerNotificationFeedback();

      // If action buttons used (iOS/Android), interpret them:
      if (actionId === 'complete') {
        if (reminderId) handleStopReminder(reminderId.toString());
        return;
      } else if (actionId === 'snooze') {
        if (reminderId) handleSnoozeReminder(reminderId.toString(), 5);
        return;
      }

      // default - open actions
      if (reminderId) showReminderActions(reminderId.toString());
    });

    // return cleanup (optional)
    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
      notificationListener.current = null;
      responseListener.current = null;
    };
  }, [handleStopReminder, handleSnoozeReminder, showReminderActions]);

  // Cleanup helper
  const cleanupNotificationListeners = useCallback(() => {
    try {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    } catch (e) {
      // ignore
    } finally {
      notificationListener.current = null;
      responseListener.current = null;
    }
  }, []);

  // Focus effect
  useFocusEffect(
    useCallback(() => {
      loadReminders();
      const cleanup = setupNotificationListeners();
      return () => {
        cleanup();
        cleanupNotificationListeners();
      };
    }, [loadReminders, setupNotificationListeners, cleanupNotificationListeners])
  );

  // Toggle enabled
  const toggleReminder = async (id: string) => {
    setReminders(prev => {
      const updated = prev.map(r => (r.id === id ? { ...r, enabled: !r.enabled } : r));
      saveReminders(updated).catch(() => {});
      return updated;
    });

    // Read current state to decide schedule/cancel
    const toggled = reminders.find(r => r.id === id);
    if (!toggled) return;

    if (!toggled.enabled) {
      // was disabled -> now enabled
      await scheduleNotification({ ...toggled, enabled: true });
    } else {
      // was enabled -> now disabled
      if (toggled.notificationId) {
        try {
          await Notifications.cancelScheduledNotificationAsync(toggled.notificationId);
          setReminders(prev => {
            const updated = prev.map(r => (r.id === id ? { ...r, notificationId: null } : r));
            saveReminders(updated).catch(() => {});
            return updated;
          });
        } catch (e) {
          console.warn('Cancel scheduled failed', e);
        }
      }
    }
  };

  // Add reminder
  const addReminder = async () => {
    if (!newReminder.title || !newReminder.title.trim()) {
      Alert.alert('Error', 'Please enter a title for the reminder');
      return;
    }

    const reminder: Reminder = {
      id: Date.now().toString(),
      title: newReminder.title!.trim(),
      time: newReminder.time || '08:00 AM',
      date: newReminder.date || timeStringToDate(newReminder.time || '08:00 AM'),
      type: (newReminder.type as 'medication' | 'activity') || 'medication',
      enabled: newReminder.enabled ?? true,
      notificationId: null,
    };

    // Add & persist
    setReminders(prev => {
      const updated = [...prev, reminder];
      saveReminders(updated).catch(() => {});
      return updated;
    });

    // Schedule
    await scheduleNotification(reminder);

    // reset & close
    setNewReminder({ title: '', time: '08:00 AM', date: new Date(), type: 'medication', enabled: true });
    setIsFormVisible(false);
    Alert.alert('Success', 'Reminder added');
  };

  // Update existing reminder
  const updateReminder = async () => {
    if (!editingReminder) return;
    if (!editingReminder.title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    const updatedReminder: Reminder = {
      ...editingReminder,
      date: editingReminder.date ? new Date(editingReminder.date) : timeStringToDate(editingReminder.time),
    };

    // Update state & persist
    setReminders(prev => {
      const updated = prev.map(r => (r.id === updatedReminder.id ? updatedReminder : r));
      saveReminders(updated).catch(() => {});
      return updated;
    });

    if (updatedReminder.enabled) {
      await scheduleNotification(updatedReminder);
    } else if (updatedReminder.notificationId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(updatedReminder.notificationId);
        setReminders(prev => {
          const cleared = prev.map(r => (r.id === updatedReminder.id ? { ...r, notificationId: null } : r));
          saveReminders(cleared).catch(() => {});
          return cleared;
        });
      } catch (e) {
        console.warn('Cancel failed on update', e);
      }
    }

    setEditingReminder(null);
    setIsFormVisible(false);
    Alert.alert('Success', 'Reminder updated');
  };

  // Delete reminder
  const deleteReminder = (id: string) => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const target = reminders.find(r => r.id === id);
            if (target?.notificationId) {
              try {
                await Notifications.cancelScheduledNotificationAsync(target.notificationId);
              } catch (e) {
                console.warn('Cancel on delete failed', e);
              }
            }
            const updated = reminders.filter(r => r.id !== id);
            setReminders(updated);
            await saveReminders(updated);
            Alert.alert('Success', 'Reminder deleted');
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Time picker handlers
  const showTimePickerDialog = () => setShowTimePicker(true);
  const onTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') setShowTimePicker(false);
    if (!selectedDate) return;

    const hours = selectedDate.getHours();
    const minutes = selectedDate.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedTime = `${formattedHours}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;
    const newDate = new Date(selectedDate);

    if (editingReminder) {
      setEditingReminder(prev => ({ ...prev!, time: formattedTime, date: newDate }));
    } else {
      setNewReminder(prev => ({ ...prev, time: formattedTime, date: newDate }));
    }
  };

  const openEditModal = (reminder: Reminder) => {
    setEditingReminder({ ...reminder, date: reminder.date ? new Date(reminder.date) : timeStringToDate(reminder.time) });
    setIsFormVisible(true);
  };
  const closeEditModal = () => {
    setEditingReminder(null);
    setIsFormVisible(false);
  };

  // Translations
  const { translatedText: remindersText } = useCachedTranslation('Reminders', currentLanguage);
  const { translatedText: backText } = useCachedTranslation('Back', currentLanguage);
  const { translatedText: addReminderText } = useCachedTranslation('Add Reminder', currentLanguage);
  const { translatedText: editReminderText } = useCachedTranslation('Edit Reminder', currentLanguage);
  const { translatedText: deleteText } = useCachedTranslation('Delete', currentLanguage);
  const { translatedText: cancelText } = useCachedTranslation('Cancel', currentLanguage);
  const { translatedText: saveText } = useCachedTranslation('Save', currentLanguage);
  const { translatedText: titleText } = useCachedTranslation('Title', currentLanguage);
  const { translatedText: timeText } = useCachedTranslation('Time', currentLanguage);
  const { translatedText: typeText } = useCachedTranslation('Type', currentLanguage);
  const { translatedText: medicationText } = useCachedTranslation('Medication', currentLanguage);
  const { translatedText: activityText } = useCachedTranslation('Activity', currentLanguage);

  // Render item
  const renderReminder = ({ item }: { item: Reminder }) => (
    <TouchableOpacity
      style={[styles.reminderCard, { backgroundColor: isDark ? '#2D3748' : '#FFFFFF' }]}
      onPress={() => openEditModal(item)}
      activeOpacity={0.8}
    >
      <View style={styles.reminderLeft}>
        <View
          style={[
            styles.reminderIconContainer,
            {
              backgroundColor: item.type === 'medication' ? (isDark ? '#FEB2B233' : '#FED7D7') : (isDark ? '#9AE6B433' : '#C6F6D5'),
            },
          ]}
        >
          <Ionicons
            name={item.type === 'medication' ? 'medkit' : 'walk'}
            size={20}
            color={item.type === 'medication' ? (isDark ? '#FC8181' : '#E53E3E') : (isDark ? '#68D391' : '#38A169')}
          />
        </View>

        <View style={styles.reminderTextContainer}>
          <Text style={[styles.reminderTitle, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>{item.title}</Text>
          <View style={styles.reminderTimeContainer}>
            <Ionicons name="time-outline" size={14} color={isDark ? '#A0AEC0' : '#4A5568'} style={styles.timeIcon} />
            <Text style={[styles.reminderTime, { color: isDark ? '#A0AEC0' : '#4A5568' }]}>{item.time}</Text>
          </View>
        </View>
      </View>

      <View style={styles.reminderActions}>
        <Switch
          value={item.enabled}
          onValueChange={() => toggleReminder(item.id)}
          trackColor={{ false: isDark ? '#4A5568' : '#E2E8F0', true: isDark ? '#48BB78' : '#38A169' }}
          thumbColor="#FFFFFF"
        />
        <TouchableOpacity onPress={() => deleteReminder(item.id)} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={20} color={isDark ? '#FC8181' : '#E53E3E'} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderReminderForm = () => {
    const isEditing = !!editingReminder;
    const formData = (isEditing ? editingReminder : newReminder) as Partial<Reminder>;

    return (
      <View style={[styles.formContainer, { backgroundColor: isDark ? '#1A202C' : '#FFFFFF' }]}>
        <Text style={[styles.formTitle, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>{isEditing ? editReminderText : addReminderText}</Text>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: isDark ? '#E2E8F0' : '#4A5568' }]}>{titleText}</Text>
          <View style={[styles.input, { backgroundColor: isDark ? '#2D3748' : '#EDF2F7' }]}>
            <TextInput
              style={[styles.textInput, { color: isDark ? '#E2E8F0' : '#1A202C' }]}
              value={formData.title || ''}
              onChangeText={text => (isEditing ? setEditingReminder({ ...editingReminder!, title: text }) : setNewReminder({ ...newReminder, title: text }))}
              placeholder="Enter reminder title"
              placeholderTextColor={isDark ? '#718096' : '#A0AEC0'}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: isDark ? '#E2E8F0' : '#4A5568' }]}>{timeText}</Text>
          <TouchableOpacity style={[styles.input, styles.timePickerButton, { backgroundColor: isDark ? '#2D3748' : '#EDF2F7' }]} onPress={showTimePickerDialog}>
            <Ionicons name="time-outline" size={20} color={isDark ? '#E2E8F0' : '#4A5568'} style={styles.timeIcon} />
            <Text style={[styles.timeText, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>{formData.time || '08:00 AM'}</Text>
          </TouchableOpacity>

          {showTimePicker && (
            <DateTimePicker value={formData.date || new Date()} mode="time" display="spinner" onChange={onTimeChange} textColor={isDark ? '#E2E8F0' : '#1A202C'} themeVariant={isDark ? 'dark' : 'light'} />
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: isDark ? '#E2E8F0' : '#4A5568' }]}>{typeText}</Text>
          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[styles.typeButton, formData.type === 'medication' ? { backgroundColor: isDark ? '#2F855A' : '#38A169' } : { backgroundColor: isDark ? '#2D3748' : '#EDF2F7' }]}
              onPress={() => (isEditing ? setEditingReminder({ ...editingReminder!, type: 'medication' }) : setNewReminder({ ...newReminder, type: 'medication' }))}
            >
              <Ionicons name="medkit" size={18} color={formData.type === 'medication' ? '#FFFFFF' : isDark ? '#E2E8F0' : '#4A5568'} />
              <Text style={[styles.typeButtonText, { color: formData.type === 'medication' ? '#FFFFFF' : isDark ? '#E2E8F0' : '#4A5568' }]}>{medicationText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeButton, formData.type === 'activity' ? { backgroundColor: isDark ? '#2F855A' : '#38A169' } : { backgroundColor: isDark ? '#2D3748' : '#EDF2F7' }]}
              onPress={() => (isEditing ? setEditingReminder({ ...editingReminder!, type: 'activity' }) : setNewReminder({ ...newReminder, type: 'activity' }))}
            >
              <Ionicons name="walk" size={18} color={formData.type === 'activity' ? '#FFFFFF' : isDark ? '#E2E8F0' : '#4A5568'} />
              <Text style={[styles.typeButtonText, { color: formData.type === 'activity' ? '#FFFFFF' : isDark ? '#E2E8F0' : '#4A5568' }]}>{activityText}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formButtons}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: isDark ? '#4A5568' : '#E2E8F0' }]}
            onPress={() => {
              if (isEditing) closeEditModal();
              else {
                setNewReminder({ title: '', time: '08:00 AM', date: new Date(), type: 'medication', enabled: true });
                setIsFormVisible(false);
              }
            }}
          >
            <Text style={[styles.cancelButtonText, { color: isDark ? '#E2E8F0' : '#4A5568' }]}>{cancelText}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.saveButton, { backgroundColor: isDark ? '#2F855A' : '#38A169' }]} onPress={isEditing ? updateReminder : addReminder}>
            <Text style={styles.saveButtonText}>{isEditing ? saveText : addReminderText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const handleBack = () => navigation.goBack();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#171923' : '#FFFBEF' }]}>
      <TouchableOpacity style={[styles.backButton, { borderColor: isDark ? '#4A5568' : '#E2E8F0' }]} onPress={handleBack} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={20} color={isDark ? '#E2E8F0' : '#4A5568'} />
        <Text style={[styles.backButtonText, { color: isDark ? '#E2E8F0' : '#4A5568' }]}>{backText}</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? '#2F855A' : '#2F855A' }]}>{remindersText}</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: isDark ? '#2F855A' : '#38A169' }]}
          onPress={() => {
            setNewReminder({ title: '', time: '08:00 AM', date: new Date(), type: 'medication', enabled: true });
            setEditingReminder(null);
            setIsFormVisible(true);
          }}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.addButtonText}>{addReminderText}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={reminders}
        renderItem={renderReminder}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.reminderList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off" size={48} color={isDark ? '#4A5568' : '#A0AEC0'} />
            <Text style={[styles.emptyText, { color: isDark ? '#A0AEC0' : '#4A5568' }]}>No reminders set up yet</Text>
          </View>
        }
      />

      {(isFormVisible || editingReminder) && <View style={styles.modalOverlay}>{renderReminderForm()}</View>}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  backButton: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  backButtonText: { marginLeft: 8, fontSize: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingHorizontal: 16, paddingTop: 8 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2F855A' },
  addButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, justifyContent: 'center' },
  addButtonText: { color: 'white', marginLeft: 6, fontWeight: '500', fontSize: 14 },
  reminderList: { padding: 16, paddingBottom: 24 },
  reminderCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  reminderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  reminderTextContainer: { flex: 1 },
  reminderTimeContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  timeIcon: { marginRight: 4 },
  reminderIconContainer: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  reminderTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  reminderTime: { fontSize: 14, opacity: 0.8 },
  reminderActions: { flexDirection: 'row', alignItems: 'center' },
  deleteButton: { marginLeft: 12, padding: 6 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { marginTop: 16, fontSize: 16, textAlign: 'center' },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  formContainer: { width: '100%', borderRadius: 16, padding: 24, maxWidth: 400, maxHeight: '90%' },
  formTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderRadius: 10, padding: 12, fontSize: 16 },
  textInput: { fontSize: 16, padding: 0 },
  timePickerButton: { flexDirection: 'row', alignItems: 'center' },
  timeText: { marginLeft: 10, fontSize: 16 },
  typeContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  typeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 10, marginHorizontal: 4 },
  typeButtonText: { marginLeft: 8, fontSize: 14, fontWeight: '500' },
  formButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  cancelButton: { flex: 1, borderWidth: 1, borderRadius: 10, padding: 14, alignItems: 'center', marginRight: 12 },
  cancelButtonText: { fontSize: 16, fontWeight: '500' },
  saveButton: { flex: 1, borderRadius: 10, padding: 14, alignItems: 'center' },
  saveButtonText: { color: 'white', fontSize: 16, fontWeight: '500' },
});

export default RemindersScreen;
