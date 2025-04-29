import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Easing,
  Image,
  Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingIndicator, setTypingIndicator] = useState('Typing');
  const [isLoading, setIsLoading] = useState(true);
  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const insets = useSafeAreaInsets();
  
  // Animation values
  const typingAnim = useRef(new Animated.Value(0)).current;
  const sendButtonScale = useRef(new Animated.Value(1)).current;
  const messageOpacity = useRef(new Animated.Value(0)).current;

  // Load messages on mount
  useEffect(() => {
    const loadData = async () => {
      await loadMessages();
      setIsLoading(false);
      Animated.timing(messageOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    };
    loadData();
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Typing indicator animation
  useEffect(() => {
    if (isTyping) {
      const interval = setInterval(() => {
        setTypingIndicator(prev => 
          prev.length < 10 ? prev + '.' : 'Typing'
        );
      }, 500);

      // Bounce animation for typing indicator
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(typingAnim, {
            toValue: 0,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      return () => clearInterval(interval);
    } else {
      typingAnim.setValue(0);
    }
  }, [isTyping]);

  const loadMessages = async () => {
    try {
      const savedMessages = await AsyncStorage.getItem('chatMessages');
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      } else {
        const initialMessage = {
          id: '1',
          text: 'Hello! I\'m your Bookie assistant. How can I help you today?',
          sender: 'bot',
          timestamp: new Date().toISOString(),
          quickReplies: [
            { title: 'Tell me a joke', payload: 'Tell me a joke' },
            { title: 'Need Help', payload: 'Help' },
            { title: 'Suggestions', payload: 'What can you do?' }
          ]
        };
        setMessages([initialMessage]);
        await AsyncStorage.setItem('chatMessages', JSON.stringify([initialMessage]));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const saveMessages = async (newMessages) => {
    try {
      await AsyncStorage.setItem('chatMessages', JSON.stringify(newMessages));
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  };

  const handleSend = async (text = inputText) => {
    if (text.trim() === '') return;

    // Play haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMessage = {
      id: Date.now().toString(),
      text: text,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    await saveMessages(updatedMessages);
    setInputText('');
    setIsTyping(true);

    // Animate send button
    Animated.sequence([
      Animated.timing(sendButtonScale, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(sendButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      generateAIResponse(text, updatedMessages);
    }, 1000 + Math.random() * 1000); // Random delay for more natural feel
  };

  const generateAIResponse = async (userInput, currentMessages) => {
    try {
      let response;
      
      // Simple response logic - can be replaced with actual API call
      if (userInput.toLowerCase().includes('joke')) {
        const jokes = [
          "Why don't scientists trust atoms? Because they make up everything!",
          "Did you hear about the mathematician who's afraid of negative numbers? He'll stop at nothing to avoid them!",
          "Why don't skeletons fight each other? They don't have the guts!"
        ];
        response = jokes[Math.floor(Math.random() * jokes.length)];
      } else if (userInput.toLowerCase().includes('help')) {
        response = "I can help with general questions, tell jokes, or just chat. What would you like to know?";
      } else if (userInput.toLowerCase().includes('thank')) {
        response = "You're welcome! 😊 Is there anything else I can help with?";
      } else {
        const responses = [
          "I'm here to help! 😊",
          "That's an interesting thought!",
          "Let's figure it out together!",
          "Could you elaborate a bit more?",
          "Thank you for reaching out!",
          "Learning every day, just like you!"
        ];
        response = responses[Math.floor(Math.random() * responses.length)];
      }
      
      const botMessage = {
        id: Date.now().toString() + '-bot',
        text: response,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        quickReplies: [
          { title: 'Another Question', payload: 'I have another question' },
          { title: 'Thanks!', payload: 'Thanks!' },
          { title: 'More Info', payload: 'Tell me more' }
        ]
      };

      const updatedMessages = [...currentMessages, botMessage];
      setMessages(updatedMessages);
      await saveMessages(updatedMessages);
    } catch (error) {
      console.error('Error generating AI response:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    
    Alert.alert(
      'Clear Conversation',
      'Are you sure you want to clear the chat history?',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => Haptics.selectionAsync()
        },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await AsyncStorage.removeItem('chatMessages');
            setMessages([]);
            loadMessages(); // reload initial greeting
          }
        }
      ]
    );
  };

  const renderMessage = ({ item, index }) => {
    const isUser = item.sender === 'user';
    const isFirstInGroup = index === 0 || messages[index - 1].sender !== item.sender;
    const isLastInGroup = index === messages.length - 1 || messages[index + 1].sender !== item.sender;

    return (
      <Animated.View 
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.botMessage,
          {
            opacity: messageOpacity,
            marginTop: isFirstInGroup ? 12 : 4,
            marginBottom: isLastInGroup ? 12 : 4,
          }
        ]}
      >
        {!isUser && isFirstInGroup && (
          <View style={styles.botAvatar}>
            <Image 
              source={require('../../assets/icons/bot.png')} 
              style={styles.avatarImage}
            />
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.botBubble,
          isFirstInGroup && (isUser ? styles.userFirstBubble : styles.botFirstBubble),
          isLastInGroup && (isUser ? styles.userLastBubble : styles.botLastBubble),
        ]}>
          <Text style={[
            styles.messageText,
            isUser ? styles.userMessageText : styles.botMessageText
          ]}>
            {item.text}
          </Text>
          
          <View style={[
            styles.timestampContainer,
            isUser ? styles.userTimestamp : styles.botTimestamp
          ]}>
            <Text style={styles.timestamp}>
              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {isUser && (
              <MaterialIcons 
                name={item.text.length > 30 ? 'done-all' : 'done'} 
                size={14} 
                color="#ffffff90" 
                style={styles.readReceipt} 
              />
            )}
          </View>
        </View>

        {/* Render quick replies if any */}
        {!isUser && isLastInGroup && item.quickReplies && (
          <View style={styles.quickRepliesContainer}>
            {item.quickReplies.map((reply, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickReplyButton}
                onPress={() => handleSend(reply.payload)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickReplyText}>{reply.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Animated.View>
    );
  };

  const renderTypingIndicator = () => {
    const dots = [0, 1, 2];
    
    return (
      <Animated.View style={[
        styles.messageContainer,
        styles.botMessage,
        { 
          transform: [
            {
              translateY: typingAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -5]
              })
            }
          ]
        }
      ]}>
        <View style={styles.botAvatar}>
          <Image 
            source={require('../../assets/icons/bot.png')} 
            style={styles.avatarImage}
          />
        </View>
        <View style={[styles.messageBubble, styles.botBubble]}>
          <View style={styles.typingDotsContainer}>
            {dots.map((i) => (
              <Animated.View
                key={i}
                style={[
                  styles.typingDot,
                  {
                    transform: [
                      {
                        translateY: typingAnim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0, -5, 0]
                        })
                      }
                    ],
                    opacity: typingAnim.interpolate({
                      inputRange: [0, 0.3, 1],
                      outputRange: [0.5, 1, 0.5]
                    })
                  }
                ]}
              />
            ))}
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerContent}>
          <Image 
            source={require('../../assets/icons/bot.png')} 
            style={styles.headerAvatar}
          />
          <Text style={styles.headerTitle}>AI Assistant</Text>
        </View>
        <TouchableOpacity 
          style={styles.clearButton} 
          onPress={clearChat}
          activeOpacity={0.7}
        >
          <Feather name="trash-2" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        />
      )}

      {isTyping && renderTypingIndicator()}

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.bottom + 10 : 0}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
            enablesReturnKeyAutomatically
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
          />
          <TouchableOpacity 
            style={styles.attachmentButton}
            activeOpacity={0.7}
          >
            <Ionicons name="attach" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
        
        <Animated.View style={{ transform: [{ scale: sendButtonScale }] }}>
          <TouchableOpacity 
            style={[
              styles.sendButton, 
              { backgroundColor: inputText ? '#007AFF' : '#ccc' }
            ]} 
            onPress={() => handleSend()}
            disabled={!inputText}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color="#fff" 
            />
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#fff',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  clearButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6c757d',
  },
  messagesList: {
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: '90%',
  },
  botAvatar: {
    marginRight: 8,
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  messageBubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  botBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  botFirstBubble: {
    borderTopLeftRadius: 18,
  },
  botLastBubble: {
    borderBottomLeftRadius: 18,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  userFirstBubble: {
    borderTopRightRadius: 18,
  },
  userLastBubble: {
    borderBottomRightRadius: 18,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  botMessageText: {
    color: '#212529',
  },
  userMessageText: {
    color: '#fff',
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  botTimestamp: {
    justifyContent: 'flex-start',
  },
  userTimestamp: {
    justifyContent: 'flex-end',
  },
  timestamp: {
    fontSize: 11,
    color: '#6c757d',
  },
  readReceipt: {
    marginLeft: 4,
  },
  quickRepliesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginLeft: 40, // Align with bot message
  },
  quickReplyButton: {
    backgroundColor: '#e9ecef',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  quickReplyText: {
    fontSize: 14,
    color: '#212529',
  },
  typingDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6c757d',
    marginHorizontal: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3f5',
    borderRadius: 20,
    paddingLeft: 12,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    fontSize: 16,
    paddingVertical: 10,
    paddingRight: 12,
    color: '#212529',
  },
  attachmentButton: {
    padding: 8,
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

export default Chatbot;