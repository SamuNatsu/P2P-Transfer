import type { Socket } from 'socket.io-client';
import { FileComposer } from '@/utils/file-composer';
import { FileProgress } from '@/utils/file-progress';
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
  private fileComp: FileComposer;
  private fileProg: FileProgress;

  private attachListenersForSocket() {
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
  }

  private attachListenersForPool() {
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
      this.fileProg.start();
    });
    this.pool.on('message', (d: Uint8Array) => {
      this.fileComp.addPacket(d);
      this.fileProg.add(d.byteLength);
    });
    this.pool.on('error', (err: Error) => {
      this.close();
      this.emit('error', err);
    });
  }

  public constructor() {
    super();

    this.ws = io('/receiver', { reconnection: false });
    this.pool = new PoolConnector();
    this.fileComp = new FileComposer(0);
    this.fileProg = new FileProgress(0);

    this.attachListenersForSocket();
    this.attachListenersForPool();
    this.fileProg.on(
      'progress',
      (spd: number, rt: number, pct: number, tot: number) => {
        const arr = new Uint8Array(8);
        const view = new DataView(arr.buffer);
        view.setBigUint64(0, BigInt(tot));

        this.pool.send(arr);
        this.emit('progress', spd, rt, pct);
      },
    );
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
          this.fileComp.targetSize = file_size;
          this.fileProg.totalSize = file_size;
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
