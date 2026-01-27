import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'sonner';
import Sidebar from '../../components/dashboard/index';
import ChatList from '../../components/messages/ChatList';
import ChatWindow from '../../components/messages/ChatWindow';

export interface Chat {
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

export interface Message {
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
  metadata?: any;
  status?: 'sending' | 'sent' | 'error'; // Optimistic UI status
  is_view_once?: boolean;
  view_once_opened_times?: string[]; // Frontend recibe fechas como strings
}

function MessagesContent() {
  const { session, status } = useAuth();
  const router = useRouter();
  const [instances, setInstances] = useState<any[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Cargar instancias
  useEffect(() => {
    if (status === 'authenticated') {
      fetchInstances();
    }
  }, [status]);

  // Cargar chats cuando se selecciona una instancia
  useEffect(() => {
    if (selectedInstance) {
      fetchChats(selectedInstance);
    }
  }, [selectedInstance]);

  // Cargar mensajes cuando se selecciona un chat
  useEffect(() => {
    if (selectedChat) {
      setMessages([]); // ⚡ UX: Limpiar chat anterior inmediatamente
      fetchMessages(selectedChat.instance_id, selectedChat.chat_id);
    }
  }, [selectedChat]);

  // 🔄 Polling: Garantiza que funcione SIEMPRE (cada 1s)
  useEffect(() => {
    if (!selectedInstance) return;

    const intervalId = setInterval(() => {
      fetchChats(selectedInstance);
      if (selectedChat) {
        fetchMessages(selectedChat.instance_id, selectedChat.chat_id, true);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [selectedInstance, selectedChat]);

  const fetchInstances = async () => {
    try {
      const response = await axios.get('/api/instances');
      setInstances(response.data.instances || []);

      // Seleccionar la primera instancia conectada por defecto
      const connectedInstance = response.data.instances.find((i: any) => i.state === 'Connected');
      if (connectedInstance) {
        setSelectedInstance(connectedInstance.document_id);
      }
    } catch (error) {
      console.error('Error fetching instances:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChats = async (instanceId: string) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await axios.get(`${backendUrl}/api/messages/chats/${instanceId}`);
      const rawChats: Chat[] = response.data.chats || [];

      // Helper para normalizar ID
      const normalizeId = (id: string) => {
        if (!id) return '';
        return id.replace(/@s\.whatsapp\.net/g, '').replace(/@g\.us/g, '').split(':')[0];
      };

      const uniqueChatsMap = new Map<string, Chat>();

      rawChats.forEach((chat) => {
        const cleanId = normalizeId(chat.chat_id);
        const existing = uniqueChatsMap.get(cleanId);

        if (!existing) {
          uniqueChatsMap.set(cleanId, chat);
        } else {
          const useNew = new Date(chat.last_message_at || 0).getTime() > new Date(existing.last_message_at || 0).getTime();

          const isInvalidName = (name?: string) => {
            if (!name) return true;
            const n = name.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const sessionName = (session as any)?.user?.name || 'User';
            const uName = sessionName.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const isSelfName = uName && n.includes(uName);
            return n === '.' || n === cleanId || isSelfName;
          };

          let finalChat = useNew ? chat : existing;

          if (isInvalidName(finalChat.chat_name)) {
            const otherChat = useNew ? existing : chat;
            if (!isInvalidName(otherChat.chat_name)) {
              finalChat = { ...finalChat, chat_name: otherChat.chat_name };
            } else {
              finalChat = { ...finalChat, chat_name: cleanId };
            }
          }

          uniqueChatsMap.set(cleanId, finalChat);
        }
      });

      const sortedChats = Array.from(uniqueChatsMap.values()).sort((a, b) => {
        return new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime();
      });

      setChats(sortedChats);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  const fetchMessages = async (instanceId: string, chatId: string, silent = false) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await axios.get(`${backendUrl}/api/messages/${instanceId}/${chatId}?limit=100`);

      setMessages((prevMessages) => {
        const newMessages = response.data.messages || [];
        if (JSON.stringify(prevMessages) !== JSON.stringify(newMessages)) {
          return newMessages;
        }
        return prevMessages;
      });

      if (!silent) {
        await markAsRead(instanceId, chatId);
      }
    } catch (error) {
      if (!silent) {
        console.error('Error fetching messages:', error);
      }
    }
  };

  const markAsRead = async (instanceId: string, chatId: string) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      await axios.post(`${backendUrl}/api/messages/mark-read`, {
        instanceId,
        chatId,
      });
      fetchChats(instanceId);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando mensajes...</p>
        </div>
      </div>
    );
  }

  if (instances.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No tienes instancias conectadas
          </p>
          <button
            onClick={() => router.push('/instances')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition"
          >
            Ir a Instancias
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#f0f2f5] dark:bg-[#111b21]">
      <div className="bg-[#f0f2f5] dark:bg-[#202c33] border-b border-[#d1d7db] dark:border-[#2a3942] px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-[#111b21] dark:text-[#e9edef]">Connect BLXK</h1>
          <select
            value={selectedInstance || ''}
            onChange={(e) => setSelectedInstance(e.target.value)}
            className="px-3 py-1.5 border border-[#d1d7db] dark:border-[#2a3942] rounded-lg bg-white dark:bg-[#2a3942] text-[#111b21] dark:text-[#e9edef] text-sm focus:outline-none focus:ring-2 focus:ring-[#00a884]"
          >
            {instances
              .filter((i) => i.state === 'Connected')
              .map((instance) => (
                <option key={instance.document_id} value={instance.document_id}>
                  {instance.profile_name || instance.phone_number || instance.document_id}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[30%] min-w-[300px] border-r border-[#d1d7db] dark:border-[#2a3942] overflow-hidden">
          <ChatList
            chats={chats}
            selectedChat={selectedChat}
            onSelectChat={setSelectedChat}
            instanceId={selectedInstance || ''}
          />
        </div>

        <div className="flex-1 bg-[#efeae2] dark:bg-[#0b141a]">
          {selectedChat ? (
            <ChatWindow
              chat={selectedChat}
              messages={messages}
              onRefresh={() => fetchMessages(selectedChat.instance_id, selectedChat.chat_id)}
            />
          ) : (
            <div className="flex flex-col h-full bg-[#f0f2f5] dark:bg-[#0b141a] relative overflow-hidden">
              <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
                <div className="absolute top-0 left-0 w-full h-full" style={{
                  backgroundImage: `radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
                                    radial-gradient(circle at 75% 75%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)`,
                }}></div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
                <div className="relative mb-6 group">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500 animate-pulse"></div>
                  <div className="relative w-24 h-24 bg-white dark:bg-[#202c33] rounded-full flex items-center justify-center shadow-xl border-2 border-indigo-100 dark:border-indigo-900/30 transform transition-transform group-hover:scale-110 duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-indigo-500 dark:text-indigo-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                    </svg>
                  </div>
                </div>

                <h2 className="text-4xl font-bold text-slate-800 dark:text-[#e9edef] mb-3 tracking-tight">
                  Connect BLXK Web
                </h2>
                <p className="text-slate-600 dark:text-[#8696a0] text-center max-w-lg mb-8 leading-relaxed text-lg">
                  Envía y recibe mensajes sin necesidad de mantener tu teléfono conectado.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl w-full mb-8">
                  <div className="bg-white dark:bg-[#202c33] rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-indigo-600 dark:text-indigo-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-slate-800 dark:text-[#e9edef] mb-2">Seguro</h3>
                    <p className="text-sm text-slate-500 dark:text-[#8696a0]">Cifrado de extremo a extremo en todos tus mensajes</p>
                  </div>

                  <div className="bg-white dark:bg-[#202c33] rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-purple-600 dark:text-purple-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-slate-800 dark:text-[#e9edef] mb-2">Multi-dispositivo</h3>
                    <p className="text-sm text-slate-500 dark:text-[#8696a0]">Usa hasta 4 dispositivos vinculados simultáneamente</p>
                  </div>

                  <div className="bg-white dark:bg-[#202c33] rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-pink-600 dark:text-pink-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-slate-800 dark:text-[#e9edef] mb-2">Rápido</h3>
                    <p className="text-sm text-slate-500 dark:text-[#8696a0]">Mensajería instantánea en tiempo real</p>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-slate-500 dark:text-[#8696a0] mb-4">
                    👈 Selecciona un chat para comenzar
                  </p>
                </div>
              </div>

              <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
            </div>
          )}
        </div >
      </div >
    </div >
  );
}

export default function MessagesPage() {
  return (
    <Sidebar>
      <MessagesContent />
    </Sidebar>
  );
}


// Force SSR to avoid static generation errors
export async function getServerSideProps() {
  return { props: {} };
}
