/// Main entrance
import express from 'express';
import { readFileSync } from 'fs';
import http from 'http';
import https from 'https';
import { PORT, SSL, SSL_CERT, SSL_KEY } from './config';
import { Server, Socket } from 'socket.io';

/* Express application */
const app: express.Application = express();

/* SSL contents */
let cert: string = '';
let key: string = '';
if (SSL) {
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

/* Websocket callback */
io.on('connection', (socket: Socket): void => {
  console.log(`New connection: ${socket.id}`);
  sessions.set(socket.id, socket);

  const handle: NodeJS.Timeout = setTimeout((): void => {
    console.log(`Connection timeout: ${socket.id}`);
    socket.disconnect(true);
  }, 300000);

  socket.on('disconnect', (): void => {
    clearTimeout(handle);
    sessions.delete(socket.id);
    console.log(`Disconnected: ${socket.id}`);
  });
  socket.on('offer', (pack: { peerId: string; data: any }): void => {
    console.log(`Offer: ${socket.id} -> ${pack.peerId}`);
    sessions.get(pack.peerId)?.emit('offer', {
      ...pack,
      peerId: socket.id
    });
  });
  socket.on('answer', (pack: { peerId: string; data: any }): void => {
    console.log(`Answer: ${socket.id} -> ${pack.peerId}`);
    sessions.get(pack.peerId)?.emit('answer', {
      ...pack,
      peerId: socket.id
    });
  });
  socket.on('candidate', (pack: { peerId: string; data: any }): void => {
    console.log(`Candidate: ${socket.id} -> ${pack.peerId}`);
    sessions.get(pack.peerId)?.emit('candidate', {
      ...pack,
      peerId: socket.id
    });
  });
});

/* Serve static pages */
app.use(express.static('./www'));

/* Start server */
server.listen(PORT, (): void => {
  console.log(`Server listening on port ${PORT}`);
});
