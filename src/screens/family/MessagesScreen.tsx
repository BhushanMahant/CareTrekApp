import React, { useState, useEffect } from 'react';
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
  Alert
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/theme/ThemeContext';
import { useTranslation } from '../../contexts/translation/TranslationContext';
import { useCachedTranslation } from '../../hooks/useCachedTranslation';

type RootStackParamList = {
  Messages: { seniorId: string };
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
  avatar: string;
  status: 'online' | 'offline' | 'alert';
};

const MessagesScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'Messages'>>();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { isDark } = useTheme();
  const { currentLanguage } = useTranslation();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [senior, setSenior] = useState<Senior | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  // Translations
  const { translatedText: backText } = useCachedTranslation('Back', currentLanguage);
  const { translatedText: typeMessageText } = useCachedTranslation('Type a message...', currentLanguage);
  const { translatedText: onlineText } = useCachedTranslation('Online', currentLanguage);
  const { translatedText: offlineText } = useCachedTranslation('Offline', currentLanguage);
  const { translatedText: alertText } = useCachedTranslation('Needs Attention', currentLanguage);
  const { translatedText: errorLoadingText } = useCachedTranslation('Error loading messages', currentLanguage);
  const { translatedText: retryText } = useCachedTranslation('Retry', currentLanguage);
  const { translatedText: emptyMessagesText } = useCachedTranslation('No messages yet', currentLanguage);
  const { translatedText: startConversationText } = useCachedTranslation('Start a conversation with {name}', currentLanguage);
  const { translatedText: todayText } = useCachedTranslation('Today', currentLanguage);
  const { translatedText: yesterdayText } = useCachedTranslation('Yesterday', currentLanguage);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock senior data
        const mockSenior: Senior = {
          id: route.params.seniorId,
          name: route.params.seniorId === '1' ? 'John Doe' : 'Jane Smith',
          avatar: route.params.seniorId === '1' 
            ? 'https://randomuser.me/api/portraits/men/1.jpg' 
            : 'https://randomuser.me/api/portraits/women/1.jpg',
          status: 'online'
        };
        
        // Mock messages
        const mockMessages: Message[] = [
          {
            id: '1',
            text: 'Hi there! How are you doing today?',
            sender: 'senior',
            timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
            read: true
          },
          {
            id: '2',
            text: 'I\'m doing well, thanks for asking! How about you?',
            sender: 'user',
            timestamp: new Date(Date.now() - 1000 * 60 * 25), // 25 minutes ago
            read: true
          },
          {
            id: '3',
            text: 'I\'m good too! Just checking in to see if you took your medication.',
            sender: 'senior',
            timestamp: new Date(Date.now() - 1000 * 60 * 20), // 20 minutes ago
            read: true
          },
          {
            id: '4',
            text: 'Yes, I took my morning pills at 8 AM.',
            sender: 'user',
            timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
            read: true
          },
          {
            id: '5',
            text: 'Great! Remember you have a doctor\'s appointment tomorrow at 2 PM.',
            sender: 'senior',
            timestamp: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
            read: true
          },
          {
            id: '6',
            text: 'Thanks for the reminder! I almost forgot.',
            sender: 'user',
            timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
            read: false
          },
        ];
        
        setSenior(mockSenior);
        setMessages(mockMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [route.params.seniorId]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const newMsg: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'user',
      timestamp: new Date(),
      read: false
    };
    
    setMessages([...messages, newMsg]);
    setNewMessage('');
    
    // Simulate typing indicator
    setIsTyping(true);
    
    // Simulate reply after a delay
    setTimeout(() => {
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Thanks for your message! I\'ll get back to you soon.',
        sender: 'senior',
        timestamp: new Date(),
        read: false
      };
      
      setMessages(prev => [...prev, reply]);
      setIsTyping(false);
    }, 2000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return todayText;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return yesterdayText;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isUser = item.sender === 'user';
    const showAvatar = index === 0 || 
      messages[index - 1].sender !== item.sender || 
      (new Date(item.timestamp).getTime() - new Date(messages[index - 1].timestamp).getTime()) > 1000 * 60 * 5; // 5 minutes
    
    const showDate = index === 0 || 
      new Date(item.timestamp).toDateString() !== new Date(messages[index - 1].timestamp).toDateString();
    
    const renderDateSeparator = (date: string) => (
      <View style={styles.dateSeparator}>
        <Text style={[styles.dateText, { backgroundColor: isDark ? '#2D3748' : '#E2E8F0' }]}>
          {date === new Date().toLocaleDateString() ? todayText : 
           date === new Date(Date.now() - 86400000).toLocaleDateString() ? yesterdayText : date}
        </Text>
      </View>
    );

    return (
      <View key={item.id}>
        {showDate && renderDateSeparator(formatDate(new Date(item.timestamp)))}
        
        <View 
          style={[
            styles.messageContainer, 
            isUser ? styles.userMessageContainer : styles.seniorMessageContainer
          ]}
        >
          {!isUser && showAvatar && (
            senior?.avatar ? (
              <Image 
                source={{ uri: senior.avatar }} 
                style={styles.avatar} 
              />
            ) : (
              <View style={[styles.avatar, { backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="person" size={24} color="#718096" />
              </View>
            )
          )}
          
          <View 
            style={[
              styles.messageBubble,
              isUser 
                ? { 
                    backgroundColor: isDark ? '#2F855A' : '#38A169',
                    borderTopRightRadius: 4,
                    marginLeft: 'auto',
                  }
                : { 
                    backgroundColor: isDark ? '#2D3748' : '#E2E8F0',
                    borderTopLeftRadius: 4,
                    marginRight: 'auto',
                  },
              !showAvatar && isUser && { marginLeft: 48 },
              !showAvatar && !isUser && { marginRight: 48 },
            ]}
          >
            <Text 
              style={[
                styles.messageText,
                isUser 
                  ? { color: '#FFFFFF' } 
                  : { color: isDark ? '#E2E8F0' : '#1A202C' }
              ]}
            >
              {item.text}
            </Text>
            <View style={styles.messageTimeContainer}>
              <Text 
                style={[
                  styles.messageTime,
                  isUser 
                    ? { color: 'rgba(255, 255, 255, 0.7)' } 
                    : { color: isDark ? 'rgba(160, 174, 192, 0.7)' : 'rgba(113, 128, 150, 0.7)' }
                ]}
              >
                {formatTime(new Date(item.timestamp))}
              </Text>
              {isUser && (
                <Ionicons 
                  name={item.read ? 'checkmark-done' : 'checkmark'} 
                  size={16} 
                  color={item.read ? '#63B3ED' : 'rgba(255, 255, 255, 0.7)'} 
                  style={styles.readIcon} 
                />
              )}
            </View>
          </View>
          
          {isUser && showAvatar && (
            <View style={[styles.avatar, { backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="person" size={24} color="#718096" />
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;
    
    return (
      <View style={[styles.messageContainer, styles.seniorMessageContainer]}>
        <View style={[styles.avatar, { backgroundColor: isDark ? '#2D3748' : '#E2E8F0', justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="person" size={24} color={isDark ? '#A0AEC0' : '#718096'} />
        </View>
        <View style={[styles.typingBubble, { backgroundColor: isDark ? '#2D3748' : '#E2E8F0' }]}>
          <View style={[styles.typingDot, { backgroundColor: isDark ? '#A0AEC0' : '#718096' }]} />
          <View style={[styles.typingDot, { marginHorizontal: 4, backgroundColor: isDark ? '#A0AEC0' : '#718096' }]} />
          <View style={[styles.typingDot, { backgroundColor: isDark ? '#A0AEC0' : '#718096' }]} />
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#171923' : '#FFFBEF' }]}>
        <ActivityIndicator size="large" color={isDark ? '#48BB78' : '#2F855A'} />
      </View>
    );
  }

  if (!senior) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: isDark ? '#171923' : '#FFFBEF' }]}>
        <Ionicons name="warning" size={48} color={isDark ? '#E53E3E' : '#C53030'} />
        <Text style={[styles.errorText, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>
          {errorLoadingText}
        </Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: isDark ? '#2D3748' : '#E2E8F0' }]}
          onPress={() => setLoading(true)}
        >
          <Text style={[styles.retryButtonText, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>
            {retryText}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#171923' : '#FFFBEF' }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? '#2D3748' : '#E2E8F0' }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={isDark ? '#E2E8F0' : '#1A202C'} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.userInfo}
            onPress={() => navigation.navigate('SeniorDetail', { seniorId: senior.id })}
          >
            {senior.avatar ? (
              <Image 
                source={{ uri: senior.avatar }} 
                style={styles.headerAvatar} 
              />
            ) : (
              <View style={[styles.headerAvatar, { backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="person" size={28} color="#718096" />
              </View>
            )}
            <View>
              <Text style={[styles.userName, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>
                {senior.name}
              </Text>
              <View style={styles.statusContainer}>
                <View 
                  style={[
                    styles.statusDot,
                    { 
                      backgroundColor: senior.status === 'online' 
                        ? '#48BB78' 
                        : senior.status === 'alert' 
                          ? '#E53E3E' 
                          : '#A0AEC0',
                    }
                  ]} 
                />
                <Text style={[styles.statusText, { color: isDark ? '#A0AEC0' : '#718096' }]}>
                  {senior.status === 'online' 
                    ? onlineText 
                    : senior.status === 'alert' 
                      ? alertText 
                      : offlineText}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons 
              name="call" 
              size={22} 
              color={isDark ? '#E2E8F0' : '#1A202C'} 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons 
              name="videocam" 
              size={22} 
              color={isDark ? '#E2E8F0' : '#1A202C'} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <View style={styles.messagesContainer}>
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name="chatbubbles" 
              size={64} 
              color={isDark ? '#4A5568' : '#A0AEC0'} 
            />
            <Text style={[styles.emptyText, { color: isDark ? '#A0AEC0' : '#718096' }]}>
              {emptyMessagesText}
            </Text>
            <Text style={[styles.emptySubtext, { color: isDark ? '#718096' : '#A0AEC0' }]}>
              {startConversationText.replace('{name}', senior.name)}
            </Text>
          </View>
        ) : (
          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesList}
            inverted={false}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={renderTypingIndicator}
          />
        )}
      </View>

      {/* Message Input */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1A202C' : '#FFFFFF' }]}>
          <TouchableOpacity style={styles.attachmentButton}>
            <Ionicons 
              name="attach" 
              size={24} 
              color={isDark ? '#A0AEC0' : '#718096'} 
            />
          </TouchableOpacity>
          
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: isDark ? '#2D3748' : '#F7FAFC',
                color: isDark ? '#E2E8F0' : '#1A202C',
              }
            ]}
            placeholder={typeMessageText}
            placeholderTextColor={isDark ? '#718096' : '#A0AEC0'}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          
          <TouchableOpacity 
            style={[
              styles.sendButton,
              { 
                backgroundColor: newMessage.trim() ? (isDark ? '#48BB78' : '#38A169') : (isDark ? '#2D3748' : '#E2E8F0'),
                opacity: newMessage.trim() ? 1 : 0.7,
              }
            ]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={newMessage.trim() ? '#FFFFFF' : (isDark ? '#A0AEC0' : '#718096')} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBEF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
    color: '#1A202C',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#718096',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
    color: '#718096',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    color: '#A0AEC0',
  },
  messagesList: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
    maxWidth: '80%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  seniorMessageContainer: {
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 4,
    maxWidth: '100%',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageTime: {
    fontSize: 10,
    color: 'rgba(113, 128, 150, 0.7)',
  },
  readIcon: {
    marginLeft: 4,
  },
  typingBubble: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 16,
    marginBottom: 4,
    marginLeft: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    fontSize: 12,
    color: '#718096',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  attachmentButton: {
    padding: 8,
    marginRight: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    fontSize: 16,
    backgroundColor: '#F7FAFC',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});

export default MessagesScreen;
