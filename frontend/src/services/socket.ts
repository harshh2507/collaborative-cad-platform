
import { io } from 'socket.io-client';
import { getToken } from './api';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
});

export function connectSocket(): void {
  const token = getToken();

  if (!token) {
    console.warn('Cannot connect Socket.IO: user is not logged in.');
    return;
  }

  socket.auth = { token };
  
  if (!socket.connected) {
    socket.connect();
  }
}

export function disconnectSocket(): void {
  if (socket.connected) {
    socket.disconnect();
  }
}

socket.on('connect', () => {
  console.log('Socket.IO connected:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('Socket.IO connection error:', error.message);
});