import { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { logger } from '@/utils/logger';
import { useSession } from 'next-auth/react';

interface UseWebSocketOptions {
  instanceId?: string;
  onNewMessage?: (message: any) => void;
  onInstanceStateChange?: (data: { instanceId: string; state: string }) => void;
  onChatUpdate?: (data: any) => void;
  onTyping?: (data: { chatId: string; isTyping: boolean }) => void;
  onPresenceUpdate?: (data: { chatId: string; isOnline: boolean }) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) return;

    // URL del backend WebSocket
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

    logger.websocket(`Connecting to ${backendUrl}`);

    // Conectar al WebSocket
    const socket = io(backendUrl, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Eventos de conexión
    socket.on('connect', () => {
      logger.success('WebSocket connected', 'websocket');
      setIsConnected(true);
      setError(null);

      // Autenticar usuario
      socket.emit('authenticate', {
        userId: (session.user as any).id,
      });

      // Unirse a instancia si está especificada
      if (options.instanceId) {
        socket.emit('join_instance', {
          instanceId: options.instanceId,
        });
      }
    });

    socket.on('disconnect', () => {
      logger.warn('WebSocket disconnected', 'websocket');
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      logger.error(`Connection error: ${err.message}`, 'websocket');
      setError(err.message);
      setIsConnected(false);
    });

    socket.on('authenticated', (data) => {
      logger.success('WebSocket authenticated', 'websocket', data);
    });

    // Eventos personalizados
    if (options.onNewMessage) {
      socket.on('new_message', options.onNewMessage);
    }

    if (options.onInstanceStateChange) {
      socket.on('instance_state_change', options.onInstanceStateChange);
    }

    if (options.onChatUpdate) {
      socket.on('chat_update', options.onChatUpdate);
    }

    if (options.onTyping) {
      socket.on('user_typing', options.onTyping);
    }

    if (options.onPresenceUpdate) {
      socket.on('presence_update', options.onPresenceUpdate);
    }

    socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      setError(error.message);
    });

    // Cleanup
    return () => {
      if (options.instanceId) {
        socket.emit('leave_instance', {
          instanceId: options.instanceId,
        });
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [session, options.instanceId]);

  // Funciones helper
  const joinInstance = (instanceId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_instance', { instanceId });
    }
  };

  const leaveInstance = (instanceId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave_instance', { instanceId });
    }
  };

  const emitTyping = (instanceId: string, chatId: string, isTyping: boolean) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing', { instanceId, chatId, isTyping });
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    error,
    joinInstance,
    leaveInstance,
    emitTyping,
  };
}
