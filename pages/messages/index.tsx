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
      let rawChats: Chat[] = response.data.chats || [];

      // Ordenar por fecha (más reciente primero)
      rawChats.sort((a, b) => {
        return new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime();
      });

      setChats(rawChats);
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
    <div className="h-screen flex flex-col bg-gradient-to-b from-white/50 to-slate-50/50 dark:from-slate-900/30 dark:to-slate-950/30">
      {/* Header Premium Responsive */}
      <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 px-3 sm:px-4 md:px-6 py-3 sm:py-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          {/* Logo y título */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 sm:w-6 h-5 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1 sm:flex-none">
              <h1 className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-white truncate">Connect BLXK</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Mensajería profesional</p>
            </div>
          </div>

          {/* Controles */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end flex-wrap">
            {/* Instance Selector */}
            <div className="relative group">
              <select
                value={selectedInstance || ''}
                onChange={(e) => setSelectedInstance(e.target.value)}
                className="px-2.5 sm:px-4 py-2 sm:py-2.5 border border-slate-200/50 dark:border-slate-700/50 rounded-lg sm:rounded-xl bg-white dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all duration-300 shadow-sm appearance-none pr-8 sm:pr-10 cursor-pointer max-w-xs sm:max-w-none"
              >
                {instances
                  .filter((i) => i.state === 'Connected')
                  .map((instance) => (
                    <option key={instance.document_id} value={instance.document_id}>
                      {instance.profile_name || instance.phone_number || instance.document_id.substring(0, 8)}
                    </option>
                  ))}
              </select>
              <svg className="pointer-events-none absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>

            {/* Quick Actions */}
            <button className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-all duration-300 shadow-sm border border-slate-200/50 dark:border-slate-700/50 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 sm:w-5 h-4 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 4.5h3m-3 3h3" />
              </svg>
            </button>
            
            <button className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-all duration-300 shadow-sm border border-slate-200/50 dark:border-slate-700/50 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 sm:w-5 h-4 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 11-3 0m3 0H3m0 0h21m0 0v1.6a2.25 2.25 0 01-2.25 2.25H2.25A2.25 2.25 0 010 7.6V6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden gap-0">
        {/* Chat List Sidebar */}
        <div className="w-full sm:w-[45%] md:w-[35%] lg:w-[28%] xl:w-[25%] min-w-[280px] border-r border-slate-200/50 dark:border-slate-800/50 overflow-hidden bg-white/30 dark:bg-slate-900/20 backdrop-blur-sm max-h-[calc(100vh-120px)]">
          <ChatList
            chats={chats}
            selectedChat={selectedChat}
            onSelectChat={setSelectedChat}
            instanceId={selectedInstance || ''}
          />
        </div>

        {/* Chat Window */}
        <div className="hidden sm:flex flex-1 bg-gradient-to-br from-white/40 via-slate-50/30 to-slate-100/20 dark:from-slate-900/10 dark:via-slate-900/5 dark:to-slate-950/10 max-h-[calc(100vh-120px)]">
          {selectedChat ? (
            <ChatWindow
              chat={selectedChat}
              messages={messages}
              onRefresh={() => fetchMessages(selectedChat.instance_id, selectedChat.chat_id)}
            />
          ) : (
            <div className="flex flex-col h-full relative overflow-hidden">
              {/* Background decorativo */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-200 dark:bg-indigo-900/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-200 dark:bg-purple-900/20 rounded-full blur-3xl"></div>
              </div>

              {/* Contenido */}
              <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
                {/* Logo/Icon animado */}
                <div className="relative mb-8 group">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur-2xl opacity-0 group-hover:opacity-25 transition-opacity duration-500 animate-pulse"></div>
                  <div className="relative w-28 h-28 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-3xl flex items-center justify-center shadow-2xl border-2 border-indigo-200/50 dark:border-indigo-800/30 transform transition-transform group-hover:scale-110 duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-14 h-14 text-indigo-600 dark:text-indigo-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-1.804 9-4.023V12c0 2.219-4.03 4.023-9 4.023s-9-1.804-9-4.023V8.25m0 0C3 10.219 7.03 12 12 12s9-1.804 9-4.023M3 8.25v4.5C3 15.804 7.03 17.625 12 17.625c.16 0 .319-.004.477-.012M3 8.25c0-2.219 4.03-4.023 9-4.023s9 1.804 9 4.023" />
                    </svg>
                  </div>
                </div>

                {/* Textos principales */}
                <h2 className="text-5xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight text-center">
                  Selecciona un chat
                </h2>
                <p className="text-slate-600 dark:text-slate-300 text-center max-w-xl mb-12 leading-relaxed text-lg font-medium">
                  Elige una conversación del listado para comenzar. Tendrás acceso completo a todo tu historial de mensajes.
                </p>

                {/* Tarjetas de características */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full mb-12">
                  <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/30 hover:shadow-xl hover:bg-white/70 dark:hover:bg-slate-800/60 transition-all duration-300 transform hover:-translate-y-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/40 dark:to-indigo-900/20 rounded-xl flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-indigo-600 dark:text-indigo-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-white mb-2 text-sm">Cifrado E2E</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Todos tus mensajes están protegidos con cifrado de extremo a extremo</p>
                  </div>

                  <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/30 hover:shadow-xl hover:bg-white/70 dark:hover:bg-slate-800/60 transition-all duration-300 transform hover:-translate-y-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/40 dark:to-purple-900/20 rounded-xl flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-purple-600 dark:text-purple-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-white mb-2 text-sm">Gestión Profesional</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Herramientas avanzadas para manejar múltiples conversaciones</p>
                  </div>

                  <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/30 hover:shadow-xl hover:bg-white/70 dark:hover:bg-slate-800/60 transition-all duration-300 transform hover:-translate-y-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-pink-50 dark:from-pink-900/40 dark:to-pink-900/20 rounded-xl flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-pink-600 dark:text-pink-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-white mb-2 text-sm">Tiempo Real</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Sincronización instantánea de mensajes y estado</p>
                  </div>
                </div>

                {/* CTA */}
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M15.75 6H20.25a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75H3.75a.75.75 0 01-.75-.75V6.75a.75.75 0 01.75-.75h4.5" />
                    </svg>
                    Selecciona una conversación para empezar
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
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
