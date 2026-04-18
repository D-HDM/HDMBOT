import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useTheme } from '../contexts/ThemeContext';
import { messageAPI } from '../services/api';
import ChatList from '../components/messages/ChatList';
import MessageBubble from '../components/messages/MessageBubble';
import MessageInput from '../components/messages/MessageInput';
import ChatHeader from '../components/messages/ChatHeader';
import { FiMessageCircle, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const Messages = () => {
  const { darkMode } = useTheme();
  const { socket, sendMessage, whatsappReady } = useSocket();
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Fetch all conversations
  const fetchChats = async () => {
    try {
      const res = await messageAPI.getAll(1, 200);
      const allMessages = res.data?.data || [];
      
      // Group by conversation
      const chatMap = new Map();
      allMessages.forEach(msg => {
        const chatId = msg.direction === 'incoming' ? msg.from : msg.to;
        if (!chatId) return;
        
        const cleanId = chatId.replace('@c.us', '').replace('@g.us', '');
        if (!chatMap.has(chatId)) {
          chatMap.set(chatId, {
            id: chatId,
            phone: cleanId,
            name: cleanId,
            isGroup: chatId.includes('@g.us'),
            lastMessage: msg,
            unread: msg.direction === 'incoming' && msg.status !== 'read' ? 1 : 0,
          });
        } else {
          const existing = chatMap.get(chatId);
          if (msg.timestamp > existing.lastMessage?.timestamp) {
            existing.lastMessage = msg;
          }
        }
      });
      
      const chatArray = Array.from(chatMap.values()).sort((a, b) => 
        new Date(b.lastMessage?.timestamp) - new Date(a.lastMessage?.timestamp)
      );
      
      setChats(chatArray);
      setFilteredChats(chatArray);
    } catch (err) {
      console.error('Failed to fetch chats:', err);
    }
  };

  // Fetch messages for selected chat
  const fetchMessages = async (chatId) => {
    if (!chatId) return;
    setLoading(true);
    try {
      const res = await messageAPI.getAll(1, 100, chatId);
      const msgs = res.data?.data || [];
      setMessages(msgs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
    } catch (err) {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
    }
  }, [selectedChat]);

  // Socket listeners for new messages
  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (msg) => {
      const chatId = msg.direction === 'incoming' ? msg.from : msg.to;
      
      // Update messages if it belongs to selected chat
      if (selectedChat && chatId === selectedChat.id) {
        setMessages(prev => [...prev, msg].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
      }
      
      // Refresh chat list
      fetchChats();
    };
    
    const handleMessageSent = (data) => {
      if (selectedChat && data.to === selectedChat.id) {
        setMessages(prev => [...prev, {
          _id: Date.now().toString(),
          body: data.message,
          direction: 'outgoing',
          to: data.to,
          timestamp: new Date().toISOString(),
          status: 'sent',
        }]);
      }
      fetchChats();
    };

    socket.on('hdm:new_message', handleNewMessage);
    socket.on('hdm:message_sent', handleMessageSent);
    
    return () => {
      socket.off('hdm:new_message', handleNewMessage);
      socket.off('hdm:message_sent', handleMessageSent);
    };
  }, [socket, selectedChat]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter chats by search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredChats(chats);
    } else {
      const filtered = chats.filter(chat => 
        chat.phone.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredChats(filtered);
    }
  }, [searchTerm, chats]);

  const handleSendMessage = async (text) => {
    if (!selectedChat || !text.trim() || !whatsappReady) return;
    
    setSending(true);
    try {
      await sendMessage(selectedChat.phone, text);
      toast.success('Message sent');
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    setSearchTerm('');
  };

  return (
    <div className="h-[calc(100vh-120px)] -mt-2">
      <div className={clsx(
        'h-full flex rounded-xl overflow-hidden border shadow-sm',
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      )}>
        {/* Chat List Sidebar */}
        <div className={clsx(
          'w-full sm:w-80 border-r flex flex-col',
          darkMode ? 'border-gray-700' : 'border-gray-200',
          selectedChat ? 'hidden sm:flex' : 'flex'
        )}>
          {/* Search Bar */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={clsx(
                  'w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none transition-colors',
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500'
                    : 'bg-gray-100 border-gray-200 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-primary-500'
                )}
              />
            </div>
          </div>
          
          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            <ChatList
              chats={filteredChats}
              selectedChat={selectedChat}
              onSelectChat={handleChatSelect}
            />
          </div>
        </div>

        {/* Chat Area */}
        <div className={clsx(
          'flex-1 flex flex-col',
          !selectedChat && 'hidden sm:flex'
        )}>
          {selectedChat ? (
            <>
              <ChatHeader
                chat={selectedChat}
                onBack={() => setSelectedChat(null)}
                isOnline={whatsappReady}
              />
              
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <FiMessageCircle className={clsx('text-5xl mb-3', darkMode ? 'text-gray-600' : 'text-gray-300')} />
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>No messages yet</p>
                    <p className={clsx('text-sm mt-1', darkMode ? 'text-gray-500' : 'text-gray-400')}>
                      Send a message to start the conversation
                    </p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <MessageBubble
                      key={msg._id || msg.messageId || idx}
                      message={msg}
                      isOwn={msg.direction === 'outgoing'}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <MessageInput
                onSend={handleSendMessage}
                disabled={!whatsappReady || sending}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <FiMessageCircle className={clsx('text-6xl mb-4', darkMode ? 'text-gray-600' : 'text-gray-300')} />
              <h3 className={clsx('text-xl font-semibold mb-2', darkMode ? 'text-white' : 'text-gray-800')}>
                Select a conversation
              </h3>
              <p className={clsx('text-center', darkMode ? 'text-gray-400' : 'text-gray-500')}>
                Choose a chat from the list to start messaging
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;