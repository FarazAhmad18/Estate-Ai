import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import api from '../lib/api';
import ConversationList from '../components/messaging/ConversationList';
import ChatThread from '../components/messaging/ChatThread';

export default function Messages() {
  const [searchParams] = useSearchParams();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  // Auto-open conversation from URL param (fetch directly by ID so it works even with 0 messages)
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId) {
      api.get(`/conversations/${conversationId}`)
        .then((res) => {
          setSelectedConversation(res.data.conversation);
          setMobileShowChat(true);
        })
        .catch(() => {});
    }
  }, [searchParams]);

  const handleSelect = (conv) => {
    setSelectedConversation(conv);
    setMobileShowChat(true);
  };

  const handleBack = () => {
    setMobileShowChat(false);
  };

  const handleConversationsLoaded = (conversations) => {
    if (selectedConversation) {
      const updated = conversations.find((c) => c.id === selectedConversation.id);
      if (updated) setSelectedConversation(updated);
    }
  };

  const handleConversationDeleted = (conversationId) => {
    if (selectedConversation?.id === conversationId) {
      setSelectedConversation(null);
      setMobileShowChat(false);
    }
  };

  return (
    <div className="h-[calc(100dvh-64px)] mt-16 flex bg-surface">
      {/* Conversation List */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-border/50 bg-white flex-shrink-0 ${
        mobileShowChat ? 'hidden md:flex md:flex-col' : 'flex flex-col'
      }`}>
        <div className="px-5 py-4 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
              <MessageSquare size={14} className="text-white" />
            </div>
            <h1 className="text-lg font-bold text-primary tracking-tight">Messages</h1>
          </div>
        </div>
        <ConversationList
          onSelect={handleSelect}
          selectedId={selectedConversation?.id}
          onConversationsLoaded={handleConversationsLoaded}
        />
      </div>

      {/* Chat Thread */}
      <div className={`flex-1 ${
        mobileShowChat ? 'flex' : 'hidden md:flex'
      }`}>
        <ChatThread
          conversation={selectedConversation}
          onBack={handleBack}
          onConversationDeleted={handleConversationDeleted}
        />
      </div>
    </div>
  );
}
