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
    <div className="h-full bg-[#f0f2f5] dark:bg-[#111b21] flex flex-col">
      {/* Search - Estilo WhatsApp */}
      <div className="p-2 bg-white dark:bg-[#202c33]">
        <div className="bg-[#f0f2f5] dark:bg-[#202c33] rounded-lg px-4 py-2 flex items-center">
          <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar o iniciar un chat"
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 border-none focus:outline-none"
          />
        </div>
      </div>

      {/* Chats */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-[#111b21]">
        {/* Pinned */}
        {pinnedChats.length > 0 && (
          <div>
            <div className="px-4 py-2 text-xs font-medium text-[#00a884] dark:text-[#00a884] bg-white dark:bg-[#111b21]">
              FIJADOS
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
        {regularChats.map((chat) => (
          <ChatItem
            key={chat.id}
            chat={chat}
            isSelected={selectedChat?.id === chat.id}
            onClick={() => onSelectChat(chat)}
          />
        ))}

        {chats.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
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
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-100 dark:border-[#202c33] transition-colors ${
        isSelected 
          ? 'bg-[#f0f2f5] dark:bg-[#2a3942]' 
          : 'bg-white dark:bg-[#111b21] hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]'
      }`}
    >
      {/* Avatar - Estilo WhatsApp */}
      <div className="flex-shrink-0 relative">
        {chat.profile_pic_url ? (
          <img
            src={chat.profile_pic_url}
            alt={chat.chat_name || 'Chat'}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-[#6b7c85] dark:bg-[#6b7c85] flex items-center justify-center">
            {chat.chat_type === 'group' ? (
              <UserGroupIcon className="w-6 h-6 text-white" />
            ) : (
              <UserIcon className="w-6 h-6 text-white" />
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-medium text-[15px] text-[#111b21] dark:text-[#e9edef] truncate">
            {chat.chat_name || chat.chat_id}
          </h3>
          <span className="text-xs text-[#667781] dark:text-[#8696a0] ml-2 flex-shrink-0">
            {formatTime(chat.last_message_at)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-sm text-[#667781] dark:text-[#8696a0] truncate flex-1">
            {chat.last_message_text || '📎 Archivo multimedia'}
          </p>
          {chat.unread_count > 0 && (
            <span className="ml-2 bg-[#00a884] text-white text-xs font-semibold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
              {chat.unread_count > 99 ? '99+' : chat.unread_count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
