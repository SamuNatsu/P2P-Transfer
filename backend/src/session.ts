/// Session module
import crypto from 'crypto';

import { customAlphabet, nanoid } from 'nanoid';
import { DisconnectReason, Socket } from 'socket.io';
import { Logger } from '@/logger';

// Types
type Session = {
  socket: Socket;
  peer?: string;
  timeout?: NodeJS.Timeout;
  code?: string;
  fileName?: string;
  fileSize?: number;
  key?: string;
};

// Code generator
const codeGen = customAlphabet('6789BCDFGHJKLMNPQRTWbcdfghjkmnpqrtwz');

// Data maps
const sessions: Map<string, Session> = new Map();
const codes: Map<string, string> = new Map();

// Handle session
export const handleSession = (socket: Socket): void => {
  let sessionId: string;
  let session: Session;

  /// Get session
  if (typeof socket.handshake.auth.sessionId !== 'string') {
    // New session
    sessionId = nanoid(32);
    session = { socket };

    sessions.set(sessionId, session);
    socket.emit('session', sessionId);

    Logger.info(
      `[Session] New: ip=${socket.handshake.address}, id=${sessionId}`
    );
  } else {
    // Resume session
    sessionId = socket.handshake.auth.sessionId;
    if (!sessions.has(sessionId)) {
      socket.disconnect();
      return;
    }
    session = sessions.get(sessionId)!;
    clearTimeout(session.timeout);

    Logger.info(
      `[Session] Resume: ip=${socket.handshake.address}, id=${sessionId}`
    );
  }

  /// Set event listeners
  socket.on('disconnect', (reason: DisconnectReason): void => {
    Logger.info(
      `[WebSocket] Disconnected: ip=${socket.handshake.address}, reason=${reason}`
    );

    // If not disconnected by server
    if (reason !== 'server namespace disconnect') {
      // Set destroy timeout for 10s
      session.timeout = setTimeout((): void => {
        Logger.warn(`[Session] Timeout: id=${sessionId}`);

        destroySession(sessionId);
      }, 10000);
    }
  });

  socket.on(
    'register',
    (fileName: string, fileSize: number, callback: Function): void => {
      Logger.info(
        `[Session] Register: id=${sessionId}, name=${fileName}, size=${fileSize}`
      );

      // Register data
      session.code = codeGen(8);
      session.fileName = fileName;
      session.fileSize = fileSize;
      session.key = crypto.randomBytes(32).toString('base64');

      // Return code & key
      callback(session.code, session.key);
    }
  );
  socket.on('request', (code: string, callback: Function): void => {
    Logger.info(`[Session] Request: id=${sessionId}, code=${code}`);

    // If peer ID not found
    if (!codes.has(code)) {
      callback(false);
      return;
    }
    const peerId: string = codes.get(code)!;

    // If peer locked
    const peerSession: Session = sessions.get(peerId)!;
    if (peerSession.peer !== undefined) {
      callback(false);
      return;
    }

    // Lock peer
    peerSession.peer = sessionId;
    session.peer = peerId;

    // Emit peer
    peerSession.socket.emit('peer', sessionId);

    // Return registered data
    callback(true, peerSession.fileName, peerSession.fileSize, peerSession.key);
  });
};

// Destroy session
const destroySession = (sessionId: string): void => {
  // If session not found
  if (!sessions.has(sessionId)) {
    return;
  }
  const session: Session = sessions.get(sessionId)!;

  // Clean up session
  clearTimeout(session.timeout);

  // Clean up maps
  sessions.delete(sessionId);
  if (session.code !== undefined) {
    codes.delete(session.code);
  }

  // Destroy peer
  if (session.peer !== undefined) {
    Logger.warn(`[Session] Peer destroy: id=${session.peer}`);

    sessions.get(session.peer)?.socket.disconnect();
    destroySession(session.peer);
  }

  Logger.info(`[Session] Destroyed: id=${sessionId}`);
};
