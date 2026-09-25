import net from 'node:net';
import { randomBytes, randomUUID } from 'node:crypto';

const companyBase = 'http://localhost:18081';
const applicantBase = 'http://localhost:18082';

async function request(base, path, options = {}) {
  const response = await fetch(base + path, options);
  const text = await response.text();
  if (!response.ok) throw new Error(`${response.status} ${path}: ${text}`);
  return { data: text ? JSON.parse(text) : null, cookie: response.headers.get('set-cookie')?.split(';')[0] };
}

async function session(base, path, signup, role) {
  await fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(signup) });
  const login = await request(base, '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: signup.email, password: signup.password, expectedRole: role }) });
  const me = await request(base, '/api/auth/me', { headers: { cookie: login.cookie } });
  return { cookie: login.cookie, id: me.data.data.userId };
}

function websocket(port, cookie) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(port, '127.0.0.1');
    const key = randomBytes(16).toString('base64');
    let buffer = Buffer.alloc(0);
    let upgraded = false;
    const listeners = [];
    const frames = [];
    const fail = setTimeout(() => reject(new Error('WebSocket handshake timeout')), 10000);
    socket.once('connect', () => socket.write([
      'GET /ws/chat HTTP/1.1', `Host: localhost:${port}`, 'Upgrade: websocket', 'Connection: Upgrade',
      `Sec-WebSocket-Key: ${key}`, 'Sec-WebSocket-Version: 13', 'Origin: http://localhost:5173', `Cookie: ${cookie}`, '', ''
    ].join('\r\n')));
    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      if (!upgraded) {
        const end = buffer.indexOf('\r\n\r\n');
        if (end < 0) return;
        const headers = buffer.subarray(0, end).toString();
        if (!headers.startsWith('HTTP/1.1 101')) return reject(new Error(`upgrade failed: ${headers}`));
        upgraded = true; buffer = buffer.subarray(end + 4); clearTimeout(fail);
        resolve({
          send(text) {
            const payload = Buffer.from(text); const mask = randomBytes(4);
            const length = payload.length < 126 ? Buffer.from([0x81, 0x80 | payload.length])
              : Buffer.from([0x81, 0xfe, payload.length >> 8, payload.length & 255]);
            const masked = Buffer.from(payload); for (let i = 0; i < masked.length; i++) masked[i] ^= mask[i % 4];
            socket.write(Buffer.concat([length, mask, masked]));
          },
          waitFor(predicate, timeout = 10000) {
            return new Promise((done, nope) => {
              const ready = frames.find(predicate);
              if (ready) return done(ready);
              const entry = { predicate, done }; listeners.push(entry);
              setTimeout(() => nope(new Error('STOMP frame timeout')), timeout);
            });
          },
          close: () => socket.end(),
        });
      }
      while (upgraded && buffer.length >= 2) {
        const sizeCode = buffer[1] & 0x7f; let offset = 2; let size = sizeCode;
        if (sizeCode === 126) { if (buffer.length < 4) return; size = buffer.readUInt16BE(2); offset = 4; }
        if (buffer.length < offset + size) return;
        const text = buffer.subarray(offset, offset + size).toString(); buffer = buffer.subarray(offset + size);
        frames.push(text);
        for (const listener of [...listeners]) if (listener.predicate(text)) { listeners.splice(listeners.indexOf(listener), 1); listener.done(text); }
      }
    });
    socket.on('error', reject);
  });
}

const password = 'Password1';
const applicant = await session(applicantBase, '/api/accounts/signup/applicant',
  { name: 'STOMP Applicant', email: 'stomp-applicant@experiment.local', password, phone: '010-3333-3333' }, 'APPLICANT');
const company = await session(companyBase, '/api/accounts/signup/company',
  { email: 'stomp-company@experiment.local', password, managerName: 'STOMP Company', managerPhone: '010-4444-4444', companyName: 'STOMP Company', businessNumber: '234-56-78901', address: 'experiment' }, 'COMPANY');
const room = await request(companyBase, '/api/chat/rooms', { method: 'POST', headers: { cookie: company.cookie, 'content-type': 'application/json' },
  body: JSON.stringify({ targetUserId: applicant.id }) });
const roomId = room.data.data.id;
const client = await websocket(18082, applicant.cookie);
client.send('CONNECT\naccept-version:1.2\nheart-beat:0,0\n\n\0');
await client.waitFor((frame) => frame.startsWith('CONNECTED'));
client.send(`SUBSCRIBE\nid:room-0\nack:auto\ndestination:/topic/chat.rooms.${roomId}\n\n\0`);
await new Promise((done) => setTimeout(done, 300));
const marker = `stomp-cross-was-${randomUUID()}`;
await request(companyBase, `/api/chat/rooms/${roomId}/messages`, { method: 'POST', headers: { cookie: company.cookie, 'content-type': 'application/json' },
  body: JSON.stringify({ clientMessageId: randomUUID(), content: marker, messageType: 'TEXT', testRunId: 'stomp-cross-was' }) });
const frame = await client.waitFor((value) => value.startsWith('MESSAGE') && value.includes(marker), 15000);
client.close();
console.log(JSON.stringify({ passed: true, senderWas: 'backend1:18081', subscriberWas: 'backend2:18082', roomId, marker, destination: `/topic/chat.rooms.${roomId}`, frameBytes: Buffer.byteLength(frame) }, null, 2));
