import { io, Socket } from 'socket.io-client';
import { getToken } from './api';

const URL = import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export type CollaborationEvent = {
  eventUuid: string;
  entityType: 'object' | 'annotation' | 'comment';
  entityId: string;
  operation: 'create' | 'update' | 'delete' | 'transform' | 'assign' | 'status' | 'visibility' | 'reply';
  entityVersion: number;
  payload: Record<string, unknown>;
};

export function createCollaborationClient(projectId: number, userName: string) {
  const token = getToken();
  if (!token) throw new Error('Authentication token is missing');
  const clientId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  const socket: Socket = io(URL, {
    autoConnect: false,
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 4000,
  });
  let joined = false;
  let lastSequence = 0;
  const pending: CollaborationEvent[] = [];

  const emitAck = (event: string, payload: unknown) => new Promise<any>((resolve, reject) => {
    if (!socket.connected) return reject(new Error('Collaboration socket is disconnected'));
    socket.timeout(8000).emit(event, payload, (error: Error | null, result: any) => {
      if (error) reject(error);
      else if (result?.ok === false) reject(new Error(result.message || 'Collaboration request failed'));
      else resolve(result);
    });
  });

  socket.on('connect', async () => {
    try {
      const result = await emitAck('join-project', { projectId, clientId, userName });
      if (!result?.ok) throw new Error(result?.message || 'Could not join project');
      joined = true;
      socket.emit('collaboration-message', { type: 'sync-request', projectId, afterSequence: lastSequence });
      for (const event of pending.splice(0)) {
        try { await emitAck('collaboration-message', { type: 'collab-operation', projectId, ...event }); }
        catch { pending.unshift(event); break; }
      }
    } catch (error) { console.error('Collaboration join/recovery failed:', error); }
  });
  socket.on('disconnect', () => { joined = false; });

  return {
    socket,
    connect() { socket.auth = { token: getToken() }; socket.connect(); },
    async publish(event: CollaborationEvent) {
      if (!joined) { pending.push(event); return { queued: true }; }
      return emitAck('collaboration-message', { type: 'collab-operation', projectId, ...event });
    },
    cursor(cursor: { x: number; y: number; z: number }) {
      if (joined) socket.volatile.emit('collaboration-message', { type: 'cursor', projectId, cursor });
    },
    onEvent(handler: (event: any) => void) {
      const listener = (message: any) => {
        if (message?.type === 'sync-response' && Array.isArray(message.events)) {
          for (const event of message.events) {
            lastSequence = Math.max(lastSequence, Number(event.event_id) || 0);
            handler({ ...event, type: 'collab-operation' });
          }
        } else if (message?.type === 'collab-operation') {
          lastSequence = Math.max(lastSequence, Number(message.sequence) || 0);
          handler(message);
        } else if (message?.type === 'cursor') handler(message);
      };
      socket.on('collaboration-message', listener);
      return () => socket.off('collaboration-message', listener);
    },
    disconnect() { if (socket.connected) socket.emit('leave-project', projectId); socket.disconnect(); },
  };
}
