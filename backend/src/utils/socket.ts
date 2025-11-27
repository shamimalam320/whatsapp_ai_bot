import { Server } from 'socket.io';
import http from 'http';

let io: Server | null = null;

export function initSocket(server: http.Server) {
  if (io) return io;
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET','POST']
    }
  });

  io.on('connection', (socket) => {
    // Allow client to join a business room
    socket.on('join', (room: string) => {
      socket.join(room);
    });
  });

  return io;
}

export function getIo() {
  return io;
}
