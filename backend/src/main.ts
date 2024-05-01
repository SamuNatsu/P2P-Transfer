/// Main entry
import express from 'express';
import { Socket } from 'socket.io';

import { Logger } from '@/logger';
import { app, httpServer, receiverNsp, senderNsp } from '@/server';
import { handleReceiver, handleSender } from '@/session';

// Exception handler
process.addListener('uncaughtException', (err: Error): void => {
  Logger.error(`[Main] Uncaught exception:\n${err}`);
});
process.addListener('unhandledRejection', (reason: unknown): void => {
  Logger.error(`[Main] Unhandled rejection:\n${reason}`);
});

// WebSocket connection handler
senderNsp.on('connect', (socket: Socket): void => {
  Logger.info(`[WS] Sender connected: ip=${socket.handshake.address}`);

  handleSender(socket);
});
receiverNsp.on('connect', (socket: Socket): void => {
  Logger.info(`[WS] Receiver connected: ip=${socket.handshake.address}`);

  handleReceiver(socket);
});

// Serve static files
app.use(express.static('public'));

// Start server
const port: number = parseInt(process.env.PORT ?? '3000');
httpServer.listen(port, (): void => {
  Logger.info(`[HTTP] Started: port=${port}`);
});
