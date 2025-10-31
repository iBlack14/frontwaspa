'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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

  // Suscribirse a nuevos mensajes en tiempo real
  useEffect(() => {
    if (!supabase || !selectedInstance) return;

    const channel = supabase
      .channel('messages')
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
            setMessages((prev) => [...prev, payload.new]);
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
      setChats(response.data.chats || []);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  const fetchMessages = async (instanceId: string, chatId: string) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await axios.get(`${backendUrl}/api/messages/${instanceId}/${chatId}?limit=100`);
      setMessages(response.data.messages || []);
      
      // Marcar como leído
      await markAsRead(instanceId, chatId);
    } catch (error) {
      console.error('Error fetching messages:', error);
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
      audio.play().catch(() => {});
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
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mensajes</h1>
          <select
            value={selectedInstance || ''}
            onChange={(e) => setSelectedInstance(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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

      {/* Chat Interface */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat List */}
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <ChatList
            chats={chats}
            selectedChat={selectedChat}
            onSelectChat={setSelectedChat}
          />
        </div>

        {/* Chat Window */}
        <div className="flex-1">
          {selectedChat ? (
            <ChatWindow
              chat={selectedChat}
              messages={messages}
              onRefresh={() => fetchMessages(selectedChat.instance_id, selectedChat.chat_id)}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <p className="text-xl mb-2">Selecciona un chat para comenzar</p>
                <p className="text-sm">Tus mensajes aparecerán aquí</p>
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
