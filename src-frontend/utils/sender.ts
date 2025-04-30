import type { Socket } from 'socket.io-client';
import { FileFragmentizer } from '@/utils/file-fragmentizer';
import { FileProgress } from '@/utils/file-progress';
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
  private static readonly FRAG_SIZE: number = 15360; // 15KB

  private ws: Socket;
  private pool: PoolListener;
  private fileFrag: FileFragmentizer;
  private fileProg: FileProgress;
  private sendable: boolean = false;

  private attachListenersForSocket() {
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
  }

  private attachListenersForPool() {
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
      this.fileProg.start();
    });
    this.pool.on('message', (d: Uint8Array) => {
      const view = new DataView(d.buffer);
      const size = view.getBigUint64(0);
      this.fileProg.set(Number(size));
    });
    this.pool.on('sendable', () => {
      this.sendable = true;
      this.fileFrag.readNext();
    });
    this.pool.on('busy', () => {
      this.sendable = false;
    });
    this.pool.on('error', (err: Error) => {
      this.close();
      this.emit('error', err);
    });
  }

  public constructor(private file: File) {
    super();

    this.ws = io('/sender', { reconnection: false });
    this.pool = new PoolListener();
    this.fileFrag = new FileFragmentizer(file, Sender.FRAG_SIZE);
    this.fileProg = new FileProgress(file.size);

    this.attachListenersForSocket();
    this.attachListenersForPool();
    this.fileFrag.on('load', (data: Uint8Array | null) => {
      if (data !== null) {
        this.pool.send(data);
        if (this.sendable) {
          this.fileFrag.readNext();
        }
      }
    });
    this.fileProg.on('progress', (spd: number, rt: number, pct: number) => {
      this.emit('progress', spd, rt, pct);
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
