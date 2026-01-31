import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserIcon, UserGroupIcon, MagnifyingGlassIcon, ArrowLeftIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

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
  last_message_type?: string;
}

interface Contact {
  jid: string;
  name: string;
  pushName?: string;
  profilePicUrl?: string;
}

interface ChatListProps {
  chats: Chat[];
  selectedChat: Chat | null;
  onSelectChat: (chat: Chat) => void;
  instanceId: string | null;
}

// Función helper fuera del componente para que sea accesible por ChatItem
const formatTime = (timestamp?: string) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 86400000) { // Menos de 24 horas
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
};

export default function ChatList({ chats, selectedChat, onSelectChat, instanceId }: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'chats' | 'groups' | 'channels' | 'status'>('all');

  const filteredChats = chats.filter(chat => {
    if (activeTab === 'all') return true;
    if (activeTab === 'status') return chat.chat_id === 'status@broadcast';
    if (activeTab === 'channels') return chat.chat_id.endsWith('@newsletter');
    if (activeTab === 'groups') return chat.chat_id.endsWith('@g.us');
    if (activeTab === 'chats') {
      // Solo chats individuales (ni grupos, ni canales, ni estados)
      return !chat.chat_id.endsWith('@g.us') &&
        chat.chat_id !== 'status@broadcast' &&
        !chat.chat_id.endsWith('@newsletter');
    }
    return true;
  });

  const pinnedChats = filteredChats.filter(c => c.is_pinned && !c.is_archived);
  const regularChats = filteredChats.filter(c => !c.is_pinned && !c.is_archived);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim() && instanceId) {
        setIsSearching(true);
        try {
          const res = await axios.get(`/api/contacts?instanceId=${instanceId}&search=${searchQuery}`);
          setSearchResults(res.data.contacts || []);
        } catch (error: any) {
          console.error('Error searching contacts:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, instanceId]);

  const handleSelectContact = (contact: Contact) => {
    // Verificar si ya existe un chat con este contacto
    const existingChat = chats.find(c => c.chat_id === contact.jid);

    if (existingChat) {
      onSelectChat(existingChat);
    } else {
      // Crear objeto de chat temporal
      const newChat: Chat = {
        id: contact.jid, // Temporal ID
        instance_id: instanceId || '',
        chat_id: contact.jid,
        chat_name: contact.name || contact.pushName || contact.jid.split('@')[0],
        chat_type: 'individual',
        profile_pic_url: contact.profilePicUrl,
        unread_count: 0,
        is_archived: false,
        is_pinned: false
      };
      onSelectChat(newChat);
    }
    // Limpiar búsqueda (opcional, depende de UX deseada)
    // setSearchQuery('');
  };

  return (
    <div className="h-full bg-[#f8fafc] dark:bg-[#0f172a] flex flex-col border-r border-slate-200 dark:border-slate-800">
      {/* Search - Pastel Design */}
      <div className="flex-shrink-0 p-4 pb-2 bg-white/80 backdrop-blur-md dark:bg-[#1e293b]/80 sticky top-0 z-10">
        <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-2.5 flex items-center transition-all focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900 focus-within:bg-white dark:focus-within:bg-slate-900 shadow-sm">
          <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 dark:text-slate-500 mr-3" />
          <input
            type="text"
            placeholder="Buscar o iniciar un chat"
            className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 border-none focus:outline-none w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex-shrink-0 px-4 pt-1 pb-4 bg-white/80 backdrop-blur-md dark:bg-[#1e293b]/80 border-b border-slate-100 dark:border-slate-800 flex gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'all', label: 'Todos' },
          { id: 'chats', label: 'Chats' },
          { id: 'groups', label: 'Grupos' },
          { id: 'channels', label: 'Canales' },
          { id: 'status', label: 'Estados' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${activeTab === tab.id
              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-200 dark:shadow-none'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chats or Search Results */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {searchQuery ? (
          // Resultados de búsqueda
          <div className="pb-4">
            <div className="px-5 py-3 text-xs font-bold text-indigo-500 dark:text-indigo-400 tracking-wider uppercase bg-transparent">
              Resultados de búsqueda
            </div>
            {isSearching ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((contact) => (
                <div
                  key={contact.jid}
                  onClick={() => handleSelectContact(contact)}
                  className="group mx-2 mb-1 rounded-xl p-3 cursor-pointer hover:bg-white/60 dark:hover:bg-[#1e293b]/60 hover:shadow-sm transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {contact.profilePicUrl ? (
                        <img
                          src={contact.profilePicUrl}
                          alt={contact.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-[#0f172a]"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center border-2 border-white dark:border-[#0f172a]">
                          <UserIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[15px] text-slate-800 dark:text-slate-200 truncate">
                        {contact.name || contact.pushName || contact.jid.split('@')[0]}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                        {contact.jid.split('@')[0]}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                <p className="text-sm">No se encontraron contactos</p>
              </div>
            )}
          </div>
        ) : (
          // Lista de chats normal
          <>
            {/* Pinned */}
            {pinnedChats.length > 0 && (
              <div className="mb-2">
                <div className="px-5 py-3 text-xs font-bold text-indigo-500 dark:text-indigo-400 tracking-wider uppercase bg-transparent">
                  Fijados
                </div>
                {pinnedChats.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isSelected={selectedChat?.id === chat.id}
                    onClick={() => onSelectChat(chat)}
                  />
                ))}
              </div>
            )}

            {/* Regular */}
            <div className="pb-4">
              {activeTab !== 'all' && filteredChats.length > 0 && (
                <button
                  onClick={() => setActiveTab('all')}
                  className="mx-4 my-2 text-xs font-semibold text-indigo-500 hover:text-indigo-600 flex items-center gap-1"
                >
                  <ArrowLeftIcon className="w-3 h-3" />
                  Volver a todos
                </button>
              )}

              {pinnedChats.length > 0 && <div className="px-5 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">Recientes</div>}
              {regularChats.map((chat) => {
                // INTERCEPTAR ESTADOS para mejorar visualización
                if (chat.chat_id === 'status@broadcast') {
                  return (
                    <ChatItem
                      key={chat.id}
                      chat={{
                        ...chat,
                        chat_name: 'Estados / Historias',
                        profile_pic_url: undefined // Forzar icono por defecto
                      }}
                      isStatus={true} // Flag especial
                      isSelected={selectedChat?.id === chat.id}
                      onClick={() => onSelectChat(chat)}
                    />
                  );
                }

                return (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isSelected={selectedChat?.id === chat.id}
                    onClick={() => onSelectChat(chat)}
                  />
                );
              })}
            </div>

            {/* Empty States per Tab */}
            {filteredChats.length === 0 && (
              <div className="text-center py-12 px-6 flex flex-col items-center">
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-3">
                  {activeTab === 'status' ? (
                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-400"></div>
                  ) : activeTab === 'channels' ? (
                    <div className="w-8 h-8 rounded-lg border-2 border-slate-400"></div>
                  ) : (
                    <MagnifyingGlassIcon className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                  {activeTab === 'status' ? 'No hay estados recientes' :
                    activeTab === 'channels' ? 'No hay canales o newsletters' :
                      activeTab === 'chats' ? 'No hay conversaciones' :
                        'No se encontraron chats'}
                </p>
                <p className="text-xs text-slate-400 max-w-[200px] mb-4">
                  {activeTab === 'status' ? 'Las actualizaciones de estado de tus contactos aparecerán aquí.' :
                    activeTab === 'channels' ? 'Los mensajes de canales a los que sigues aparecerán aquí.' :
                      'Tus chats personales y grupos aparecerán aquí.'}
                </p>

                {activeTab !== 'all' && (
                  <button
                    onClick={() => setActiveTab('all')}
                    className="text-xs font-bold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-lg transition-colors"
                  >
                    Ver Todos los Chats
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ... (interfaces logic remains same)

// Definición correcta de ChatItem al final del archivo o fuera del export default
function ChatItem({ chat, isSelected, onClick, isStatus }: { chat: Chat; isSelected: boolean; onClick: () => void; isStatus?: boolean }) {
  // Determinar texto de previsualización
  const getPreviewText = () => {
    if (isStatus) return 'Nueva actualización de estado';

    const text = chat.last_message_text;
    const type = chat.last_message_type || (chat as any).last_message_type;

    // Si el texto es genérico "[Media]" o vacío, o tenemos un tipo específico, intentamos mejorar
    if (!text || text === '[Media]' || text === '📎 Archivo' || type) {
      if (type === 'view_once_image' || text?.includes('Ver una vez')) return '🔐 Foto (Ver una vez)';
      if (type === 'view_once_video') return '🔐 Video (Ver una vez)';
      if (type === 'image') return '🖼️ Foto';
      if (type === 'video') return '🎥 Video';
      if (type === 'audio' || type === 'voice' || type === 'ptt') return '🎤 Nota de voz';
      if (type === 'sticker') return '🎨 Sticker';
      if (type === 'document') return '📄 Documento';
      if (type === 'location') return '📍 Ubicación';
      if (type === 'contact') return '👤 Contacto';
    }

    // Si tenemos un tipo, devolver la etiqueta correspondiente
    if (type) {
      if (type === 'view_once_image' || text?.includes('Ver una vez')) return '🔐 Foto (Ver una vez)';
      if (type === 'view_once_video') return '🔐 Video (Ver una vez)';
      if (type === 'image') return '📷 Foto';
      if (type === 'video') return '🎥 Video';
      if (type === 'audio' || type === 'voice' || type === 'ptt') return '🎤 Nota de voz';
      if (type === 'sticker') return '🎨 Sticker';
      if (type === 'document') return '📄 Documento';
      if (type === 'location') return '📍 Ubicación';
      if (type === 'contact') return '👤 Contacto';
    }

    return text && text !== '[Media]' ? text : '📎 Archivo multimedia';
  };

  return (
    <div
      onClick={onClick}
      className={`group mx-2 mb-1 rounded-xl p-3 cursor-pointer transition-all duration-200 border border-transparent ${isSelected
        ? 'bg-white dark:bg-[#1e293b] shadow-md border-indigo-50 dark:border-indigo-900/50 translate-x-1'
        : 'hover:bg-white/60 dark:hover:bg-[#1e293b]/60 hover:shadow-sm'
        }`}
    >
      <div className="flex items-center gap-3">
        {/* Avatar - Pastel Ring */}
        <div className="flex-shrink-0 relative">
          <div className={`p-0.5 rounded-full ${isSelected ? 'bg-gradient-to-tr from-indigo-400 to-purple-400' : 'bg-transparent'}`}>
            {chat.profile_pic_url ? (
              <img
                src={chat.profile_pic_url}
                alt={chat.chat_name || 'Chat'}
                className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-[#0f172a]"
              />
            ) : (
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 border-white dark:border-[#0f172a] ${isStatus
                ? 'bg-gradient-to-br from-pink-100 to-rose-200 dark:from-pink-900/30 dark:to-rose-900/30'
                : 'bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800'}`}>

                {isStatus ? (
                  <div className="relative">
                    <div className="absolute inset-0 bg-pink-400 rounded-full animate-ping opacity-20"></div>
                    <SparklesIcon className="w-6 h-6 text-pink-500 dark:text-pink-400" />
                  </div>
                ) : chat.chat_type === 'group' ? (
                  <UserGroupIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                ) : (
                  <UserIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                )}
              </div>
            )}
          </div>
          {/* Online Status Indicator */}
          {!isStatus && (
            <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-white dark:border-[#0f172a] rounded-full shadow-sm">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline mb-1">
            <h3 className={`font-medium text-[15px] truncate max-w-[70%] ${
              isSelected
                ? 'text-indigo-900 dark:text-indigo-100'
                : 'text-slate-800 dark:text-slate-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-300'
            }`}>
              {chat.chat_name || chat.chat_id.split('@')[0]}
            </h3>
            <span className={`text-[11px] flex-shrink-0 ${
              chat.unread_count > 0
                ? 'text-indigo-500 font-semibold'
                : 'text-slate-400 dark:text-slate-500'
            }`}>
              {formatTime(chat.last_message_at)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <p className={`text-[13px] truncate max-w-[85%] flex items-center ${
              isSelected
                ? 'text-indigo-700/80 dark:text-indigo-300/80'
                : 'text-slate-500 dark:text-slate-400'
            }`}>
              {getPreviewText()}
            </p>
            
            {chat.unread_count > 0 && (
              <span className="flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 bg-indigo-500 text-white text-[10px] font-bold rounded-full shadow-sm shadow-indigo-200 dark:shadow-none animate-in zoom-in duration-200">
                {chat.unread_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
