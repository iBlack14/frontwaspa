import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserIcon, UserGroupIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
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
  const [activeTab, setActiveTab] = useState<'all' | 'chats' | 'channels' | 'status'>('all');

  const filteredChats = chats.filter(chat => {
    if (activeTab === 'all') return true;
    if (activeTab === 'status') return chat.chat_id === 'status@broadcast';
    if (activeTab === 'channels') return chat.chat_id.endsWith('@newsletter');
    if (activeTab === 'chats') {
      return chat.chat_id !== 'status@broadcast' && !chat.chat_id.endsWith('@newsletter');
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
      <div className="p-4 bg-white/80 backdrop-blur-md dark:bg-[#1e293b]/80 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">
        <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-2.5 flex items-center transition-all focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900 focus-within:bg-white dark:focus-within:bg-slate-900 shadow-sm">
          <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 dark:text-slate-500 mr-3" />
          <input
            type="text"
            placeholder="Buscar o iniciar un chat"
            className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 border-none focus:outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 pb-2 bg-white/80 backdrop-blur-md dark:bg-[#1e293b]/80 border-b border-slate-100 dark:border-slate-800 flex gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'all', label: 'Todos' },
          { id: 'chats', label: 'Chats' },
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
              {pinnedChats.length > 0 && <div className="px-5 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">Recientes</div>}
              {regularChats.map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isSelected={selectedChat?.id === chat.id}
                  onClick={() => onSelectChat(chat)}
                />
              ))}
            </div>

            {chats.length === 0 && (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                <p className="text-sm">No hay chats disponibles</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ChatItem({ chat, isSelected, onClick }: { chat: Chat; isSelected: boolean; onClick: () => void }) {
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
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center border-2 border-white dark:border-[#0f172a]">
                {chat.chat_type === 'group' ? (
                  <UserGroupIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                ) : (
                  <UserIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                )}
              </div>
            )}
          </div>
          {/* Online Status Indicator - Green Dot with Pulse */}
          <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-white dark:border-[#0f172a] rounded-full shadow-sm">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-0.5">
            <h3 className={`font-semibold text-[15px] truncate transition-colors ${isSelected ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-800 dark:text-slate-200'}`}>
              {chat.chat_name || chat.chat_id}
            </h3>
            <span className={`text-xs ml-2 flex-shrink-0 font-medium ${chat.unread_count > 0 ? 'text-indigo-500' : 'text-slate-400 dark:text-slate-500'}`}>
              {formatTime(chat.last_message_at)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <p className={`text-sm truncate flex-1 ${isSelected ? 'text-indigo-600/80 dark:text-indigo-300/80' : 'text-slate-500 dark:text-slate-400'}`}>
              {chat.last_message_text || '📎 Archivo multimedia'}
            </p>
            {chat.unread_count > 0 && (
              <span className="ml-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center shadow-sm shadow-indigo-200 dark:shadow-none">
                {chat.unread_count > 99 ? '99+' : chat.unread_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
