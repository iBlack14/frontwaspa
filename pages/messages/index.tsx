import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'sonner';
import Sidebar from '../components/dashboard/index';
import ChatList from '../../components/messages/ChatList';
import ChatWindow from '../../components/messages/ChatWindow';
import { createClient } from '@supabase/supabase-js';

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
}

function MessagesContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [instances, setInstances] = useState<any[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [supabase, setSupabase] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Inicializar Supabase
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const client = createClient(supabaseUrl, supabaseKey, {
        realtime: {
          params: {
            eventsPerSecond: 0  // Deshabilitar WebSocket
          }
        }
      });
      setSupabase(client);
    }
  }, []);

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
      fetchMessages(selectedChat.instance_id, selectedChat.chat_id);
    }
  }, [selectedChat]);

  // NOTA: Polling eliminado para evitar rate limit
  // Ahora usamos solo Supabase Realtime para actualizaciones en tiempo real

  // NOTA: Realtime deshabilitado para evitar errores de WebSocket
  // Las actualizaciones se manejan mediante polling o refetch manual
  /*
  useEffect(() => {
    if (!supabase || !selectedInstance) return;

    // Canal para nuevos mensajes
    const messagesChannel = supabase
      .channel(`messages-${selectedInstance}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `instance_id=eq.${selectedInstance}`,
        },
        (payload: any) => {
          console.log('🔔 Nuevo mensaje:', payload.new);

          // Si el mensaje es del chat actual, agregarlo
          if (selectedChat && payload.new.chat_id === selectedChat.chat_id) {
            setMessages((prev) => {
              // Evitar duplicados
              if (prev.some(m => m.message_id === payload.new.message_id)) {
                return prev;
              }
              return [...prev, payload.new].sort((a, b) =>
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
              );
            });
          }

          // Actualizar lista de chats
          fetchChats(selectedInstance);

          // Notificación sonora
          if (!payload.new.from_me) {
            playNotificationSound();
            toast.success(`Nuevo mensaje de ${payload.new.sender_name || 'Desconocido'}`);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `instance_id=eq.${selectedInstance}`,
        },
        (payload: any) => {
          console.log('📝 Mensaje actualizado:', payload.new);

          // Actualizar mensaje si es del chat actual
          if (selectedChat && payload.new.chat_id === selectedChat.chat_id) {
            setMessages((prev) =>
              prev.map(m => m.message_id === payload.new.message_id ? payload.new : m)
            );
          }

          // Actualizar lista de chats
          fetchChats(selectedInstance);
        }
      )
      .subscribe();

    // Canal para actualizaciones de chats
    const chatsChannel = supabase
      .channel(`chats-${selectedInstance}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
          filter: `instance_id=eq.${selectedInstance}`,
        },
        (payload: any) => {
          console.log('💬 Chat actualizado:', payload);
          // Actualizar lista de chats
          fetchChats(selectedInstance);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(chatsChannel);
    };
  }, [supabase, selectedInstance, selectedChat]);
  */

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

      // Deduplicate chats based on chat_id
      const uniqueChats = response.data.chats.reduce((acc: Chat[], current: Chat) => {
        const x = acc.find(item => item.chat_id === current.chat_id);
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
      }, []);

      setChats(uniqueChats || []);
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
        // Solo actualizar si hay cambios
        if (JSON.stringify(prevMessages) !== JSON.stringify(newMessages)) {
          return newMessages;
        }
        return prevMessages;
      });

      // Marcar como leído solo si no es silencioso
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

      // Actualizar lista de chats
      fetchChats(instanceId);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => { });
    } catch (error) {
      // Silenciar error si no hay sonido
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
      {/* Header - Estilo WhatsApp */}
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

      {/* Chat Interface - Layout WhatsApp */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat List */}
        <div className="w-[30%] min-w-[300px] border-r border-[#d1d7db] dark:border-[#2a3942] overflow-hidden">
          <ChatList
            chats={chats}
            selectedChat={selectedChat}
            onSelectChat={setSelectedChat}
            instanceId={selectedInstance}
          />
        </div>

        {/* Chat Window */}
        <div className="flex-1 bg-[#efeae2] dark:bg-[#0b141a]">
          {selectedChat ? (
            <ChatWindow
              chat={selectedChat}
              messages={messages}
              onRefresh={() => fetchMessages(selectedChat.instance_id, selectedChat.chat_id)}
            />
          ) : (
            <div className="flex flex-col h-full bg-[#f0f2f5] dark:bg-[#0b141a] relative overflow-hidden">
              {/* Main Content */}
              <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
                {/* Background Decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
                  <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>

                {/* Hero Icon */}
                <div className="relative mb-8 group">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                  <div className="relative w-32 h-32 bg-white dark:bg-[#202c33] rounded-full flex items-center justify-center shadow-lg border border-slate-100 dark:border-slate-700">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 text-indigo-500 dark:text-indigo-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                    </svg>
                  </div>
                </div>

                <h2 className="text-3xl font-bold text-slate-800 dark:text-[#e9edef] mb-3 tracking-tight">
                  Connect BLXK Web
                </h2>
                <p className="text-slate-500 dark:text-[#8696a0] text-center max-w-md mb-8 leading-relaxed">
                  Envía y recibe mensajes sin necesidad de mantener tu teléfono conectado.
                  <br />
                  Usa Connect BLXK en hasta 4 dispositivos vinculados.
                </p>

                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-[#202c33] rounded-full text-xs font-medium text-slate-500 dark:text-[#8696a0]">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                    <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                  </svg>
                  Cifrado de extremo a extremo
                </div>
              </div>

              {/* Footer Decoration */}
              <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80"></div>
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
