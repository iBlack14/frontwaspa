const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Crear aplicación Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Inicializar servidor HTTP
app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Configurar Socket.io
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Manejar conexiones de Socket.io
  io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado');

    // Unirse a una sala específica para recibir actualizaciones
    socket.on('join_room', (room) => {
      socket.join(room);
      console.log(`Cliente unido a la sala: ${room}`);
    });

    // Manejar desconexión
    socket.on('disconnect', () => {
      console.log('Cliente desconectado');
    });
  });

  // Hacer que io esté disponible globalmente
  global.io = io;

  // Iniciar servidor
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Servidor listo en http://${hostname}:${port}`);
  });
});
