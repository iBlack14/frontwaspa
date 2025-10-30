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

// Función para enviar mensajes a una sala específica
export function broadcastMessage(room, message) {
  if (io) {
    io.to(room).emit('new_message', message);
  } else {
    console.warn('Socket.io no está inicializado');
  }
}

// Función para obtener la instancia de io
export function getIO() {
  if (!io) {
    throw new Error('Socket.io no está inicializado');
  }
  return io;
}
