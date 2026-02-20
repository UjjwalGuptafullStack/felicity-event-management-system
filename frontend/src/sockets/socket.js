import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

let _socket = null;

export const getSocket = () => {
  if (_socket?.connected) return _socket;

  const token = localStorage.getItem('token');

  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }

  _socket = io(BACKEND_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return _socket;
};

export const destroySocket = () => {
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }
};
