import { useEffect, useRef } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

interface Chat {
  id: string;
  instance_id: string;
  chat_id: string;
  chat_name?: string;
  chat_type: 'individual' | 'group';
  profile_pic_url?: string;
  last_message_text?: string;
  last_message_at?: string;
  unread_count: number;
  is_archived: boolean;
  is_pinned: boolean;
}

interface Message {
  id: string;
  instance_id: string;
  chat_id: string;
  message_id: string;
  sender_name?: string;
  sender_phone?: string;
  message_text?: string;
  message_caption?: string;
  message_type: string;
  media_url?: string;
  from_me: boolean;
  timestamp: string;
  is_read: boolean;
}

interface ChatWindowProps {
  chat: Chat;
  messages: Message[];
  onRefresh: () => void;
}

export default function ChatWindow({ chat, messages, onRefresh }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const sortedMessages = [...messages].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-semibold">
            {chat.chat_name?.[0] || '?'}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {chat.chat_name || chat.chat_id}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {chat.chat_type === 'group' ? 'Grupo' : 'Individual'}
            </p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          Actualizar
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {sortedMessages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-12">
            No hay mensajes en este chat
          </div>
        ) : (
          sortedMessages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input (disabled - solo lectura por ahora) */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Los mensajes se envían desde WhatsApp..."
            disabled
            className="flex-1 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex ${message.from_me ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          message.from_me
            ? 'bg-emerald-600 text-white'
            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
        }`}
      >
        {!message.from_me && message.sender_name && (
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
            {message.sender_name}
          </p>
        )}
        
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.message_text || message.message_caption || '[Media]'}
        </p>
        
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className={`text-xs ${message.from_me ? 'text-white/70' : 'text-gray-500'}`}>
            {formatTime(message.timestamp)}
          </span>
          {message.from_me && (
            message.is_read ? (
              <div className="flex">
                <CheckIcon className="w-4 h-4 text-blue-400 -mr-2" />
                <CheckIcon className="w-4 h-4 text-blue-400" />
              </div>
            ) : (
              <CheckIcon className="w-4 h-4 text-white/70" />
            )
          )}
        </div>
      </div>
    </div>
  );
}
