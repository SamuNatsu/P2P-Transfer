import { P2PListener } from '@/utils/p2p-listener';
import { PoolBase } from '@/utils/pool-base';

/**
 * Events
 *
 * [new candidate](number, RTCIceCandidate)
 * [answer](number, RTCSessionDescription)
 * [connected]
 * [message](Uint8Array)
 * [sendable]
 * [busy]
 * [error](Error)
 */

// Export class
export class PoolListener extends PoolBase<P2PListener> {
  private attachListeners(idx: number, l: P2PListener) {
    l.on('new candidate', (candidate: RTCIceCandidate) => {
      this.emit('new candidate', idx, candidate);
    });

    l.on('answer', (desc: RTCSessionDescription) => {
      this.emit('answer', idx, desc);
    });

    l.on('connected', () => {
      this.numConnected++;
      if (this.numConnected === PoolListener.MAX_CONNECTION) {
        this.emit('connected');
      }
    });

    l.on('message', (d: Uint8Array) => {
      this.emit('message', d);
    });

    l.on('sendable', () => {
      this.sendable[idx] = true;
      this.emit('sendable');
    });

    l.on('busy', () => {
      this.sendable[idx] = false;
      if (this.sendable.every((v) => !v)) {
        this.emit('busy');
      }
    });

    l.on('error', (err: Error) => {
      this.close();
      this.emit('error', err);
    });
  }

  public constructor() {
    super();

    for (let i = 0; i < PoolListener.MAX_CONNECTION; i++) {
      const conn = new P2PListener();
      this.attachListeners(i, conn);
      this.conn.push(conn);
      this.sendable.push(false);
    }
  }

  public createAnswer(idx: number, desc: RTCSessionDescriptionInit) {
    this.conn[idx].createAnswer(desc);
  }
}
