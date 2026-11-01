import { io } from 'socket.io-client';
import { getToken } from './api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 8,
  reconnectionDelay: 500,
  reconnectionDelayMax: 5000,
  timeout: 10000,
});

export function connectSocket(): void {
  const token = getToken();
  if (!token) {
    console.warn('Cannot connect Socket.IO: user is not logged in.');
    return;
  }
  // Socket.IO reuses this auth object on automatic reconnects.
  socket.auth = { token };
  if (!socket.connected) socket.connect();
}

export function disconnectSocket(): void {
  if (socket.connected || socket.active) socket.disconnect();
}

socket.on('connect', () => console.log('Socket.IO connected:', socket.id));
socket.on('connect_error', (error) => console.error('Socket.IO connection error:', error.message));
