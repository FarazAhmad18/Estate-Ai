import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Send, ArrowLeft, User, MessageSquare, ChevronUp } from 'lucide-react';
import api from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { useAuth } from '../../context/AuthContext';
import { useMessages } from '../../context/MessageContext';
import MessageBubble from './MessageBubble';

const MAX_MESSAGE_LENGTH = 5000;
const PAGE_SIZE = 50;

export default function ChatThread({ conversation, onBack, onConversationDeleted }) {
  const { user } = useAuth();
  const { fetchUnreadCount, setActiveConversationId } = useMessages();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);

  const hasMore = messages.length < total;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Set/clear active conversation for unread tracking
  useEffect(() => {
    if (!conversation) return;
    setActiveConversationId(conversation.id);
    return () => setActiveConversationId(null);
  }, [conversation?.id, setActiveConversationId]);

  // Join/leave conversation room for typing indicators
  useEffect(() => {
    if (!conversation || !user) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit('join_conversation', { conversationId: conversation.id });
    return () => {
      socket.emit('leave_conversation', { conversationId: conversation.id });
    };
  }, [conversation?.id, user]);

  // Fetch messages (initial load — newest PAGE_SIZE)
  useEffect(() => {
    if (!conversation || !user) return;
    setLoading(true);
    setMessages([]);
    api.get(`/conversations/${conversation.id}/messages?limit=${PAGE_SIZE}`)
      .then((res) => {
        const { messages: msgs, total: t } = res.data;
        // If there are more messages than PAGE_SIZE, we got the first PAGE_SIZE (ASC order).
        // We want the newest ones, so fetch with offset.
        if (t > PAGE_SIZE) {
          // Re-fetch the newest page
          const offset = t - PAGE_SIZE;
          return api.get(`/conversations/${conversation.id}/messages?limit=${PAGE_SIZE}&offset=${offset}`)
            .then((res2) => {
              setMessages(res2.data.messages);
              setTotal(res2.data.total);
            });
        }
        setMessages(msgs);
        setTotal(t);
        fetchUnreadCount();
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [conversation?.id, user, fetchUnreadCount]);

  // Load earlier messages
  const loadEarlier = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    const container = messagesContainerRef.current;
    const prevScrollHeight = container?.scrollHeight || 0;

    const loaded = messages.length;
    const remaining = total - loaded;
    const batchSize = Math.min(PAGE_SIZE, remaining);
    const offset = remaining - batchSize;

    try {
      const res = await api.get(
        `/conversations/${conversation.id}/messages?limit=${batchSize}&offset=${Math.max(offset, 0)}`
      );
      setMessages((prev) => [...res.data.messages, ...prev]);
      setTotal(res.data.total);

      // Preserve scroll position
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - prevScrollHeight;
        }
      });
    } catch {}
    setLoadingMore(false);
  };

  // Scroll to bottom when messages change (only on initial load or new message)
  useEffect(() => {
    if (!loading && !loadingMore) scrollToBottom();
  }, [loading, scrollToBottom]);

  // Scroll to bottom when a new message is appended
  const prevCountRef = useRef(0);
  useEffect(() => {
    if (messages.length > prevCountRef.current && !loadingMore) {
      scrollToBottom();
    }
    prevCountRef.current = messages.length;
  }, [messages.length, loadingMore, scrollToBottom]);

  // Socket listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !conversation || !user) return;

    const handleNewMessage = ({ message: msg, conversationId }) => {
      if (conversationId === conversation.id) {
        setMessages((prev) => [...prev, msg]);
        setTotal((prev) => prev + 1);
        api.post(`/conversations/${conversation.id}/read`).catch(() => {});
        fetchUnreadCount();
      }
    };

    const handleTyping = ({ conversationId, userId }) => {
      if (conversationId === conversation.id && userId !== user?.id) {
        setTypingUser(userId);
      }
    };

    const handleStopTyping = ({ conversationId, userId }) => {
      if (conversationId === conversation.id && userId !== user?.id) {
        setTypingUser(null);
      }
    };

    const handleMessagesRead = ({ conversationId }) => {
      if (conversationId === conversation.id) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.sender_id === user?.id ? { ...msg, read: true } : msg
          )
        );
      }
    };

    const handleMessageDeleted = ({ messageId, conversationId }) => {
      if (conversationId === conversation.id) {
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
        setTotal((prev) => prev - 1);
      }
    };

    const handleConversationDeleted = ({ conversationId }) => {
      if (conversationId === conversation.id) {
        onConversationDeleted?.(conversationId);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleTyping);
    socket.on('user_stop_typing', handleStopTyping);
    socket.on('messages_read', handleMessagesRead);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('conversation_deleted', handleConversationDeleted);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleTyping);
      socket.off('user_stop_typing', handleStopTyping);
      socket.off('messages_read', handleMessagesRead);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('conversation_deleted', handleConversationDeleted);
    };
  }, [conversation?.id, user?.id, fetchUnreadCount, onConversationDeleted]);

  // Auto-resize textarea
  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, []);

  const handleDeleteMessage = async (messageId) => {
    try {
      await api.delete(`/conversations/${conversation.id}/messages/${messageId}`);
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      setTotal((prev) => prev - 1);
    } catch {}
  };

  const handleSend = async () => {
    const body = input.trim();
    if (!body || sending || !user) return;

    setSending(true);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = '40px';

    const socket = getSocket();
    if (socket) socket.emit('stop_typing', { conversationId: conversation.id });

    try {
      const res = await api.post(`/conversations/${conversation.id}/messages`, { body });
      setMessages((prev) => [...prev, res.data.message]);
      setTotal((prev) => prev + 1);
    } catch {
      setInput(body);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (value.length > MAX_MESSAGE_LENGTH) return;
    setInput(value);
    resizeTextarea();
    const socket = getSocket();
    if (!socket) return;

    socket.emit('typing', { conversationId: conversation.id });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { conversationId: conversation.id });
    }, 2000);
  };

  if (!user) return null;

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center px-6">
          <div className="w-20 h-20 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-5">
            <MessageSquare size={32} className="text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-primary mb-2">Your Messages</h3>
          <p className="text-sm text-muted max-w-xs">
            Select a conversation from the list to start chatting
          </p>
        </div>
      </div>
    );
  }

  const otherParty = conversation.buyer_id === user.id ? conversation.Agent : conversation.Buyer;
  const propertyInfo = conversation.Property;

  const getDateLabel = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diff = today - msgDate;
    if (diff === 0) return 'Today';
    if (diff === 86400000) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderMessages = () => {
    let lastDateLabel = null;
    return messages.map((msg) => {
      const dateLabel = getDateLabel(msg.createdAt);
      const showLabel = dateLabel !== lastDateLabel;
      lastDateLabel = dateLabel;
      return (
        <div key={msg.id}>
          {showLabel && (
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-border/50" />
              <span className="text-[10px] font-medium text-muted px-2">{dateLabel}</span>
              <div className="flex-1 h-px bg-border/50" />
            </div>
          )}
          <MessageBubble
            message={msg}
            isMine={msg.sender_id === user.id}
            onDelete={handleDeleteMessage}
          />
        </div>
      );
    });
  };

  const charCount = input.length;
  const showCharCount = charCount > MAX_MESSAGE_LENGTH * 0.8;

  return (
    <div className="flex-1 flex flex-col bg-white h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 flex-shrink-0">
        {onBack && (
          <button
            data-testid="chat-back"
            onClick={onBack}
            className="md:hidden w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-muted hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
        )}
        <div className="w-9 h-9 rounded-full bg-surface flex items-center justify-center overflow-hidden flex-shrink-0">
          {otherParty?.avatar_url ? (
            <img src={otherParty.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <User size={16} className="text-muted" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-primary truncate">{otherParty?.name}</p>
          {propertyInfo && (
            <Link
              to={`/properties/${propertyInfo.id}`}
              className="text-xs text-muted truncate hover:text-accent transition-colors block"
            >
              {propertyInfo.type} in {propertyInfo.location}
            </Link>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Load earlier messages button */}
        {hasMore && !loading && (
          <div className="flex justify-center mb-2">
            <button
              onClick={loadEarlier}
              disabled={loadingMore}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-accent bg-accent/5 rounded-full hover:bg-accent/10 transition-colors disabled:opacity-50"
            >
              {loadingMore ? (
                <div className="w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin" />
              ) : (
                <ChevronUp size={14} />
              )}
              Load earlier messages
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted">No messages yet. Say hello!</p>
          </div>
        ) : (
          renderMessages()
        )}
        {typingUser && (
          <div className="flex items-center gap-2 px-2">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-muted">typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border/50 flex-shrink-0">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              data-testid="message-input"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              maxLength={MAX_MESSAGE_LENGTH}
              rows={1}
              className="w-full px-4 py-2.5 bg-surface rounded-xl text-sm border border-border/50 focus:border-accent transition-colors resize-none max-h-32"
              style={{ minHeight: '40px' }}
            />
            {showCharCount && (
              <span className={`absolute right-3 bottom-1.5 text-[10px] ${charCount >= MAX_MESSAGE_LENGTH ? 'text-red-500' : 'text-muted'}`}>
                {charCount}/{MAX_MESSAGE_LENGTH}
              </span>
            )}
          </div>
          <button
            data-testid="message-send"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 flex-shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
