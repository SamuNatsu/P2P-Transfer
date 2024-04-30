/// Main entry
import express from 'express';

import { Socket } from 'socket.io';
import { Logger } from '@/logger';
import { app, httpServer, wsServer } from '@/server';
import { handleSession } from '@/session';

// Exception handler
process.addListener('uncaughtException', (err: Error): void => {
  Logger.error(`[Main] Uncaught exception:\n${err}`);
});
process.addListener('unhandledRejection', (reason: unknown): void => {
  Logger.error(`[Main] Unhandled rejection:\n${reason}`);
});

// Add routes
wsServer.on('connect', (socket: Socket): void => {
  Logger.info(`[WebSocket] Connected: ip=${socket.handshake.address}`);

  handleSession(socket);
});

// Server static files
app.use(express.static('public'));

// Start server
const port: number = Math.max(
  1,
  Math.min(parseInt(process.env.PORT ?? '3000'), 65535)
);
httpServer.listen(port, (): void => {
  Logger.info(`[Server] Start listening on port ${port}`);
});
