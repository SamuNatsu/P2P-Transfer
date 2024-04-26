/// Session module
import { customAlphabet, nanoid } from 'nanoid';
import { ErrorEvent, MessageEvent, WebSocket } from 'ws';
import { Logger } from '@/logger';

// Types
type Session = {
  ws: WebSocket;
  code?: string;
};

// Code generator
const codeGen = customAlphabet('6789BCDFGHJKLMNPQRTWbcdfghjkmnpqrtwz');

// Data maps
const sessions: Map<string, Session> = new Map();
const codes: Map<string, string> = new Map();

// Handle session
export const handleSession = (ws: WebSocket, remoteAddr: string): void => {
  // Assign UUID
  const uuid: string = nanoid(32);

  // Set timeout timer
  let timeout: NodeJS.Timeout = setTimeout((): void => {
    Logger.warn(`[Session] Timeout: ${uuid}`);
    destroySession(uuid);
  }, 15000);

  // Set data
  const session: Session = { ws };
  sessions.set(uuid, session);

  // Set event listener
  ws.binaryType = 'arraybuffer';
  ws.addEventListener('close', (): void => {
    Logger.info(`[WebSocket] Disconnected: ${remoteAddr}`);
  });
  ws.addEventListener('error', (ev: ErrorEvent): void => {
    Logger.error(`[WebSocket] Error occurred:\n${String(ev)}`);
  });
  ws.addEventListener('message', (ev: MessageEvent): void => {
    const view: DataView = new DataView(ev.data as ArrayBuffer);
    const cmd: number = view.getUint8(0);

    // Parse command
    switch (cmd) {
      case 0:
        session.code = undefined;

        Logger.info(`[Session] Reset: ${uuid}`);
        break;
      case 1:
        clearTimeout(timeout);
        timeout = setTimeout((): void => {
          Logger.warn(`[Session] Timeout: ${uuid}`);
          destroySession(uuid);
        }, 15000);

        Logger.trace(`[Session] Heartbeat: ${uuid}`);
        break;
      case 2: {
        session.code = codeGen(8);

        const buffer: Uint8Array = new Uint8Array(9);
        buffer.set(new Uint8Array([0x1]));
        buffer.set(new TextEncoder().encode(session.code), 1);
        ws.send(buffer);

        Logger.info(`[Session] Register: ${session.code} -> ${uuid}`);
        break;
      }
    }
  });

  // Print log
  Logger.info(`[Session] New: ${uuid} -> ${remoteAddr}`);
};

// Destroy session
const destroySession = (uuid: string): void => {
  const session: Session = sessions.get(uuid)!;

  // Clean up
  session.ws.close();

  // Clean up data maps
  sessions.delete(uuid);
  if (session.code !== undefined) {
    codes.delete(session.code);
  }

  // Print log
  Logger.info(`[Session] Destroyed: ${uuid}`);
};
