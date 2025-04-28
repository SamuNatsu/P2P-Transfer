import type { Socket } from 'socket.io-client';
import { PoolConnector } from '@/utils/pool-connector';
import { io } from 'socket.io-client';
import EventEmitter from 'eventemitter3';

/**
 * Events
 *
 * [connected]
 * [error](Error)
 * [file](string, string, number, boolean)
 * [negotiate]
 * [recv]
 * [progress](number, number, number)
 * [done]
 */

// Export class
export class Receiver extends EventEmitter {
  private ws: Socket;
  private pool: PoolConnector;

  public constructor() {
    super();

    this.ws = io('/receiver', { reconnection: false });
    this.pool = new PoolConnector();

    this.ws.on('connect', () => this.emit('connected'));
    this.ws.on('connect_error', (err: Error) => {
      this.close();
      this.emit('error', err);
    });

    this.ws.on('ready', () => {
      this.emit('negotiate');
      this.pool.prepareOffers();
    });
    this.ws.on('message', (data) => {
      switch (data.type) {
        case 'candidate':
          this.pool.addCandidate(data.idx, data.candidate);
          break;
        case 'answer':
          this.pool.setAnswer(data.idx, data.answer);
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
        case 'active':
          this.emit('error', Error('Session has already been active'));
          break;
        case 'not found':
          this.emit('error', Error('Session not found'));
          break;
        case 'destroyed':
          this.emit('error', Error('Session destroyed'));
          break;
        case 'no candidate':
          this.emit('error', Error('No candidate for connecting'));
          break;
        case 'no available':
          this.emit('error', Error('Session not available'));
          break;
        case 'not active':
          this.emit('error', Error('Session not active'));
          break;
        case 'not exists':
          this.emit('error', Error('Session not exists'));
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
    this.pool.on('offer', (idx: number, desc: RTCSessionDescription) => {
      this.ws.emit('forward', {
        type: 'offer',
        offer: desc.toJSON(),
        idx,
      });
    });
    this.pool.on('connected', () => {
      this.emit('recv');
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

  public find(code: string): void {
    this.ws
      .emitWithAck('find', code)
      .then((data: unknown): void => {
        if (data !== null) {
          const { file_name, file_mime, file_size, available } = data as Record<
            string,
            any
          >;
          this.emit('file', file_name, file_mime, file_size, available);
        }
      })
      .catch((err: Error): void => {
        this.ws.close();
        this.emit('error', err);
      });
  }

  public start(): void {
    this.ws.emit('start');
  }

  public close(): void {
    this.ws.close();
    this.pool.close();
  }
}
