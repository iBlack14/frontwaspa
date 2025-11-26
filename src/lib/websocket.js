import { Server } from 'socket.io';

let io;

// Inicializar Socket.io
export function initWebSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado al WebSocket');

    // Unirse a una sala específica para recibir actualizaciones
    socket.on('join_room', (room) => {
      socket.join(room);
      console.log(`Cliente unido a la sala: ${room}`);
    });

    // Manejar desconexión
    socket.on('disconnect', () => {
      console.log('Cliente desconectado del WebSocket');
    });
  });

  return io;
}

// Función para enviar mensajes a TODOS los clientes conectados
export function broadcastMessage(message) {
  // En Next.js, el servidor Socket.io se guarda en res.socket.server.io
  // Necesitamos acceder a él de forma global
  if (global.io) {
    global.io.emit('new_message', message);
    console.log('[WEBSOCKET] Mensaje broadcast enviado:', message.type);
  } else {
    console.warn('[WEBSOCKET] Socket.io no está inicializado aún');
  }
}

// Función para obtener la instancia de io
export function getIO() {
  if (!global.io) {
    console.warn('[WEBSOCKET] Socket.io no está inicializado');
    return null;
  }
  return global.io;
}

// Función para establecer la instancia global de io
export function setIO(ioInstance) {
  global.io = ioInstance;
  console.log('[WEBSOCKET] Socket.io establecido globalmente');
}
