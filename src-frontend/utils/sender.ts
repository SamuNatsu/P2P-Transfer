import type { Socket } from 'socket.io-client';
import { PoolListener } from '@/utils/pool-listener';
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
  private pool: PoolListener;

  public constructor(private file: File) {
    super();

    this.ws = io('/sender', { reconnection: false });
    this.pool = new PoolListener();

    this.ws.on('connect', () => this.emit('connected'));
    this.ws.on('connect_error', (err: Error) => {
      this.close();
      this.emit('error', err);
    });

    this.ws.on('ready', () => this.emit('negotiate'));
    this.ws.on('message', (data) => {
      switch (data.type) {
        case 'candidate':
          this.pool.addCandidate(data.idx, data.candidate);
          break;
        case 'offer':
          this.pool.createAnswer(data.idx, data.offer);
          break;
      }
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

    this.pool.on('new candidate', (idx: number, candidate: RTCIceCandidate) => {
      this.ws.emit('forward', {
        type: 'candidate',
        candidate: candidate.toJSON(),
        idx,
      });
    });
    this.pool.on('answer', (idx: number, desc: RTCSessionDescription) => {
      this.ws.emit('forward', {
        type: 'answer',
        answer: desc.toJSON(),
        idx,
      });
    });
    this.pool.on('connected', () => {
      this.emit('send');
      // TODO
    });
    this.pool.on('message', () => {
      // TODO
    });
    this.pool.on('sendable', () => {
      // TODO
    });
    this.pool.on('busy', () => {
      // TODO
    });
    this.pool.on('error', (err: Error) => {
      this.close();
      this.emit('error', err);
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
    this.pool.close();
  }
}
