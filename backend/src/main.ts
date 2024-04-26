/// Main entry
import express from 'express';
import stream from 'stream';

import { WebSocket } from 'ws';
import { app, httpServer, wsServer } from '@/server';
import { handleSession } from '@/session';
import { Logger } from '@/logger';

// Add routes
wsServer.addListener(
  'connection',
  (ws: WebSocket, req: express.Request): void => {
    // Get remote address
    const remoteAddr: string = `[${req.socket.remoteAddress}:${req.socket.remotePort}]`;
    Logger.info(`[WebSocket] Connected: ${remoteAddr}`);

    // Handle session
    handleSession(ws, remoteAddr);
  }
);

// Server static files
app.use(express.static('public'));

// Handle upgrade request
httpServer.on(
  'upgrade',
  (request: express.Request, socket: stream.Duplex, head: Buffer): void => {
    wsServer.handleUpgrade(request, socket, head, (socket: WebSocket): void => {
      wsServer.emit('connection', socket, request);
    });
  }
);

// Start server
const port: number = parseInt(process.env.PORT ?? '3000');
httpServer.listen(port, (): void => {
  Logger.info(`[Server] Start listening on port ${port}`);
});
