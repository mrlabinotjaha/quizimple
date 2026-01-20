const hostname = window.location.hostname;
const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

// Use environment variable if set, otherwise fall back to localhost
const apiBase = import.meta.env.VITE_API_URL;
const wsBase = import.meta.env.VITE_WS_URL;

export const API_URL = apiBase
  ? `${apiBase}/api`
  : isLocalhost
    ? 'http://localhost:8000/api'
    : `https://${hostname}/api`;

export const WS_URL = wsBase
  ? `${wsBase}/ws`
  : isLocalhost
    ? 'ws://localhost:8000/ws'
    : `wss://${hostname}/ws`;
