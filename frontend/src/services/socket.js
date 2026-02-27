import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect() {
    if (this.socket?.connected) return;

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
    }

    this.socket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      upgrade: true
    });

    this.socket.on('connect', () => {
      console.log('🔌 Socket.io connecté:', this.socket.id);
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket.io déconnecté');
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('⚠️ Erreur de connexion Socket.io:', error.message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  // Écouter un événement
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Se désabonner d'un événement
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Émettre un événement
  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }
}

const socketService = new SocketService();
export default socketService;
