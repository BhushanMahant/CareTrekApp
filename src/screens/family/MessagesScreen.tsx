import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/en';

dayjs.extend(relativeTime);

type RootStackParamList = {
  Messages: {
    seniorId: string;
    seniorName?: string;
    seniorAvatar?: string;
    status?: 'online' | 'offline' | 'alert';
  };
  SeniorDetail: { seniorId: string };
};

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'senior';
  timestamp: Date;
  read: boolean;
};

type Senior = {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'offline' | 'alert';
  lastSeen?: Date;
};

// Defensive theme color extractor (handles objects or strings)
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

const MessagesScreen: React.FC = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'Messages'>>();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { width } = useWindowDimensions();
  const themeHook: any = useTheme();
  const { t } = useTranslation();

  // Defensive theme extraction
  const isDark = !!themeHook?.isDark;
  const colorsObj = themeHook?.colors ?? themeHook?.theme ?? themeHook ?? {};
  const bgColor = extractColor(colorsObj.background, isDark ? '#0f172a' : '#ffffff');
  const cardColor = extractColor(colorsObj.card, isDark ? '#1F2937' : '#FFFFFF');
  const textColor = extractColor(colorsObj.text, isDark ? '#E2E8F0' : '#1A202C');
  const primaryColor = extractColor(colorsObj.primary, isDark ? '#4FD1C5' : '#2C7A7B');
  const borderColor = extractColor(colorsObj.border, isDark ? '#2D3748' : 'rgba(0,0,0,0.06)');
  const inputBg = extractColor(colorsObj.background, isDark ? '#1F2937' : '#F3F4F6');
  const inputText = extractColor(colorsObj.text, isDark ? '#E5E7EB' : '#1F2937');
  const tertiaryText = extractColor(colorsObj.textSecondary ?? colorsObj.textTertiary, isDark ? '#9CA3AF' : '#6B7280');

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [senior, setSenior] = useState<Senior | null>(() => ({
    id: route.params.seniorId,
    name: route.params.seniorName || t('Senior'),
    avatar: route.params.seniorAvatar,
    status: route.params.status || 'offline',
    lastSeen: new Date(),
  }));

  // i18n fallbacks
  const strings = {
    back: t('Back') || 'Back',
    typeMessage: t('Type a message...') || 'Type a message...',
    online: t('Online') || 'Online',
    offline: t('Offline') || 'Offline',
    needsAttention: t('Needs Attention') || 'Needs Attention',
    errorLoading: t('Error loading messages') || 'Error loading messages',
    retry: t('Retry') || 'Retry',
    noMessages: t('No messages yet') || 'No messages yet',
    startConversation: t('Start a conversation with {name}') || 'Start a conversation with {name}',
    today: t('Today') || 'Today',
    yesterday: t('Yesterday') || 'Yesterday',
    send: t('Send') || 'Send',
    error: t('Error') || 'Error',
    failedToSend: t('Failed to send message') || 'Failed to send message',
    them: t('them') || 'them',
  };

  // Fetch messages (mock)
  const fetchMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      await new Promise((r) => setTimeout(r, 700));
      // Mock: start with an example conversation or empty list
      const mock: Message[] = [
        {
          id: 'm1',
          text: 'Hello — how are you today?',
          sender: 'senior',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
          read: true,
        },
        {
          id: 'm2',
          text: 'I am fine, thank you!',
          sender: 'user',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 23.5),
          read: true,
        },
      ];
      setMessages(mock);
    } catch (err) {
      console.error('Error fetching messages:', err);
      Alert.alert(strings.error, strings.errorLoading);
    } finally {
      setIsLoading(false);
    }
  }, [strings.error, strings.errorLoading]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Helpers
  const formatTime = useCallback((date: Date) => dayjs(date).format('h:mm A'), []);
  const formatDateHeader = useCallback(
    (date: Date) => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (dayjs(date).isSame(today, 'day')) return strings.today;
      if (dayjs(date).isSame(yesterday, 'day')) return strings.yesterday;
      return dayjs(date).format('MMMM D, YYYY');
    },
    [strings.today, strings.yesterday]
  );

  // Group messages by date (memoized)
  const groupedMessages = useMemo(() => {
    const groups: { [key: string]: Message[] } = {};
    messages.forEach((msg) => {
      const key = dayjs(msg.timestamp).format('YYYY-MM-DD');
      if (!groups[key]) groups[key] = [];
      groups[key].push(msg);
    });
    // Sort dates descending (older first or as you prefer)
    const entries = Object.entries(groups).sort((a, b) => dayjs(a[0]).unix() - dayjs(b[0]).unix());
    return entries.map(([date, msgs]) => ({ date: new Date(date), messages: msgs }));
  }, [messages]);

  // Send message handler
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || isSending) return;
    const text = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    // optimistic add
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = { id: tempId, text, sender: 'user', timestamp: new Date(), read: true };
    setMessages((p) => [...p, optimistic]);

    try {
      // simulate network
      await new Promise((r) => setTimeout(r, 500));
      // replace temp id
      setMessages((p) => p.map((m) => (m.id === tempId ? { ...m, id: Date.now().toString() } : m)));

      // simulate reply
      setIsTyping(true);
      setTimeout(() => {
        const reply: Message = {
          id: Date.now().toString(),
          text: t("Thanks for your message! I'll get back to you soon.") || "Thanks for your message! I'll get back to you soon.",
          sender: 'senior',
          timestamp: new Date(),
          read: true,
        };
        setMessages((p) => [...p, reply]);
        setIsTyping(false);
      }, 1200);
    } catch (err) {
      console.error('Send failed:', err);
      setNewMessage(text); // restore to allow retry
      Alert.alert(strings.error, strings.failedToSend);
    } finally {
      setIsSending(false);
    }
  }, [newMessage, isSending, t, strings.error, strings.failedToSend]);

  // Render single message (uses the group's messages array to decide avatar suppression)
  const renderMessageItem = useCallback(
    (message: Message, index: number, groupMessages: Message[]) => {
      const isUser = message.sender === 'user';
      const prev = index > 0 ? groupMessages[index - 1] : null;
      const showAvatar = !isUser && (!prev || prev.sender !== message.sender || dayjs(message.timestamp).diff(prev.timestamp, 'minute') > 5);

      return (
        <View key={message.id} style={[styles.messageContainer, isUser ? styles.userMessageContainer : styles.seniorMessageContainer]}>
          {!isUser && showAvatar ? (
            senior?.avatar ? (
              <Image source={{ uri: senior.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: isDark ? '#374151' : '#E2E8F0', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="person" size={18} color={tertiaryText} />
              </View>
            )
          ) : (
            !isUser && <View style={{ width: 40 }} />
          )}

          <View
            style={[
              styles.messageBubble,
              {
                backgroundColor: isUser ? primaryColor : cardColor,
                marginLeft: isUser ? 40 : 0,
                marginRight: isUser ? 0 : 40,
                maxWidth: width * 0.75,
              },
              isUser ? styles.userBubble : styles.seniorBubble,
            ]}
          >
            <Text style={[styles.messageText, { color: isUser ? '#fff' : textColor }]}>{message.text}</Text>

            <View style={styles.messageTimeContainer}>
              <Text style={[styles.messageTime, { color: isUser ? 'rgba(255,255,255,0.8)' : tertiaryText }]}>{formatTime(message.timestamp)}</Text>
              {isUser && (
                <MaterialIcons name={message.read ? 'done-all' : 'done'} size={14} color={message.read ? '#86EFAC' : 'rgba(255,255,255,0.7)'} style={{ marginLeft: 6 }} />
              )}
            </View>
          </View>
        </View>
      );
    },
    [senior, isDark, tertiaryText, primaryColor, cardColor, width, textColor, formatTime]
  );

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={textColor} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerContent}
          onPress={() => navigation.navigate('SeniorDetail', { seniorId: senior?.id || '' })}
        >
          {senior?.avatar ? (
            <Image source={{ uri: senior.avatar }} style={styles.headerAvatar} />
          ) : (
            <View style={[styles.headerAvatar, { backgroundColor: isDark ? '#374151' : '#E2E8F0', justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="person" size={20} color={tertiaryText} />
            </View>
          )}
          <View style={{ marginLeft: 10 }}>
            <Text style={[styles.userName, { color: textColor }]}>{senior?.name}</Text>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: senior?.status === 'online' ? '#10B981' : senior?.status === 'alert' ? '#EF4444' : '#9CA3AF',
                  },
                ]}
              />
              <Text style={[styles.statusText, { color: tertiaryText }]}>
                {senior?.status === 'online' ? strings.online : senior?.status === 'alert' ? strings.needsAttention : strings.offline}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconButton}>
            <Ionicons name="call" size={20} color={textColor} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconButton}>
            <Ionicons name="videocam" size={20} color={textColor} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages list grouped by date */}
      <FlatList
        data={groupedMessages}
        keyExtractor={(g) => g.date.toISOString()}
        contentContainerStyle={styles.messagesList}
        renderItem={({ item: group }) => (
          <View key={group.date.toISOString()}>
            <View style={styles.dateHeaderContainer}>
              <Text style={[styles.dateHeader, { backgroundColor: cardColor, color: tertiaryText }]}>{formatDateHeader(group.date)}</Text>
            </View>

            {group.messages.map((m, idx) => renderMessageItem(m, idx, group.messages))}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="message-text-outline" size={64} color={tertiaryText} />
            <Text style={[styles.emptyText, { color: tertiaryText }]}>{strings.noMessages}</Text>
            <Text style={[styles.emptySubtext, { color: tertiaryText, opacity: 0.7 }]}>
              {strings.startConversation.replace('{name}', senior?.name || strings.them)}
            </Text>
          </View>
        }
      />

      {/* Typing indicator */}
      {isTyping && (
        <View style={styles.typingContainer}>
          <View style={[styles.typingBubble, { backgroundColor: cardColor }]}>
            <View style={[styles.typingDot, { backgroundColor: tertiaryText }]} />
            <View style={[styles.typingDot, { backgroundColor: tertiaryText, marginHorizontal: 6 }]} />
            <View style={[styles.typingDot, { backgroundColor: tertiaryText }]} />
          </View>
        </View>
      )}

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <View style={[styles.inputContainer, { borderTopColor: borderColor, backgroundColor: cardColor }]}>
          <TouchableOpacity style={styles.attachmentButton}>
            <Ionicons name="attach" size={22} color={tertiaryText} />
          </TouchableOpacity>

          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: inputText, borderColor }]}
            placeholder={strings.typeMessage}
            placeholderTextColor={tertiaryText}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: newMessage.trim() ? primaryColor : tertiaryText, opacity: newMessage.trim() ? 1 : 0.6 },
            ]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1 },
  backButton: { padding: 8 },
  headerContent: { flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 8 },
  headerAvatar: { width: 44, height: 44, borderRadius: 22 },
  userName: { fontSize: 16, fontWeight: '600' },
  statusContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  headerIconButton: { padding: 8, marginLeft: 8 },

  messagesList: { paddingHorizontal: 12, paddingBottom: 12 },
  dateHeaderContainer: { alignItems: 'center', marginVertical: 12 },
  dateHeader: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, fontSize: 12, fontWeight: '500' },

  messageContainer: { marginBottom: 8, flexDirection: 'row', alignItems: 'flex-end' },
  userMessageContainer: { justifyContent: 'flex-end' },
  seniorMessageContainer: { justifyContent: 'flex-start' },

  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 8 },
  messageBubble: { padding: 10, borderRadius: 14 },
  userBubble: { borderTopRightRadius: 6, borderBottomLeftRadius: 14, borderBottomRightRadius: 14 },
  seniorBubble: { borderTopLeftRadius: 6, borderBottomRightRadius: 14, borderBottomLeftRadius: 14 },
  messageText: { fontSize: 16, lineHeight: 20 },
  messageTimeContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 6, justifyContent: 'flex-end' },
  messageTime: { fontSize: 10 },

  typingContainer: { paddingHorizontal: 16, marginBottom: 8 },
  typingBubble: { padding: 10, borderRadius: 16, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center' },
  typingDot: { width: 6, height: 6, borderRadius: 3, opacity: 0.8, marginHorizontal: 2 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: 12 },
  emptySubtext: { fontSize: 14, marginTop: 8 },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
  },
  attachmentButton: { padding: 8, marginRight: 8 },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 140,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    fontSize: 16,
  },
  sendButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
});

export default MessagesScreen;
