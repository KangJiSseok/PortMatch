// src/utils/openviduToken.ts
export function patchOpenViduToken(token: string) {
  const publicUrl = import.meta.env.VITE_OPENVIDU_PUBLIC_URL as string | undefined;
  if (!publicUrl) return token;

  try {
    const t = new URL(token);      // wss://localhost/openvidu?sessionId=...&token=...
    const p = new URL(publicUrl);  // https://i14d205.p.ssafy.io:5443

    // protocol: https -> wss, http -> ws
    t.protocol = p.protocol === 'https:' ? 'wss:' : p.protocol === 'http:' ? 'ws:' : t.protocol;

    // host(도메인+포트) 교체
    t.host = p.host;

    return t.toString();
  } catch {
    return token;
  }
}
