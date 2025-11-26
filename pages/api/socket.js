import { Server } from 'socket.io';

export default function SocketHandler(req, res) {
    if (res.socket.server.io) {
        console.log('Socket.io ya está inicializado');
        res.end();
        return;
    }

    console.log('Inicializando Socket.io...');
    const io = new Server(res.socket.server, {
        path: '/socket.io',
        addTrailingSlash: false,
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    res.socket.server.io = io;

    // Establecer instancia global para broadcastMessage
    global.io = io;

    io.on('connection', (socket) => {
        console.log('✅ Cliente conectado al WebSocket:', socket.id);

        // Unirse a una sala específica
        socket.on('join_room', (room) => {
            socket.join(room);
            console.log(`Cliente ${socket.id} unido a la sala: ${room}`);
        });

        // Manejar desconexión
        socket.on('disconnect', () => {
            console.log('❌ Cliente desconectado:', socket.id);
        });
    });

    console.log('✅ Socket.io inicializado correctamente');
    res.end();
}
