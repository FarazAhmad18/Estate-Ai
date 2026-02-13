import { useState } from 'react';
import { User, Check, CheckCheck, Trash2, Info } from 'lucide-react';

export default function MessageBubble({ message, isMine, onDelete }) {
  const [showDelete, setShowDelete] = useState(false);
  const isSystem = message.sender_id === null;

  const time = new Date(message.createdAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  // System message (e.g. "property sold")
  if (isSystem) {
    return (
      <div data-testid={`message-${message.id}`} className="flex justify-center my-3">
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full">
          <Info size={14} className="text-amber-500 flex-shrink-0" />
          <span className="text-xs font-medium text-amber-700">{message.body}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid={`message-${message.id}`}
      className={`flex gap-2 group ${isMine ? 'flex-row-reverse' : ''}`}
      onMouseEnter={() => isMine && setShowDelete(true)}
      onMouseLeave={() => isMine && setShowDelete(false)}
    >
      {!isMine && (
        <div className="w-7 h-7 rounded-full bg-surface flex items-center justify-center overflow-hidden flex-shrink-0 mt-1">
          {message.Sender?.avatar_url ? (
            <img src={message.Sender.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <User size={12} className="text-muted" />
          )}
        </div>
      )}
      <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
        <div className="relative">
          <div
            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              isMine
                ? 'bg-primary text-white rounded-br-md'
                : 'bg-surface text-primary rounded-bl-md'
            }`}
          >
            {message.body}
          </div>
          {isMine && showDelete && (
            <button
              onClick={() => onDelete?.(message.id)}
              className="absolute -left-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"
              title="Delete message"
            >
              <Trash2 size={12} className="text-red-500" />
            </button>
          )}
        </div>
        <div className={`flex items-center gap-1 mt-1 px-1 ${isMine ? 'justify-end' : ''}`}>
          <span className="text-[10px] text-muted">{time}</span>
          {isMine && (
            message.read ? (
              <CheckCheck size={12} className="text-accent" />
            ) : (
              <Check size={12} className="text-muted" />
            )
          )}
        </div>
      </div>
    </div>
  );
}
