'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast, Toaster } from 'sonner';
import { io } from 'socket.io-client';
import { SparklesIcon, MagnifyingGlassIcon, FunnelIcon, ChatBubbleLeftRightIcon, ArrowRightIcon, PhotoIcon, VideoCameraIcon, DocumentIcon, MicrophoneIcon, FaceSmileIcon, MapPinIcon, UserIcon, PhoneIcon } from '@heroicons/react/24/outline';
import ContactSearch from '../components/contacts/ContactSearch';

export default function MessagesPage() {
  const { status } = useAuth();
  const [messages, setMessages] = useState([]);
  const [instances, setInstances] = useState([]);
  const [selectedInstance, setSelectedInstance] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const messagesPerPage = 20;

  // Cargar instancias del usuario
  useEffect(() => {
    if (status === 'authenticated') {
      fetchInstances();
      fetchMessages();
      setupWebSocket();
    }
  }, [status]);

  const fetchInstances = async () => {
    try {
      const res = await fetch('/api/instances');
      const data = await res.json();
      if (data.success) {
        setInstances(data.instances || []);
      }
    } catch (error) {
      console.error('Error al cargar instancias:', error);
      toast.error('Error al cargar instancias');
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/messages/all');
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
      toast.error('Error al cargar mensajes');
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocket = () => {
    const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000');

    socket.on('new_message', (message) => {
      setMessages(prev => [message, ...prev]);
      toast.success(`Nuevo mensaje de ${message.sender}`);
    });

    return () => socket.disconnect();
  };

  // Filtrar mensajes
  const filteredMessages = messages.filter(msg => {
    const matchesInstance = selectedInstance === 'all' || msg.instanceId === selectedInstance;
    const matchesSearch =
      msg.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.sender?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesInstance && matchesSearch;
  });

  // Paginación
  const indexOfLastMessage = currentPage * messagesPerPage;
  const indexOfFirstMessage = indexOfLastMessage - messagesPerPage;
  const currentMessages = filteredMessages.slice(indexOfFirstMessage, indexOfLastMessage);
  const totalPages = Math.ceil(filteredMessages.length / messagesPerPage);

  if (status === 'loading') {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  if (status === 'unauthenticated') {
    return <div className="flex items-center justify-center h-screen">Acceso denegado</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-800 p-6 sm:p-8">
      <Toaster richColors position="top-right" expand={true} closeButton />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">Mensajes Recibidos</h1>
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-100 to-cyan-100 dark:from-emerald-900/30 dark:to-cyan-900/30 rounded-full">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                {filteredMessages.length} mensajes
              </span>
            </div>
            {selectedInstance !== 'all' && (
              <span className="text-xs px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full font-medium">
                Filtrado
              </span>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg border border-gray-200 dark:border-zinc-700 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <FunnelIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Filtros</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Filtro por instancia */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2 flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="w-4 h-4 text-emerald-500" />
                Filtrar por instancia
              </label>
              <select
                value={selectedInstance}
                onChange={(e) => {
                  setSelectedInstance(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-zinc-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-zinc-700 text-gray-900 dark:text-white transition-all"
              >
                <option value="all">Todas las instancias ({instances.length})</option>
                {instances.map((instance) => (
                  <option key={instance.document_id} value={instance.document_id}>
                    {instance.name || instance.phone_number || instance.document_id}
                  </option>
                ))}
              </select>
            </div>

            {/* Búsqueda de Contactos */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2 flex items-center gap-2">
                <MagnifyingGlassIcon className="w-4 h-4 text-emerald-500" />
                Buscar contactos
              </label>
              {selectedInstance !== 'all' ? (
                <ContactSearch instanceId={selectedInstance} />
              ) : (
                <div className="w-full px-4 py-3 border-2 border-gray-300 dark:border-zinc-600 rounded-xl bg-gray-50 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400 text-center">
                  Selecciona una instancia para buscar contactos
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lista de mensajes */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-zinc-400 font-semibold">Cargando mensajes...</p>
            </div>
          </div>
        ) : currentMessages.length === 0 ? (
          <div className="text-center py-20">
            <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-800 dark:to-zinc-900 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-2xl max-w-md mx-auto">
              <ChatBubbleLeftRightIcon className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-zinc-500" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No hay mensajes</h3>
              <p className="text-gray-600 dark:text-zinc-400 text-sm">
                {searchTerm || selectedInstance !== 'all'
                  ? 'No se encontraron mensajes con los filtros aplicados'
                  : 'Aún no has recibido mensajes'}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {currentMessages.map((message, index) => (
                <MessageCard key={`${message.id}-${index}`} message={message} instances={instances} />
              ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center gap-4">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-6 py-3 bg-white dark:bg-zinc-800 border-2 border-gray-300 dark:border-zinc-700 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold text-gray-700 dark:text-white shadow-md hover:shadow-lg"
                >
                  ← Anterior
                </button>
                <div className="px-6 py-3 bg-gradient-to-r from-emerald-100 to-cyan-100 dark:from-emerald-900/30 dark:to-cyan-900/30 rounded-xl">
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    Página {currentPage} de {totalPages}
                  </span>
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-6 py-3 bg-white dark:bg-zinc-800 border-2 border-gray-300 dark:border-zinc-700 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold text-gray-700 dark:text-white shadow-md hover:shadow-lg"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Función para detectar el tipo de mensaje
function getMessageType(message) {
  // 1. Prioridad: usar el tipo que viene del backend
  if (message.type && message.type !== 'text' && message.type !== 'unknown') {
    return message.type.toLowerCase();
  }

  // 2. Detectar por contenido del mensaje si no viene del backend
  if (message.hasMedia || message.media) {
    if (message.mediaType) {
      return message.mediaType.toLowerCase();
    }
  }

  // 3. Detectar por el texto si dice [Mensaje multimedia]
  const text = message.text || '';
  if (text === '[Mensaje multimedia]' || text.startsWith('[') && text.endsWith(']')) {
    // Si el backend no envió tipo, intentar detectar
    if (message.mediaUrl) {
      const url = message.mediaUrl.toLowerCase();
      if (url.includes('image') || url.includes('.jpg') || url.includes('.png')) return 'image';
      if (url.includes('video') || url.includes('.mp4')) return 'video';
      if (url.includes('audio') || url.includes('.ogg') || url.includes('.mp3')) return 'audio';
      if (url.includes('document') || url.includes('.pdf')) return 'document';
    }
    return 'media';
  }

  // 4. Si tiene texto real, es texto
  if (text && text.length > 0 && !text.startsWith('[')) return 'text';

  // 5. Por defecto, texto
  return 'text';
}

// Función para obtener icono y label por tipo de mensaje
function getMessageTypeInfo(type) {
  const types = {
    text: { icon: ChatBubbleLeftRightIcon, label: 'Texto', color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-800' },
    sticker: { icon: FaceSmileIcon, label: 'Sticker', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
    audio: { icon: MicrophoneIcon, label: 'Audio', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
    voice: { icon: MicrophoneIcon, label: 'Nota de voz', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
    video: { icon: VideoCameraIcon, label: 'Video', color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    image: { icon: PhotoIcon, label: 'Imagen', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    document: { icon: DocumentIcon, label: 'Documento', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
    location: { icon: MapPinIcon, label: 'Ubicación', color: 'text-pink-600', bg: 'bg-pink-100 dark:bg-pink-900/30' },
    contact: { icon: UserIcon, label: 'Contacto', color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
    call: { icon: PhoneIcon, label: 'Llamada', color: 'text-cyan-600', bg: 'bg-cyan-100 dark:bg-cyan-900/30' },
    media: { icon: PhotoIcon, label: 'Multimedia', color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  };

  return types[type] || types.text;
}

// Componente para cada tarjeta de mensaje
function MessageCard({ message, instances }) {
  const instance = instances.find(i => i.document_id === message.instanceId);
  const instanceName = instance?.name || instance?.phone_number || 'Desconocida';

  // Detectar tipo de mensaje
  const messageType = getMessageType(message);
  const typeInfo = getMessageTypeInfo(messageType);
  const TypeIcon = typeInfo.icon;

  // Colores aleatorios basados en el instanceId para diferenciar visualmente
  const getInstanceColor = (id) => {
    const colors = [
      { gradient: 'from-blue-500 to-cyan-500', border: 'border-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
      { gradient: 'from-emerald-500 to-green-500', border: 'border-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
      { gradient: 'from-purple-500 to-pink-500', border: 'border-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
      { gradient: 'from-yellow-500 to-orange-500', border: 'border-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
      { gradient: 'from-pink-500 to-rose-500', border: 'border-pink-400', bg: 'bg-pink-50 dark:bg-pink-900/20' },
      { gradient: 'from-indigo-500 to-blue-500', border: 'border-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    ];
    const hash = id?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
    return colors[hash % colors.length];
  };

  const colorScheme = getInstanceColor(message.instanceId);

  return (
    <div className={`group bg-white dark:bg-zinc-800 rounded-2xl shadow-lg hover:shadow-2xl border-l-4 ${colorScheme.border} p-6 transition-all duration-300 hover:scale-[1.02]`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Header del mensaje */}
          <div className="flex items-center gap-4 mb-4">
            <div className={`flex-shrink-0 w-14 h-14 bg-gradient-to-br ${colorScheme.gradient} rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg ring-4 ring-white dark:ring-zinc-800`}>
              {message.sender?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{message.sender || 'Desconocido'}</h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400 flex items-center gap-1">
                <span>🕒</span>
                {new Date(message.timestamp).toLocaleString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          {/* Badge de tipo de mensaje */}
          <div className="mb-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${typeInfo.bg} ${typeInfo.color} border border-current/20`}>
              <TypeIcon className="w-4 h-4" />
              {typeInfo.label}
            </span>
          </div>

          {/* Contenido del mensaje */}
          <div className={`mb-4 p-4 ${colorScheme.bg} rounded-xl border border-gray-200 dark:border-zinc-700`}>
            <p className="text-gray-800 dark:text-white leading-relaxed">
              {message.text || `📎 [${typeInfo.label}]`}
            </p>
          </div>

          {/* Info de la instancia */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-100 to-cyan-100 dark:from-emerald-900/30 dark:to-cyan-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <ChatBubbleLeftRightIcon className="w-3 h-3" />
              {instanceName}
            </span>
            {message.chatId && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300">
                💬 {message.chatId.split('@')[0]}
              </span>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex-shrink-0">
          <button
            onClick={() => window.location.href = `/chat/${message.chatId}?instance=${message.instanceId}`}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transform hover:scale-105 active:scale-95 font-bold whitespace-nowrap"
          >
            Ver Chat
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
