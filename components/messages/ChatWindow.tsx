import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Chat, Message } from '../../pages/messages/index';
import axios from 'axios';
import ImageViewer from './ImageViewer';
import { CheckIcon, PaperAirplaneIcon, FaceSmileIcon, PaperClipIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface ChatWindowProps {
  chat: Chat;
  messages: Message[];
  onRefresh: () => void;
  onSendMessage?: (text: string) => Promise<void>;
}

// Componente de Audio Personalizado estilo WhatsApp
function CustomAudioPlayer({ src, isVoiceNote }: { src: string, isVoiceNote: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => setError(true));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration;
      if (total) {
        setProgress((current / total) * 100);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  const handleSeek = (e: any) => {
    const newProgress = e.target.value;
    if (audioRef.current && duration) {
      audioRef.current.currentTime = (duration * newProgress) / 100;
      setProgress(newProgress);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (error) {
    return (
      <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <span className="text-red-500 text-xs">Error</span>
        <a href={src} target="_blank" className="text-xs text-indigo-500 underline">Descargar</a>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700/50 rounded-xl p-2 transition-all w-full max-w-[280px]">
      <button
        onClick={togglePlay}
        className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:text-indigo-500 dark:hover:text-indigo-400 transition"
      >
        {isPlaying ? (
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
        ) : (
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
        )}
      </button>

      <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleSeek}
          className="w-full h-1 bg-slate-300 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>{audioRef.current ? formatTime(audioRef.current.currentTime) : "0:00"}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex-shrink-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isVoiceNote ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
          {isVoiceNote ? <span className="text-sm">🎤</span> : <span className="text-sm">🎵</span>}
        </div>
      </div>

      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={() => setError(true)}
        className="hidden"
      />
    </div>
  );
}

export default function ChatWindow({ chat, messages, onRefresh, onSendMessage }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; caption?: string } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);

  // Combinar mensajes reales con optimistas
  const allMessages = [...messages, ...optimisticMessages];
  const sortedMessages = allMessages.sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    setNewMessage(''); // Clear input immediately

    // 1. Create temporary optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      message_id: tempId, // Required by Message interface
      chat_id: chat.chat_id,
      instance_id: chat.instance_id,
      message_text: messageText,
      message_type: 'text',
      from_me: true,
      timestamp: new Date().toISOString(),
      is_read: false,
      status: 'sending' // Custom status indicator
    };

    // 2. Update UI immediately
    setOptimisticMessages(prev => [...prev, optimisticMsg]);

    try {
      // 3. Send in background (fire and forget from UI perspective)
      // setSending(true); // Don't block UI with sending state
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

      await axios.post(`${backendUrl}/api/messages/send`, {
        instanceId: chat.instance_id,
        chatId: chat.chat_id,
        message: messageText,
      });

      // 4. On success, the refresh will eventually bring the real message.
      // We keep the optimistic one until then, or remove it if we want to rely on the refresh.
      // Usually, onRefresh() will update 'messages'. We can clear optimistic msg then.
      onRefresh();
      setOptimisticMessages(prev => prev.filter(m => m.id !== tempId));

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar mensaje');
      // Remove optimistic message on error and restore text?
      setOptimisticMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(messageText); // Restore text so user can try again
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="h-full flex flex-col bg-[#f1f5f9] dark:bg-[#0f172a]">
      {/* Header - Pastel Glassmorphism */}
      <div className="bg-white/80 backdrop-blur-md dark:bg-[#1e293b]/90 px-6 py-3 flex items-center justify-between shadow-sm border-b border-slate-200 dark:border-slate-800 z-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            {chat.profile_pic_url ? (
              <img
                src={chat.profile_pic_url}
                alt={chat.chat_name || 'Chat'}
                className="w-11 h-11 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-sm"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-lg border-2 border-white dark:border-slate-700 shadow-sm">
                {chat.chat_name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-white dark:border-slate-800 rounded-full"></span>
          </div>
          <div>
            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-[16px]">
              {chat.chat_name || chat.chat_id}
            </h2>
            <p className="text-xs font-medium text-indigo-500 dark:text-indigo-400">
              {chat.chat_type === 'group' ? 'Grupo' : 'En línea'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:text-slate-400 dark:hover:bg-indigo-900/30 rounded-xl transition-all duration-200"
            title="Actualizar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages - Clean Pastel Background */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {sortedMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center bg-white/60 dark:bg-[#1e293b]/60 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <PaperAirplaneIcon className="w-8 h-8 text-indigo-500" />
              </div>
              <p className="text-slate-600 dark:text-slate-300 font-medium">No hay mensajes aún</p>
              <p className="text-xs text-slate-400 mt-2">Envía un mensaje para comenzar la conversación</p>
            </div>
          </div>
        ) : (
          sortedMessages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onImageClick={(url, caption) => {
                setSelectedImage({ url, caption });
                setImageViewerOpen(true);
              }}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - Floating Capsule Design */}
      <div className="bg-white/80 backdrop-blur-md dark:bg-[#1e293b]/90 px-4 py-3 border-t border-slate-200 dark:border-slate-800 relative z-20">
        <div className="max-w-4xl mx-auto flex items-end gap-2">
          {showEmojiPicker && (
            <div className="absolute bottom-20 left-4 z-50 shadow-2xl rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700">
              <EmojiPicker onEmojiClick={onEmojiClick} width={300} height={400} />
            </div>
          )}

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#0f172a] rounded-full p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-2 rounded-full transition-all duration-200 ${showEmojiPicker ? 'text-indigo-500 bg-white shadow-sm' : 'text-slate-500 hover:text-indigo-500 hover:bg-white/50'}`}
            >
              <FaceSmileIcon className="w-6 h-6" />
            </button>
            <button className="p-2 text-slate-500 hover:text-indigo-500 hover:bg-white/50 rounded-full transition-all duration-200">
              <PaperClipIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 bg-slate-100 dark:bg-[#0f172a] rounded-2xl flex items-center px-4 py-2.5 border border-slate-200 dark:border-slate-700 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900/30 transition-all shadow-inner">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe un mensaje..."
              disabled={sending}
              className="flex-1 bg-transparent text-[15px] text-slate-800 dark:text-slate-100 placeholder-slate-400 border-none focus:outline-none"
            />
          </div>

          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className={`p-3 rounded-full transition-all duration-300 shadow-lg ${newMessage.trim() && !sending
              ? 'bg-gradient-to-tr from-indigo-500 to-purple-500 text-white hover:shadow-indigo-300 dark:hover:shadow-indigo-900 hover:scale-105 active:scale-95'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
          >
            {sending ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <PaperAirplaneIcon className="w-6 h-6 transform rotate-90" />
            )}
          </button>
        </div>
      </div>

      {/* Image Viewer Modal */}
      {imageViewerOpen && selectedImage && (
        <ImageViewer
          imageUrl={selectedImage.url}
          caption={selectedImage.caption}
          onClose={() => {
            setImageViewerOpen(false);
            setSelectedImage(null);
          }}
        />
      )}
    </div>
  );
}

function MessageBubble({
  message,
  onImageClick
}: {
  message: Message;
  onImageClick?: (url: string, caption?: string) => void;
}) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  // Renderizar contenido según el tipo de mensaje
  const renderMessageContent = () => {
    // Renderizar imagen
    if (message.message_type === 'image' && message.media_url) {
      return (
        <div className="mb-1">
          <img
            src={message.media_url}
            alt="Imagen"
            className="max-w-full rounded-xl cursor-pointer hover:opacity-95 transition hover:shadow-md"
            style={{ maxHeight: '300px', objectFit: 'cover' }}
            onClick={() => onImageClick?.(message.media_url!, message.message_text)}
          />
          {message.message_text && (
            <p className="text-[14.5px] mt-2 px-1">{message.message_text}</p>
          )}
        </div>
      );
    }

    // Renderizar video
    if (message.message_type === 'video' && message.media_url) {
      return (
        <div className="mb-1">
          <video
            controls
            className="max-w-full rounded-lg"
            style={{ maxHeight: '300px' }}
          >
            <source src={message.media_url} type="video/mp4" />
            Tu navegador no soporta video.
          </video>
          {message.message_text && (
            <p className="text-[14.2px] mt-1 px-1">{message.message_text}</p>
          )}
        </div>
      );
    }

    // Renderizar audio o nota de voz
    if ((message.message_type === 'audio' || message.message_type === 'voice' || message.message_type === 'ptt') && message.media_url) {
      return (
        <div className="mb-1 min-w-[240px]">
          <CustomAudioPlayer src={message.media_url} isVoiceNote={message.message_type === 'voice' || message.message_type === 'ptt'} />
          {message.message_text && (
            <p className="text-[14.2px] mt-1 px-1">{message.message_text}</p>
          )}
        </div>
      );
    }

    // Renderizar sticker
    if (message.message_type === 'sticker' && message.media_url) {
      return (
        <div className="mb-1">
          <img
            src={message.media_url}
            alt="Sticker"
            className="max-w-[150px] cursor-pointer"
            onClick={() => window.open(message.media_url, '_blank')}
          />
        </div>
      );
    }

    // Renderizar documento
    if (message.message_type === 'document' && message.media_url) {
      const fileName = (message.metadata as any)?.fileName || 'documento';
      return (
        <div className="mb-1">
          <a
            href={message.media_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white/10 dark:bg-black/10 rounded-lg p-3 hover:bg-white/20 dark:hover:bg-black/20 transition"
          >
            <span className="text-2xl">📄</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{fileName}</p>
              <p className="text-xs opacity-70">Click para descargar</p>
            </div>
          </a>
          {message.message_text && (
            <p className="text-[14.2px] mt-1 px-1">{message.message_text}</p>
          )}
        </div>
      );
    }

    // Si hay texto, mostrarlo
    if (message.message_text) {
      return (
        <p className={`text-[15px] whitespace-pre-wrap break-words leading-[22px] ${message.from_me
          ? 'text-slate-800 dark:text-slate-100'
          : 'text-slate-800 dark:text-slate-100'
          }`}>
          {message.message_text}
        </p>
      );
    }

    // Si no hay texto ni media, mostrar indicador según el tipo
    const typeIcons: Record<string, string> = {
      image: '🖼️ Imagen',
      video: '🎥 Video',
      audio: '🎵 Audio',
      voice: '🎤 Nota de voz',
      document: '📄 Documento',
      sticker: '🎨 Sticker',
      location: '📍 Ubicación',
      contact: '👤 Contacto',
      contacts: '👥 Contactos',
      poll: '📊 Encuesta',
      reaction: '❤️ Reacción',
    };

    const typeLabel = typeIcons[message.message_type] || '📎 Archivo';

    // Intentar obtener nombre de archivo del metadata
    const fileName = (message.metadata as any)?.fileName;

    return (
      <div className="px-1">
        <p className={`text-[14.2px] italic leading-[19px] ${message.from_me
          ? 'text-slate-500 dark:text-slate-400'
          : 'text-slate-500 dark:text-slate-400'
          }`}>
          {typeLabel}
        </p>
        {fileName && (
          <p className={`text-xs mt-0.5 leading-[16px] ${message.from_me
            ? 'text-slate-500 dark:text-slate-400'
            : 'text-slate-500 dark:text-slate-400'
            }`}>
            {fileName}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className={`flex ${message.from_me ? 'justify-end' : 'justify-start'} mb-4 group px-2`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm relative transition-all duration-200 ${message.from_me
          ? 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/40 dark:to-purple-900/40 border border-indigo-100 dark:border-indigo-800 rounded-tr-sm'
          : 'bg-white dark:bg-[#1e293b] border border-slate-100 dark:border-slate-800 rounded-tl-sm'
          }`}
      >
        {!message.from_me && message.sender_name && (
          <p className="text-xs font-bold text-indigo-500 mb-1">
            {message.sender_name}
          </p>
        )}

        {renderMessageContent()}

        <div className="flex items-center justify-end gap-1 mt-1 select-none">
          <span className={`text-[10px] font-medium ${message.from_me
            ? 'text-indigo-400/80'
            : 'text-slate-400'
            }`}>
            {formatTime(message.timestamp)}
          </span>
          {message.from_me && (
            <span className="ml-1">
              {message.is_read ? (
                <svg viewBox="0 0 16 15" width="14" height="13" className="inline text-indigo-500">
                  <path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" />
                </svg>
              ) : (
                <svg viewBox="0 0 16 15" width="14" height="13" className="inline text-slate-400">
                  <path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512z" />
                </svg>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
