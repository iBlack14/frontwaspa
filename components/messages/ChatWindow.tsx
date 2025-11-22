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

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const sortedMessages = [...messages].sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

      await axios.post(`${backendUrl}/api/messages/send`, {
        instanceId: chat.instance_id,
        chatId: chat.chat_id,
        message: newMessage.trim(),
      });

      setNewMessage('');
      toast.success('Mensaje enviado');

      // Refrescar mensajes después de enviar
      setTimeout(() => onRefresh(), 1000);
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.response?.data?.error || 'Error al enviar mensaje');
    } finally {
      setSending(false);
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
    <div className="h-full flex flex-col bg-[#efeae2] dark:bg-[#0b141a]">
      {/* Header - Estilo WhatsApp */}
      <div className="bg-[#f0f2f5] dark:bg-[#202c33] px-4 py-2.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          {chat.profile_pic_url ? (
            <img
              src={chat.profile_pic_url}
              alt={chat.chat_name || 'Chat'}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#6b7c85] flex items-center justify-center text-white font-semibold text-sm">
              {chat.chat_name?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div>
            <h2 className="font-medium text-[#111b21] dark:text-[#e9edef] text-[15px]">
              {chat.chat_name || chat.chat_id}
            </h2>
            <p className="text-xs text-[#667781] dark:text-[#8696a0]">
              {chat.chat_type === 'group' ? 'Grupo' : 'Toca para ver info'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-2 text-[#54656f] dark:text-[#8696a0] hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942] rounded-full transition"
            title="Actualizar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages - Fondo WhatsApp */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-2"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h100v100H0z\' fill=\'%23efeae2\' fill-opacity=\'.4\'/%3E%3C/svg%3E")',
        }}
      >
        {sortedMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-[#667781] dark:text-[#8696a0] bg-white/50 dark:bg-[#202c33]/50 rounded-lg p-6">
              <p className="text-sm">No hay mensajes en este chat</p>
              <p className="text-xs mt-2">Los mensajes aparecerán aquí</p>
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

      {/* Input - Estilo WhatsApp */}
      <div className="bg-[#f0f2f5] dark:bg-[#202c33] px-4 py-2 flex items-center gap-2 relative z-20">
        {showEmojiPicker && (
          <div className="absolute bottom-16 left-4 z-50 shadow-2xl rounded-xl overflow-hidden">
            <EmojiPicker onEmojiClick={onEmojiClick} width={300} height={400} />
          </div>
        )}

        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={`p-2 rounded-full transition ${showEmojiPicker ? 'text-[#00a884] bg-[#d9d9d9] dark:bg-[#2a3942]' : 'text-[#54656f] dark:text-[#8696a0] hover:bg-[#d9d9d9] dark:hover:bg-[#2a3942]'}`}
        >
          <FaceSmileIcon className="w-6 h-6" />
        </button>

        <button className="p-2 text-[#54656f] dark:text-[#8696a0] hover:bg-[#d9d9d9] dark:hover:bg-[#2a3942] rounded-full transition">
          <PaperClipIcon className="w-6 h-6" />
        </button>

        <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-lg flex items-center px-4 py-2 shadow-sm border border-transparent focus-within:border-[#00a884] transition-all">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe un mensaje"
            disabled={sending}
            className="flex-1 bg-transparent text-[15px] text-[#111b21] dark:text-[#e9edef] placeholder-[#667781] dark:placeholder-[#8696a0] border-none focus:outline-none"
          />
        </div>

        <button
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || sending}
          className={`p-2.5 rounded-full transition shadow-md ${newMessage.trim() && !sending
            ? 'bg-[#00a884] hover:bg-[#008f6f] text-white transform hover:scale-105 active:scale-95'
            : 'bg-transparent text-[#8696a0] cursor-not-allowed'
            }`}
        >
          {sending ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <PaperAirplaneIcon className="w-6 h-6" />
          )}
        </button>
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
            className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition hover:shadow-lg"
            style={{ maxHeight: '300px', objectFit: 'cover' }}
            onClick={() => onImageClick?.(message.media_url!, message.message_text)}
          />
          {message.message_text && (
            <p className="text-[14.2px] mt-1 px-1">{message.message_text}</p>
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
    if ((message.message_type === 'audio' || message.message_type === 'voice') && message.media_url) {
      return (
        <div className="mb-1">
          <div className="flex items-center gap-2 bg-white/10 dark:bg-black/10 rounded-lg p-2">
            {message.message_type === 'voice' ? '🎤' : '🎵'}
            <audio controls className="flex-1" style={{ height: '32px' }}>
              <source src={message.media_url} />
              Tu navegador no soporta audio.
            </audio>
          </div>
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
        <p className={`text-[14.2px] whitespace-pre-wrap break-words px-1 leading-[19px] ${message.from_me
          ? 'text-[#111b21] dark:text-[#e9edef]'
          : 'text-[#111b21] dark:text-[#e9edef]'
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
          ? 'text-[#667781] dark:text-[#8696a0]'
          : 'text-[#667781] dark:text-[#8696a0]'
          }`}>
          {typeLabel}
        </p>
        {fileName && (
          <p className={`text-xs mt-0.5 leading-[16px] ${message.from_me
            ? 'text-[#667781] dark:text-[#8696a0]'
            : 'text-[#667781] dark:text-[#8696a0]'
            }`}>
            {fileName}
          </p>
        )}
        <p className={`text-xs mt-1 opacity-60 leading-[16px] ${message.from_me
          ? 'text-[#667781] dark:text-[#8696a0]'
          : 'text-[#667781] dark:text-[#8696a0]'
          }`}>
          (Mensaje antiguo sin media)
        </p>
      </div>
    );
  };

  return (
    <div className={`flex ${message.from_me ? 'justify-end' : 'justify-start'} mb-2 group`}>
      <div
        className={`max-w-[65%] rounded-lg px-2 py-1.5 shadow-sm relative ${message.from_me
          ? 'bg-[#d9fdd3] dark:bg-[#005c4b] rounded-tr-none'
          : 'bg-white dark:bg-[#202c33] rounded-tl-none'
          }`}
        style={{
          borderRadius: message.from_me
            ? '7.5px 7.5px 0px 7.5px'
            : '7.5px 7.5px 7.5px 0px'
        }}
      >
        {/* Tail for bubbles */}
        <span className={`absolute top-0 ${message.from_me ? '-right-2 text-[#d9fdd3] dark:text-[#005c4b]' : '-left-2 text-white dark:text-[#202c33]'}`}>
          <svg viewBox="0 0 8 13" width="8" height="13" className="fill-current">
            <path d={message.from_me ? "M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z" : "M-2.188 1H3v11.193l-6.467-8.625C-4.526 2.156 -3.958 1 -2.188 1z"} transform={message.from_me ? "" : "scale(-1, 1) translate(-8, 0)"} />
          </svg>
        </span>

        {!message.from_me && message.sender_name && (
          <p className="text-xs font-semibold text-[#e542a3] dark:text-[#e542a3] mb-0.5 px-1">
            {message.sender_name}
          </p>
        )}

        {renderMessageContent()}

        <div className="flex items-center justify-end gap-1 mt-0.5 px-1 select-none">
          <span className={`text-[11px] ${message.from_me
            ? 'text-[#667781] dark:text-[#8696a0]'
            : 'text-[#667781] dark:text-[#8696a0]'
            }`}>
            {formatTime(message.timestamp)}
          </span>
          {message.from_me && (
            <span className="ml-1">
              {message.is_read ? (
                <svg viewBox="0 0 16 15" width="16" height="15" className="inline text-[#53bdeb]">
                  <path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" />
                </svg>
              ) : (
                <svg viewBox="0 0 16 15" width="16" height="15" className="inline text-[#8696a0]">
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
