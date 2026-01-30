// src/utils/openviduToken.ts
export function patchOpenViduToken(token: string) {
  const publicUrl = import.meta.env.VITE_OPENVIDU_PUBLIC_URL as string | undefined;
  if (!publicUrl) return token;

  try {
    const t = new URL(token); // wss://localhost/openvidu?sessionId=...&token=...

    // ws/wss 프로토콜 유지, :4443 제거 + /openvidu 고정
    t.port = '';
    t.pathname = '/openvidu';

    return t.toString();
  } catch {
    return token;
  }
}
