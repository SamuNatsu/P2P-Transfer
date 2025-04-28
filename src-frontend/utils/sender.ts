import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import EventEmitter from 'eventemitter3';

/**
 * Events
 *
 * [connected]
 * [error](Error)
 * [code](string)
 * [negotiate]
 * [send]
 * [progress](number, number, number)
 * [done]
 */

// Export class
export class Sender extends EventEmitter {
  private ws: Socket;

  public constructor(private file: File) {
    super();

    this.ws = io('/sender', { reconnection: false });

    this.ws.on('connect', () => {
      this.emit('connected');
    });
    this.ws.on('connect_error', (err: Error) => {
      this.close();
      this.emit('error', err);
    });

    this.ws.on('connected', () => {
      this.emit('negotiate');
      // TODO
    });
    this.ws.on('message', () => {
      // TODO
    });

    this.ws.on('destroyed', () => {
      this.close();
      this.emit('error', Error('Session destroyed'));
    });
    this.ws.on('error', (reason: string) => {
      this.close();
      switch (reason) {
        case 'existed':
          this.emit('error', Error('Session duplicated'));
          break;
        case 'not exists':
          this.emit('error', Error('Session not exists'));
          break;
        case 'destroyed':
          this.emit('error', Error('Session destroyed'));
          break;
        case 'no receiver':
          this.emit('error', Error('Receiver not exists'));
          break;
        default:
          this.emit('error', Error('Internal server error'));
      }
    });
  }

  public start(): void {
    this.ws
      .emitWithAck('new', {
        file_name: this.file.name,
        file_mime: this.file.type.length === 0 ? 'unknown' : this.file.type,
        file_size: this.file.size,
      })
      .then((code: string | null): void => {
        if (code !== null) {
          this.emit('code', code);
        }
      })
      .catch((err: Error): void => {
        this.close();
        this.emit('error', err);
      });
  }

  public close(): void {
    this.ws.disconnect();
  }
}
