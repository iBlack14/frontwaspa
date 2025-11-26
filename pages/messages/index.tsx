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
      const client = createClient(supabaseUrl, supabaseKey);
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

  // Suscripción en tiempo real a mensajes y chats (sin polling)
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
            <div className="flex items-center justify-center h-full bg-[#f0f2f5] dark:bg-[#222e35] border-b-8 border-[#25d366]">
              <div className="text-center max-w-md px-6">
                <div className="w-64 h-64 mx-auto mb-8 opacity-20">
                  <svg viewBox="0 0 303 172" fill="currentColor" className="text-[#00a884] w-full h-full">
                    <path d="M151.5 0C67.9 0 0 67.9 0 151.5S67.9 303 151.5 303 303 235.1 303 151.5 235.1 0 151.5 0zm0 276.5c-69 0-125-56-125-125s56-125 125-125 125 56 125 125-56 125-125 125z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-light text-[#41525d] dark:text-[#e9edef] mb-4">
                  Connect BLXK Web
                </h2>
                <p className="text-sm text-[#667781] dark:text-[#8696a0] mb-8 leading-6">
                  Envía y recibe mensajes sin necesidad de mantener tu teléfono conectado.
                  <br />
                  Usa Connect BLXK en hasta 4 dispositivos vinculados y 1 teléfono a la vez.
                </p>
                <div className="flex items-center justify-center gap-2 text-[#8696a0] text-xs">
                  <span className="w-3 h-3 bg-[#8696a0] rounded-full opacity-30"></span>
                  🔒 Tus mensajes personales están cifrados de extremo a extremo
                </div>
              </div>
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
