const hostname = window.location.hostname;
const protocol = window.location.protocol;
const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

// Use environment variable if set, otherwise use same-origin URLs
const apiBase = import.meta.env.VITE_API_URL;
const wsBase = import.meta.env.VITE_WS_URL;

export const API_URL = apiBase
  ? apiBase
  : isLocalhost
    ? 'http://localhost:8000/api'
    : `${protocol}//${window.location.host}/api`;

export const WS_URL = wsBase
  ? wsBase
  : isLocalhost
    ? 'ws://localhost:8000/ws'
    : `${protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;
