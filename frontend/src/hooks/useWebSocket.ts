import { useEffect, useRef, useCallback, useState } from 'react';
import { WSMessage } from '../types';
import { WS_URL } from '../config';

interface UseWebSocketOptions {
  roomCode: string;
  token: string | null;
  guestName?: string | null;
  guestId?: string | null;
  onMessage: (message: WSMessage) => void;
}

export function useWebSocket({ roomCode, token, guestName, guestId, onMessage }: UseWebSocketOptions) {
  const ws = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  const [isConnected, setIsConnected] = useState(false);
  const mountedRef = useRef(true);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intentionalClose = useRef(false);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    if (!roomCode) return;
    if (!token && !guestName) return;
    if (!mountedRef.current) return;

    const params = new URLSearchParams();
    if (token) {
      params.set('token', token);
    } else if (guestName) {
      params.set('guest_name', guestName);
      if (guestId) {
        params.set('guest_id', guestId);
      }
    }

    const websocket = new WebSocket(`${WS_URL}/${roomCode}?${params.toString()}`);
    ws.current = websocket;

    websocket.onopen = () => {
      if (!mountedRef.current) { websocket.close(); return; }
      setIsConnected(true);
      reconnectAttempts.current = 0;
    };

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      onMessageRef.current(message);
    };

    websocket.onclose = () => {
      setIsConnected(false);
      if (!mountedRef.current || intentionalClose.current) return;

      // Auto-reconnect with exponential backoff
      const attempt = reconnectAttempts.current;
      if (attempt < 5) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        reconnectTimer.current = setTimeout(() => {
          reconnectAttempts.current++;
          connect();
        }, delay);
      }
    };

    websocket.onerror = () => {
      // onclose will fire after this
    };
  }, [roomCode, token, guestName, guestId]);

  useEffect(() => {
    mountedRef.current = true;
    intentionalClose.current = false;
    reconnectAttempts.current = 0;
    connect();

    return () => {
      mountedRef.current = false;
      intentionalClose.current = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (ws.current) ws.current.close();
    };
  }, [connect]);

  const sendMessage = useCallback((event: string, data: Record<string, unknown> = {}) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ event, data }));
    }
  }, []);

  return { sendMessage, isConnected };
}
