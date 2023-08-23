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
    console.error(`[Sebsocket] Error: ${id}`);
    console.error(err);
  });
  socket.on('disconnect', (reason: DisconnectReason): void => {
    console.log(`[Websocket] Disconnected: ${id} (${reason})`);
    sessions.delete(id);
  });

  socket.on('request', (peerId: string): void => {
    if (typeof peerId !== 'string') {
      return;
    }

    console.log(`[Websocket] Info request: ${id} -> ${peerId}`);
    sessions.get(peerId)?.emit('request', id);
  });
  socket.on('response', (peerId: string, data: any): void => {
    if (typeof peerId !== 'string') {
      return;
    }

    console.log(`[Websocket] Info response: ${id} -> ${peerId}`);
    sessions.get(peerId)?.emit('response', id, data);
  });

  socket.on('offer', (peerId: string, data: any): void => {
    if (typeof peerId !== 'string') {
      return;
    }

    console.log(`[Websocket] WebRTC offer: ${id} -> ${peerId}`);
    sessions.get(peerId)?.emit('offer', id, data);
  });
  socket.on('answer', (peerId: string, data: any): void => {
    if (typeof peerId !== 'string') {
      return;
    }

    console.log(`[Websocket] WebRTC answer: ${id} -> ${peerId}`);
    sessions.get(peerId)?.emit('answer', id, data);
  });
  socket.on('candidate', (peerId: string, data: any): void => {
    if (typeof peerId !== 'string') {
      return;
    }

    console.log(`[Websocket] WebRTC candidate: ${id} -> ${peerId}`);
    sessions.get(peerId)?.emit('candidate', id, data);
  });

  socket.on('retry', (peerId: string): void => {
    if (typeof peerId !== 'string') {
      return;
    }

    console.log(`[Websocket] Retry signal: ${id} -> ${peerId}`);
    sessions.get(peerId)?.emit('retry', id);
  });
  socket.on('done', (peerId: string): void => {
    if (typeof peerId !== 'string') {
      return;
    }

    console.log(`[Websocket] Done signal: ${id} -> ${peerId}`);
    sessions.get(peerId)?.emit('done', id);
  });

  socket.emit('assign', id);
});

/* Serve static pages */
app.use(express.static('./www'));

/* Start server */
server.listen(PORT, (): void => {
  console.log(`[Server] Start listening on port ${PORT}`);
});
