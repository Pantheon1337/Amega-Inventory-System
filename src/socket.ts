// Для работы требуется: npm install socket.io-client
import { io } from 'socket.io-client';
import { SOCKET_URL } from './config';

const socket = io(SOCKET_URL);

export function subscribeToDBUpdates(callback: (data: any) => void) {
  socket.on('db_update', callback);
}

export function unsubscribeFromDBUpdates(callback: (data: any) => void) {
  socket.off('db_update', callback);
} 