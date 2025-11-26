import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { io } from 'socket.io-client';

const MessageNotifier = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Inicializar conexión con el servidor Socket.io
    const socketInstance = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000', {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Manejar eventos de conexión
    socketInstance.on('connect', () => {
      console.log('Conectado al servidor de WebSocket');
      setIsConnected(true);

      // Unirse a la sala del usuario actual (si está autenticado)
      const userId = localStorage.getItem('userId');
      if (userId) {
        socketInstance.emit('join_room', `user_${userId}`);
      }
    });

    // Manejar mensajes entrantes
    socketInstance.on('new_message', (message) => {
      console.log('Nuevo mensaje recibido:', message);

      // Obtener ID de instancia actual de la URL
      // Asumimos ruta: /instance/[id] o similar
      const pathParts = window.location.pathname.split('/');
      const currentInstanceId = pathParts.includes('instance') ? pathParts[pathParts.indexOf('instance') + 1] : null;

      // Lógica de notificación inteligente
      const isDifferentInstance = message.instanceId && message.instanceId !== currentInstanceId;

      // Si es de otra instancia, mostrar con opción de cambiar
      if (isDifferentInstance) {
        toast.info(`Mensaje en otra instancia: ${message.sender}`, {
          description: message.text,
          duration: 8000,
          action: {
            label: 'Cambiar Instancia',
            onClick: () => window.location.href = `/instance/${message.instanceId}/chat`
          },
        });
        playNotificationSound();
      }
      // Si es la misma instancia pero no estamos en el chat
      else if (!window.location.pathname.includes(message.chatId)) {
        toast.success(`Nuevo mensaje de ${message.sender}`, {
          description: message.text,
          duration: 5000,
          action: {
            label: 'Ver',
            onClick: () => window.location.href = `/instance/${message.instanceId}/chat` // Asumiendo ruta unificada
          },
        });
        playNotificationSound();
      }
    });

    // Manejar errores de conexión
    socketInstance.on('connect_error', (error) => {
      console.error('Error de conexión con WebSocket:', error);
      setIsConnected(false);
    });

    // Limpieza al desmontar el componente
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  const playNotificationSound = () => {
    // Usar un sonido de notificación por defecto si no hay uno personalizado
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.5; // Volumen al 50%
    audio.play().catch(e => console.log('Error al reproducir sonido:', e));
  };

  // Opcional: Mostrar estado de conexión para depuración
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className={`p-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
          title={isConnected ? 'Conectado al servidor' : 'Desconectado'}>
          <span className="sr-only">
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
      </div>
    );
  }

  return null; // No renderizar nada en producción
};

export default MessageNotifier;
