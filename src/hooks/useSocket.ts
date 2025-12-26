import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';

// Construct Socket.IO base URL - same as API base URL (backend runs on port 8000)
const SOCKET_BASE = import.meta.env.VITE_API_BASE_URL || (() => {
  if (typeof window !== 'undefined') {
    try {
      const url = new URL(window.location.href);
      const hostname = url.hostname;
      const protocol = url.protocol;
      
      // In Replit, convert dev domain from 5000 port to 8000 port
      // E.g., c4077ec9-...-5000-...picard.replit.dev -> c4077ec9-...-8000-...picard.replit.dev
      if (hostname.includes('replit.dev')) {
        const backendDomain = hostname.replace(/-5000-/, '-8000-');
        return `${protocol}//${backendDomain}`;
      }
      
      // For localhost/127.0.0.1 development - use http://127.0.0.1:8000
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `${protocol}//127.0.0.1:8000`;
      }
      
      return `${protocol}//${hostname}:8000`;
    } catch {
      return 'http://127.0.0.1:8000';
    }
  }
  return 'http://127.0.0.1:8000';
})();

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    // Initialize socket connection to the same server as API
    socketRef.current = io(SOCKET_BASE, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    });

    // Join user's notification room
    socketRef.current.emit('join-notifications', user.id);

    // Log connection status
    socketRef.current.on('connect', () => {
      console.log('✅ Connected to Socket.IO server');
    });

    socketRef.current.on('disconnect', () => {
      console.log('🔌 Disconnected from Socket.IO server');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user?.id]);

  return socketRef.current;
}
