import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import {
  PaperAirplaneIcon,
  PhotoIcon,
  DocumentIcon,
  FaceSmileIcon,
  ArrowLeftIcon,
  PhoneIcon,
  VideoCameraIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
import { useWebSocket } from '../../lib/hooks/useWebSocket';
import ContactSearch from '../../components/contacts/ContactSearch';

interface Message {
  id: string;
  message_id: string;
  message_text?: string;
  message_type: string;
  media_url?: string;
  from_me: boolean;
  timestamp: string;
  is_read: boolean;
  sender_name?: string;
}

export default function ChatPage() {
  const router = useRouter();
  const { chatId, instance } = router.query;
  const { data: session, status } = useSession();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [contactInfo, setContactInfo] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const instanceId = instance as string;

  // WebSocket connection
  const { isConnected, emitTyping } = useWebSocket({
    instanceId,
    onNewMessage: (message) => {
      if (message.chatId === chatId) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
    },
    onTyping: (data) => {
      if (data.chatId === chatId) {
        setIsTyping(data.isTyping);
        if (data.isTyping) {
          setTimeout(() => setIsTyping(false), 3000);
        }
      }
    },
  });

  // Load messages on mount
  useEffect(() => {
    if (chatId && instanceId && status === 'authenticated') {
      loadMessages();
      loadContactInfo();
    }
  }, [chatId, instanceId, status]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
      const response = await fetch(
        `${backendUrl}/api/messages/${instanceId}/${chatId}?limit=100`
      );

      const data = await response.json();

      if (data.messages) {
        setMessages(data.messages.reverse());
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Error al cargar mensajes');
    } finally {
      setLoading(false);
    }
  };

  const loadContactInfo = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
      const response = await fetch(
        `${backendUrl}/api/contacts/detail/${instanceId}/${chatId}`
      );

      const data = await response.json();

      if (data.success && data.contact) {
        setContactInfo(data.contact);
      }
    } catch (error) {
      console.error('Error loading contact info:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
      const response = await fetch(`${backendUrl}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceId,
          chatId,
          message: messageText,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al enviar mensaje');
      }

      // El mensaje se agregará automáticamente vía WebSocket
      toast.success('Mensaje enviado');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Error al enviar mensaje');
      setNewMessage(messageText); // Restore message
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    emitTyping(instanceId, chatId as string, true);

    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(instanceId, chatId as string, false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getContactName = () => {
    if (contactInfo?.name) return contactInfo.name;
    if (contactInfo?.push_name) return contactInfo.push_name;
    if (chatId) return (chatId as string).split('@')[0];
    return 'Chat';
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-zinc-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-zinc-400">Cargando chat...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/');
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-zinc-900">


      {/* Header */}
      <div className="bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full transition-colors"
            >
              <ArrowLeftIcon className="w-6 h-6 text-gray-700 dark:text-zinc-300" />
            </button>

            {contactInfo?.profile_pic_url ? (
              <img
                src={contactInfo.profile_pic_url}
                alt={getContactName()}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                {getContactName()[0]?.toUpperCase()}
              </div>
            )}

            <div>
              <h1 className="font-bold text-gray-900 dark:text-white">{getContactName()}</h1>
              <div className="flex items-center gap-2">
                {isConnected && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">
                    ● En línea
                  </span>
                )}
                {isTyping && (
                  <span className="text-xs text-gray-500 dark:text-zinc-400 italic">
                    escribiendo...
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full transition-colors">
              <PhoneIcon className="w-6 h-6 text-gray-700 dark:text-zinc-300" />
            </button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full transition-colors">
              <VideoCameraIcon className="w-6 h-6 text-gray-700 dark:text-zinc-300" />
            </button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full transition-colors">
              <EllipsisVerticalIcon className="w-6 h-6 text-gray-700 dark:text-zinc-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-4xl mx-auto w-full">
        {messages.map((message) => (
          <div
            key={message.id || message.message_id}
            className={`flex ${message.from_me ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-md px-4 py-2 rounded-2xl ${message.from_me
                  ? 'bg-emerald-500 text-white rounded-br-sm'
                  : 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white rounded-bl-sm shadow-md'
                }`}
            >
              {message.message_type === 'image' && message.media_url && (
                <img
                  src={message.media_url}
                  alt="Image"
                  className="rounded-lg mb-2 max-w-full"
                />
              )}

              {message.message_text && (
                <p className="whitespace-pre-wrap break-words">{message.message_text}</p>
              )}

              <div className={`text-xs mt-1 ${message.from_me ? 'text-emerald-100' : 'text-gray-500 dark:text-zinc-400'}`}>
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white dark:bg-zinc-800 border-t border-gray-200 dark:border-zinc-700 px-4 py-4">
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full transition-colors"
          >
            <PhotoIcon className="w-6 h-6 text-gray-700 dark:text-zinc-300" />
          </button>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*,video/*,application/pdf"
          />

          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={handleKeyPress}
              placeholder="Escribe un mensaje..."
              rows={1}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-zinc-600 rounded-full
                       focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
                       bg-gray-50 dark:bg-zinc-700 text-gray-900 dark:text-white
                       placeholder-gray-500 dark:placeholder-zinc-400
                       resize-none transition-all"
            />
          </div>

          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className="p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full
                     disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                     shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
          >
            {sending ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <PaperAirplaneIcon className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
