import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Send, Loader2, MapPin, BedDouble, Maximize, Bot, Sparkles } from 'lucide-react';
import api from '../lib/api';

const formatPrice = (price) => {
  if (price >= 10000000) return `${(price / 10000000).toFixed(1)} Cr`;
  if (price >= 100000) return `${(price / 100000).toFixed(1)} Lac`;
  return price?.toLocaleString();
};

function PropertyMiniCard({ property }) {
  return (
    <Link
      to={`/properties/${property.id}`}
      className="block bg-white rounded-xl border border-border/60 overflow-hidden hover:shadow-md transition-all"
    >
      <div className="flex gap-3 p-2.5">
        <div className="w-20 h-20 rounded-lg overflow-hidden bg-surface flex-shrink-0">
          {property.PropertyImages?.[0]?.image_url ? (
            <img
              src={property.PropertyImages[0].image_url}
              alt={property.location}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted">
              <Maximize size={16} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-primary truncate">
            PKR {formatPrice(property.price)}
          </p>
          <div className="flex items-center gap-1 mt-0.5 text-muted">
            <MapPin size={10} className="flex-shrink-0" />
            <span className="text-[11px] truncate">{property.location}</span>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[10px] font-semibold bg-surface text-secondary px-1.5 py-0.5 rounded">
              {property.type}
            </span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              property.purpose === 'Sale' ? 'bg-accent/10 text-accent' : 'bg-green-50 text-green-600'
            }`}>
              {property.purpose}
            </span>
            {property.bedrooms && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted">
                <BedDouble size={10} /> {property.bedrooms}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', text: 'Hi! I\'m your real estate assistant. I can help you find properties, answer questions about listings, and more. What are you looking for?', properties: [] },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setIsLoading(true);

    try {
      // Build history from messages (exclude first greeting & properties)
      const history = messages
        .filter((_, i) => i > 0) // skip initial greeting
        .map(m => ({ role: m.role, text: m.text }));

      const res = await api.post('/ai/chat', { message: text, history });
      setMessages(prev => [...prev, {
        role: 'model',
        text: res.data.reply,
        properties: res.data.properties || [],
      }]);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Something went wrong. Please try again.';
      setMessages(prev => [...prev, { role: 'model', text: errorMsg, properties: [] }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[400px] h-[500px] sm:h-[560px] bg-white rounded-2xl shadow-2xl shadow-black/15 border border-border/60 flex flex-col overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-gradient-to-r from-accent to-violet-500">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Property Assistant</p>
                <p className="text-[10px] text-white/70">Ask me anything about properties</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${msg.role === 'user' ? '' : ''}`}>
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-accent text-white rounded-br-md'
                        : 'bg-surface text-primary rounded-bl-md'
                    }`}
                  >
                    {msg.text}
                  </div>
                  {msg.properties?.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {msg.properties.map(p => (
                        <PropertyMiniCard key={p.id} property={p} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-surface px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-accent/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-accent/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-accent/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-border/40">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search properties or ask a question..."
                className="flex-1 px-4 py-2.5 bg-surface rounded-xl text-sm border border-border/60 focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-muted outline-none"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={`fixed bottom-6 right-4 sm:right-6 z-50 shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? 'w-14 h-14 rounded-full scale-90'
            : 'text-white hover:scale-105 hover:shadow-xl rounded-full pl-4 pr-5 h-14 gap-2.5'
        }`}
        style={isOpen
          ? { backgroundColor: 'var(--color-secondary, #374151)', color: '#fff' }
          : { background: 'linear-gradient(to right, var(--color-accent, #3b82f6), #8b5cf6)', color: '#fff' }
        }
      >
        {isOpen ? (
          <X size={22} />
        ) : (
          <>
            <span className="relative flex items-center justify-center w-8 h-8 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <Sparkles size={16} className="animate-pulse" />
            </span>
            <span className="text-sm font-semibold whitespace-nowrap">Ask AI</span>
          </>
        )}
      </button>
    </>
  );
}
