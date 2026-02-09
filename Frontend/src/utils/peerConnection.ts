// src/utils/peerConnection.ts
import Peer from 'peerjs';

const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' },
];

export function createPeer() {
  const host = import.meta.env.VITE_PEERJS_HOST ?? window.location.hostname;
  const port = Number(
    import.meta.env.VITE_PEERJS_PORT ?? (window.location.protocol === 'https:' ? 443 : 80)
  );
  const secure =
    typeof import.meta.env.VITE_PEERJS_SECURE === 'string'
      ? import.meta.env.VITE_PEERJS_SECURE === 'true'
      : window.location.protocol === 'https:';
  const path = import.meta.env.VITE_PEERJS_PATH ?? '/';

  return new Peer({
    host,
    port,
    path,
    secure,
    debug: 2,
    config: {
      iceServers: DEFAULT_ICE_SERVERS,
    },
  });
}
