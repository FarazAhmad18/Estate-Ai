import { useState, useEffect } from 'react';
import { MessageSquare, Building2, User, Search } from 'lucide-react';
import api from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { useAuth } from '../../context/AuthContext';

export default function ConversationList({ onSelect, selectedId, onConversationsLoaded }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchConversations = () => {
    api.get('/conversations')
      .then((res) => {
        setConversations(res.data.conversations);
        onConversationsLoaded?.(res.data.conversations);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Listen for new messages and conversation deletions
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = () => {
      fetchConversations();
    };

    const handleMessagesRead = () => {
      fetchConversations();
    };

    const handleConversationDeleted = ({ conversationId }) => {
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    };

    socket.on('new_message', handleNewMessage);
    socket.on('messages_read', handleMessagesRead);
    socket.on('conversation_deleted', handleConversationDeleted);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('messages_read', handleMessagesRead);
      socket.off('conversation_deleted', handleConversationDeleted);
    };
  }, []);

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const oneDay = 86400000;

    if (diff < oneDay && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    if (diff < 2 * oneDay) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filtered = conversations.filter((conv) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const otherParty = conv.buyer_id === user.id ? conv.Agent : conv.Buyer;
    return (
      otherParty?.name?.toLowerCase().includes(q) ||
      conv.Property?.location?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-border/50">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-3 py-2 bg-surface rounded-lg text-sm border border-border/50 focus:border-accent transition-colors"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={24} className="text-muted" />
            </div>
            <h3 className="text-sm font-semibold text-primary mb-1">
              {search ? 'No results found' : 'No conversations yet'}
            </h3>
            <p className="text-xs text-muted">
              {search
                ? 'Try a different search term'
                : 'Start a conversation by contacting an agent on any property listing'}
            </p>
          </div>
        ) : (
          filtered.map((conv) => {
            const otherParty = conv.buyer_id === user.id ? conv.Agent : conv.Buyer;
            const thumbnail = conv.Property?.PropertyImages?.[0]?.image_url;
            const isSelected = selectedId === conv.id;
            const hasUnread = conv.unreadCount > 0;

            return (
              <button
                key={conv.id}
                data-testid={`conversation-${conv.id}`}
                onClick={() => onSelect(conv)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-border/30 ${
                  isSelected ? 'bg-accent/5' : 'hover:bg-surface'
                }`}
              >
                {/* Property thumbnail or avatar */}
                <div className="w-11 h-11 rounded-xl bg-surface overflow-hidden flex-shrink-0">
                  {thumbnail ? (
                    <img src={thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 size={16} className="text-muted" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm truncate ${hasUnread ? 'font-semibold text-primary' : 'font-medium text-primary'}`}>
                      {otherParty?.name || 'Unknown'}
                    </p>
                    <span className="text-[10px] text-muted flex-shrink-0">
                      {formatTime(conv.lastMessage?.createdAt || conv.updatedAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted truncate mt-0.5">
                    {conv.Property?.location || 'Property'}
                  </p>
                  {conv.lastMessage && (
                    <p className={`text-xs truncate mt-0.5 ${hasUnread ? 'text-primary font-medium' : 'text-secondary'}`}>
                      {conv.lastMessage.sender_id === user.id ? 'You: ' : ''}
                      {conv.lastMessage.body}
                    </p>
                  )}
                </div>

                {/* Unread badge */}
                {conv.unreadCount > 0 && (
                  <span
                    data-testid={`unread-${conv.id}`}
                    className="w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                  >
                    {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
