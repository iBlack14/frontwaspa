import { UserIcon, UserGroupIcon } from '@heroicons/react/24/outline';

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

interface ChatListProps {
  chats: Chat[];
  selectedChat: Chat | null;
  onSelectChat: (chat: Chat) => void;
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

export default function ChatList({ chats, selectedChat, onSelectChat }: ChatListProps) {

  const pinnedChats = chats.filter(c => c.is_pinned && !c.is_archived);
  const regularChats = chats.filter(c => !c.is_pinned && !c.is_archived);

  return (
    <div className="h-full bg-[#f8fafc] dark:bg-[#0f172a] flex flex-col border-r border-slate-200 dark:border-slate-800">
      {/* Search - Pastel Design */}
      <div className="p-4 bg-white/80 backdrop-blur-md dark:bg-[#1e293b]/80 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">
        <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-2.5 flex items-center transition-all focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900 focus-within:bg-white dark:focus-within:bg-slate-900 shadow-sm">
          <svg className="w-5 h-5 text-slate-400 dark:text-slate-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar o iniciar un chat"
            className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 border-none focus:outline-none"
          />
        </div>
      </div>

      {/* Chats */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
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
