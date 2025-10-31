import { Chat } from '../../pages/messages';
import { UserIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface ChatListProps {
  chats: Chat[];
  selectedChat: Chat | null;
  onSelectChat: (chat: Chat) => void;
}

export default function ChatList({ chats, selectedChat, onSelectChat }: ChatListProps) {
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

  const pinnedChats = chats.filter(c => c.is_pinned && !c.is_archived);
  const regularChats = chats.filter(c => !c.is_pinned && !c.is_archived);

  return (
    <div className="h-full bg-white dark:bg-gray-800">
      {/* Search */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <input
          type="text"
          placeholder="Buscar chats..."
          className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Chats */}
      <div className="overflow-y-auto">
        {/* Pinned */}
        {pinnedChats.length > 0 && (
          <div>
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
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
            No hay chats disponibles
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
      className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
        isSelected ? 'bg-gray-100 dark:bg-gray-700' : ''
      }`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {chat.profile_pic_url ? (
          <img
            src={chat.profile_pic_url}
            alt={chat.chat_name || 'Chat'}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center">
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
        <div className="flex justify-between items-baseline">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
            {chat.chat_name || chat.chat_id}
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
            {formatTime(chat.last_message_at)}
          </span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {chat.last_message_text || 'Sin mensajes'}
          </p>
          {chat.unread_count > 0 && (
            <span className="ml-2 bg-emerald-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {chat.unread_count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
