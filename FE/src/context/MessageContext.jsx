import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../lib/api';
import { getSocket } from '../lib/socket';
import { useAuth } from './AuthContext';

const MessageContext = createContext(null);

export function MessageProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const activeConversationIdRef = useRef(null);

  const setActiveConversationId = useCallback((id) => {
    activeConversationIdRef.current = id;
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await api.get('/messages/unread-count');
      setUnreadCount(res.data.unreadCount);
    } catch {
      // ignore
    }
  }, [user]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Listen for real-time events
  useEffect(() => {
    if (!user) return;

    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = ({ conversationId }) => {
      // Skip increment if user is viewing this conversation
      if (activeConversationIdRef.current === conversationId) return;
      setUnreadCount((c) => c + 1);
    };

    const handleMessagesRead = () => {
      fetchUnreadCount();
    };

    socket.on('new_message', handleNewMessage);
    socket.on('messages_read', handleMessagesRead);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [user, fetchUnreadCount]);

  return (
    <MessageContext.Provider value={{ unreadCount, setUnreadCount, fetchUnreadCount, setActiveConversationId }}>
      {children}
    </MessageContext.Provider>
  );
}

export const useMessages = () => useContext(MessageContext);
