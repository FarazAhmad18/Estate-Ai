import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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

  // Bug 4: Update selectedConversation when conversations are refetched
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
    <div className="h-[calc(100dvh-64px)] mt-16 flex">
      {/* Conversation List — hidden on mobile when chat is open */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-border/50 bg-white flex-shrink-0 ${
        mobileShowChat ? 'hidden md:flex md:flex-col' : 'flex flex-col'
      }`}>
        <div className="px-4 py-3 border-b border-border/50">
          <h1 className="text-lg font-semibold text-primary">Messages</h1>
        </div>
        <ConversationList
          onSelect={handleSelect}
          selectedId={selectedConversation?.id}
          onConversationsLoaded={handleConversationsLoaded}
        />
      </div>

      {/* Chat Thread — hidden on mobile when list is shown */}
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
