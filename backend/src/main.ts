/// Main entrance
import express from 'express';
import { readFileSync } from 'fs';
import http from 'http';
import https from 'https';
import { PORT, SSL, SSL_CERT, SSL_KEY } from './config';
import { DisconnectReason, Server, Socket } from 'socket.io';
import { customAlphabet } from 'nanoid';

/* Express application */
const app: express.Application = express();

/* SSL contents */
let cert: string = '';
let key: string = '';
if (SSL) {
  console.log('[Server] SSL enabled');
  cert = readFileSync(SSL_CERT, 'utf-8');
  key = readFileSync(SSL_KEY, 'utf-8');
}

/* HTTP(S) server */
const server: http.Server | https.Server = SSL
  ? https.createServer({ cert, key }, app)
  : http.createServer(app);

/* Socket.io server */
const io: Server = new Server(server);
const sessions: Map<string, Socket> = new Map();
const pairs: Map<string, string> = new Map();

const nanoid: (size?: number) => string = customAlphabet(
  '346789ABCDEFGHJKLMNPQRTUVWXYabcdefghijkmnpqrtwxyz'
);
function createId(): string {
  while (true) {
    const id: string = nanoid(8);
    if (!sessions.has(id)) {
      return id;
    }
  }
}

/* Websocket callback */
io.on('connection', (socket: Socket): void => {
  const id: string = createId();

  console.log(`[Websocket] New connection: ${id}`);
  sessions.set(id, socket);

  socket.on('error', (err: Error): void => {
    console.error(err);
    console.error(`[Websocket] Error: ${id}`);
  });
  socket.on('disconnect', (reason: DisconnectReason): void => {
    sessions.delete(id);
    pairs.delete(id);
    console.log(`[Websocket] Disconnected: ${id} (${reason})`);
  });

  socket.on('request', (peerId: string): void => {
    if (typeof peerId !== 'string') {
      socket.disconnect();
      return;
    }
    if (!sessions.has(peerId)) {
      socket.emit('not_exists');
      return;
    }
    if (pairs.has(peerId) && pairs.get(peerId) !== id) {
      socket.emit('paired');
      return;
    } else {
      pairs.set(peerId, id);
    }
    sessions.get(peerId)?.emit('request', id);
    console.log(`[Websocket] Info request: ${id} -> ${peerId}`);
  });
  socket.on('response', (peerId: string, data: any): void => {
    if (typeof peerId !== 'string') {
      socket.disconnect();
      return;
    }
    if (!sessions.has(peerId)) {
      socket.emit('not_exists');
      return;
    }
    sessions.get(peerId)?.emit('response', id, data);
    console.log(`[Websocket] Info response: ${id} -> ${peerId}`);
  });

  socket.on('offer', (peerId: string, data: any): void => {
    if (typeof peerId !== 'string') {
      socket.disconnect();
      return;
    }
    if (!sessions.has(peerId)) {
      socket.emit('not_exists');
      return;
    }
    sessions.get(peerId)?.emit('offer', id, data);
    console.log(`[Websocket] WebRTC offer: ${id} -> ${peerId}`);
  });
  socket.on('answer', (peerId: string, data: any): void => {
    if (typeof peerId !== 'string') {
      socket.disconnect();
      return;
    }
    if (!sessions.has(peerId)) {
      socket.emit('not_exists');
      return;
    }
    sessions.get(peerId)?.emit('answer', id, data);
    console.log(`[Websocket] WebRTC answer: ${id} -> ${peerId}`);
  });
  socket.on('candidate', (peerId: string, data: any): void => {
    if (typeof peerId !== 'string') {
      socket.disconnect();
      return;
    }
    if (!sessions.has(peerId)) {
      socket.emit('not_exists');
      return;
    }
    sessions.get(peerId)?.emit('candidate', id, data);
    console.log(`[Websocket] WebRTC candidate: ${id} -> ${peerId}`);
  });

  socket.on('retry', (peerId: string): void => {
    if (typeof peerId !== 'string') {
      socket.disconnect();
      return;
    }
    if (!sessions.has(peerId)) {
      socket.emit('not_exists');
      return;
    }
    sessions.get(peerId)?.emit('retry', id);
    console.log(`[Websocket] Retry signal: ${id} -> ${peerId}`);
  });
  socket.on('rtc_fail', (peerId: string): void => {
    if (typeof peerId !== 'string' || !sessions.has(peerId)) {
      socket.disconnect();
      return;
    }
    sessions.get(peerId)?.emit('rtc_fail', id);
    console.log(`[Websocket] Fail signal: ${id} -> ${peerId}`);
  });

  socket.emit('assign', id);
});

/* Serve static pages */
app.use(express.static('./www'));

/* Start server */
server.listen(PORT, (): void => {
  console.log(`[Server] Start listening on port ${PORT}`);
});
