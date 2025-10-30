import { Server } from 'socket.io';

// Configuración de Socket.io
const SocketHandler = (req, res) => {
  if (res.socket.server.io) {
    console.log('Socket ya está inicializado');
  } else {
    console.log('Inicializando Socket.io');
    
    // Crear servidor HTTP si no existe
    const httpServer = res.socket.server;
    const io = new Server(httpServer, {
      path: '/api/ws',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    // Manejar conexiones
    io.on('connection', (socket) => {
      console.log('Nuevo cliente conectado a la API de WebSocket');

      // Unirse a una sala específica
      socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`Cliente unido a la sala: ${room}`);
      });

      // Manejar mensajes
      socket.on('send_message', (data) => {
        console.log('Mensaje recibido:', data);
        // Reenviar mensaje a todos en la sala
        io.to(data.room).emit('receive_message', data);
      });

      // Manejar desconexión
      socket.on('disconnect', () => {
        console.log('Cliente desconectado');
      });
    });

    // Hacer que io esté disponible globalmente
    res.socket.server.io = io;
  }
  
  res.end();
};

export default SocketHandler;
