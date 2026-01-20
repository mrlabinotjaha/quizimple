import { useEffect, useRef, useCallback, useState } from 'react';
import { WSMessage } from '../types';
import { WS_URL } from '../config';

interface UseWebSocketOptions {
  roomCode: string;
  token: string | null;
  guestName?: string | null;
  onMessage: (message: WSMessage) => void;
}

export function useWebSocket({ roomCode, token, guestName, onMessage }: UseWebSocketOptions) {
  const ws = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  const [isConnected, setIsConnected] = useState(false);

  // Keep the callback ref up to date
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!roomCode) return;
    if (!token && !guestName) return;

    // Build connection URL with either token or guest_name
    const params = new URLSearchParams();
    if (token) {
      params.set('token', token);
    } else if (guestName) {
      params.set('guest_name', guestName);
    }
    const websocket = new WebSocket(`${WS_URL}/${roomCode}?${params.toString()}`);
    ws.current = websocket;

    websocket.onopen = () => {
      setIsConnected(true);
    };

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      onMessageRef.current(message);
    };

    websocket.onclose = () => {
      setIsConnected(false);
    };

    websocket.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      websocket.close();
    };
  }, [roomCode, token, guestName]);

  const sendMessage = useCallback((event: string, data: Record<string, unknown> = {}) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ event, data }));
    }
  }, []);

  return { sendMessage, isConnected };
}
