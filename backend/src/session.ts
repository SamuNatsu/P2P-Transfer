/// Session module
import crypto from 'crypto';
import { customAlphabet, nanoid } from 'nanoid';
import { DisconnectReason, Socket } from 'socket.io';

import { Logger } from '@/logger';

// Types
type Session = {
  code?: string;
  key?: string;
  name?: string;
  peer?: string;
  size?: number;
  socket: Socket;
  timeout?: NodeJS.Timeout;
  type?: string;
};

// Code generator
const codeGen = customAlphabet('6789BCDFGHJKLMNPQRTWbcdfghjkmnpqrtwz');

// Data maps
const sessions: Map<string, Session> = new Map();
const codes: Map<string, string> = new Map();

// Handle sender
export const handleSender = (socket: Socket): void => {
  let id: string;
  let session: Session;

  /// Get session
  if (typeof socket.handshake.auth.sessionId !== 'string') {
    // New session
    id = nanoid(32);
    session = { socket };

    sessions.set(id, session);
    socket.emit('session', id);

    Logger.info(`[Session] New: ip=${socket.handshake.address}, id=${id}`);
    Logger.debug(`[Session] Monitor: size=${sessions.size}`);
  } else {
    // Resume session
    id = socket.handshake.auth.sessionId;
    if (!sessions.has(id)) {
      socket.emit('timeout');
      return;
    }
    session = sessions.get(id)!;

    // Stop destroy timeout
    clearTimeout(session.timeout);

    Logger.info(`[Session] Resume: ip=${socket.handshake.address}, id=${id}`);
    Logger.debug(`[Session] Monitor: size=${sessions.size}`);
  }

  /// Disconnect listener
  socket.on('disconnect', (reason: DisconnectReason): void => {
    // If not disconnected by server
    if (
      reason !== 'server namespace disconnect' &&
      session.timeout === undefined
    ) {
      // Set destroy timeout for 30s
      session.timeout = setTimeout((): void => {
        Logger.warn(`[Session] Timeout: id=${id}`);

        destroySession(id);
      }, 30000);
    }

    Logger.info(
      `[WS] Disconnected: ip=${socket.handshake.address}, reason=${reason}`
    );
  });

  /// Register listener
  socket.on(
    'register',
    (name: string, size: number, type: string, callback: Function): void => {
      // If code generated
      if (session.code !== undefined) {
        return;
      }

      // Register data
      session.code = codeGen(8);
      session.key = crypto.randomBytes(32).toString('base64');
      session.name = name;
      session.size = size;
      session.type = type;
      codes.set(session.code, id);

      // Return code & key
      callback(session.code, session.key);

      Logger.info(
        `[Session] Registered: id=${id}, name=${name}, size=${size}, code=${session.code}, type=${session.type}, key=${session.key}`
      );
      Logger.debug(`[Session] Monitor: code_size=${codes.size}`);
    }
  );

  /// Candidate listener
  socket.on('candidate', (idx: number, candidate: RTCIceCandidate): void => {
    // If no peer
    if (session.peer === undefined) {
      return;
    }
    const peerSession: Session = sessions.get(session.peer)!;

    // Relay candidate
    peerSession.socket.emit('candidate', idx, candidate);

    Logger.trace(
      `[Session] Candidate: from=${id}, to=${session.peer}, index=${idx}`
    );
  });

  /// Answer listener
  socket.on('answer', (idx: number, answer: RTCSessionDescription): void => {
    // If no peer
    if (session.peer === undefined) {
      return;
    }
    const peerSession: Session = sessions.get(session.peer)!;

    // Relay answer
    peerSession.socket.emit('answer', idx, answer);

    Logger.info(
      `[Session] Answer: from=${id}, to=${session.peer}, index=${idx}`
    );
  });
};

// Handle receiver
export const handleReceiver = (socket: Socket): void => {
  let id: string;
  let session: Session;

  /// Get session
  if (typeof socket.handshake.auth.sessionId !== 'string') {
    // New session
    id = nanoid(32);
    session = { socket };

    sessions.set(id, session);
    socket.emit('session', id);

    Logger.info(`[Session] New: ip=${socket.handshake.address}, id=${id}`);
  } else {
    // Resume session
    id = socket.handshake.auth.sessionId;
    if (!sessions.has(id)) {
      socket.emit('timeout');
      return;
    }
    session = sessions.get(id)!;

    // Stop destroy timeout
    clearTimeout(session.timeout);

    Logger.info(`[Session] Resume: ip=${socket.handshake.address}, id=${id}`);
  }

  /// Disconnect listener
  socket.on('disconnect', (reason: DisconnectReason): void => {
    // If not disconnected by server
    if (
      reason !== 'server namespace disconnect' &&
      session.timeout === undefined
    ) {
      // Set destroy timeout for 30s
      session.timeout = setTimeout((): void => {
        Logger.warn(`[Session] Timeout: id=${id}`);

        destroySession(id);
      }, 30000);
    }

    Logger.info(
      `[WS] Disconnected: ip=${socket.handshake.address}, reason=${reason}`
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
    const peerSession: Session = sessions.get(peerId)!;

    // If peer locked
    if (peerSession.peer !== undefined) {
      callback(false);
      return;
    }

    // Lock peer
    peerSession.peer = id;
    session.peer = peerId;

    // Return registered data
    callback(
      true,
      peerSession.name,
      peerSession.size,
      peerSession.type,
      peerSession.key
    );

    Logger.info(
      `[Session] Requested: id=${id}, code=${code}, name=${peerSession.name}, size=${peerSession.size}, type=${peerSession.type}, key=${peerSession.key}`
    );
  });

  /// Candidate listener
  socket.on('candidate', (idx: number, candidate: RTCIceCandidate): void => {
    // If no peer
    if (session.peer === undefined) {
      return;
    }
    const peerSession: Session = sessions.get(session.peer)!;

    // Relay candidate
    peerSession.socket.emit('candidate', idx, candidate);

    Logger.trace(
      `[Session] Candidate: from=${id}, to=${session.peer}, index=${idx}`
    );
  });

  /// Offer listener
  socket.on('offer', (idx: number, offer: RTCSessionDescription): void => {
    // If no peer
    if (session.peer === undefined) {
      return;
    }
    const peerSession: Session = sessions.get(session.peer)!;

    // Relay offer
    peerSession.socket.emit('offer', idx, offer);

    Logger.info(
      `[Session] Offer: from=${id}, to=${session.peer}, index=${idx}`
    );
  });
};

// Destroy session
const destroySession = (id: string): void => {
  // If session not found
  if (!sessions.has(id)) {
    return;
  }
  const session: Session = sessions.get(id)!;

  // Clean up session
  session.socket.disconnect(true);
  clearTimeout(session.timeout);

  // Clean up maps
  sessions.delete(id);
  if (session.code !== undefined) {
    codes.delete(session.code);
  }

  // Destroy peer
  if (session.peer !== undefined) {
    Logger.warn(`[Session] Destroy peer: id=${session.peer}`);

    destroySession(session.peer);
  }

  Logger.info(`[Session] Destroyed: id=${id}`);
  Logger.debug(`[Session] Monitor: size=${sessions.size}`);
  Logger.debug(`[Session] Monitor: code_size=${codes.size}`);
};
