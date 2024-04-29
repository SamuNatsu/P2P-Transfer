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

  /// Disconnect listener
  socket.on('disconnect', (reason: DisconnectReason): void => {
    // If not disconnected by server
    if (reason !== 'server namespace disconnect') {
      // Set destroy timeout for 10s
      session.timeout = setTimeout((): void => {
        Logger.warn(`[Session] Timeout: id=${sessionId}`);

        destroySession(sessionId);
      }, 10000);
    }

    Logger.info(
      `[WebSocket] Disconnected: ip=${socket.handshake.address}, reason=${reason}`
    );
  });

  /// Register listener
  socket.on(
    'register',
    (fileName: string, fileSize: number, callback: Function): void => {
      // Register data
      session.code = codeGen(8);
      session.fileName = fileName;
      session.fileSize = fileSize;
      session.key = crypto.randomBytes(32).toString('base64');
      codes.set(session.code, sessionId);

      // Return code & key
      callback(session.code, session.key);

      Logger.info(
        `[Session] Registered: id=${sessionId}, name=${fileName}, size=${fileSize}, code=${session.code}, key=${session.key}`
      );
    }
  );

  /// Candidate listener
  socket.on('candidate', (idx: number, candidate: RTCIceCandidate): void => {
    // If no peer
    if (session.peer === undefined) {
      return;
    }

    // Get peer session
    const peerSession: Session = sessions.get(session.peer)!;

    // Relay candidate
    peerSession.socket.emit('candidate', idx, candidate);

    Logger.info(
      `[Session] Candidate: from=${sessionId}, to=${session.peer}, index=${idx}`
    );
  });

  /// Answer listener
  socket.on('answer', (idx: number, answer: RTCSessionDescription): void => {
    // If no peer
    if (session.peer === undefined) {
      return;
    }

    // Get peer session
    const peerSession: Session = sessions.get(session.peer)!;

    // Relay answer
    peerSession.socket.emit('answer', idx, answer);

    Logger.info(
      `[Session] Answer: from=${sessionId}, to=${session.peer}, index=${idx}`
    );
  });

  /// Request listener
  socket.on('request', (code: string, callback: Function): void => {
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

    Logger.info(
      `[Session] Requested: id=${sessionId}, code=${code}, name=${peerSession.fileName}, size=${peerSession.fileSize}, key=${peerSession.key}`
    );
  });

  /// Offer listener
  socket.on('offer', (idx: number, offer: RTCSessionDescription): void => {
    // If no peer
    if (session.peer === undefined) {
      return;
    }

    // Get peer session
    const peerSession: Session = sessions.get(session.peer)!;

    // Relay offer
    peerSession.socket.emit('offer', idx, offer);

    Logger.info(
      `[Session] Offer: from=${sessionId}, to=${session.peer}, index=${idx}`
    );
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
