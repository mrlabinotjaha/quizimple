const hostname = window.location.hostname;
const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

export const API_URL = isLocalhost
  ? 'http://localhost:8000/api'
  : `http://${hostname}:8000/api`;

export const WS_URL = isLocalhost
  ? 'ws://localhost:8000/ws'
  : `ws://${hostname}:8000/ws`;
