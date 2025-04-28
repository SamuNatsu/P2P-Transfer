import { P2PConnector } from '@/utils/p2p-connector';
import { PoolBase } from '@/utils/pool-base';

/**
 * Events
 *
 * [new candidate](number, RTCIceCandidate)
 * [offer](number, RTCSessionDescription)
 * [connected]
 * [message](Uint8Array)
 * [sendable]
 * [busy]
 * [error](Error)
 */

// Export class
export class PoolConnector extends PoolBase {
  private conn: P2PConnector[] = [];
  private sendable: boolean[] = [];
  private numConnected: number = 0;

  private attachListeners(idx: number, l: P2PConnector) {
    l.on('new candidate', (candidate: RTCIceCandidate) => {
      this.emit('new candidate', idx, candidate);
    });

    l.on('offer', (desc: RTCSessionDescription) => {
      this.emit('offer', idx, desc);
    });

    l.on('connected', () => {
      this.numConnected++;
      if (this.numConnected === PoolBase.MAX_CONNECTION) {
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

    for (let i = 0; i < PoolConnector.MAX_CONNECTION; i++) {
      const conn = new P2PConnector();
      this.attachListeners(i, conn);
      this.conn.push(conn);
      this.sendable.push(false);
    }
  }

  public addCandidate(idx: number, candidate: RTCIceCandidateInit) {
    this.conn[idx].addCandidate(candidate);
  }

  public prepareOffers() {
    for (const i of this.conn) {
      i.createOffer();
    }
  }

  public setAnswer(idx: number, desc: RTCSessionDescriptionInit) {
    this.conn[idx].setAnswer(desc);
  }

  public send(d: Uint8Array) {
    const idle = this.conn.filter((_, idx) => this.sendable[idx]);
    if (idle.length > 0) {
      const idx = Math.trunc(Math.random() * idle.length);
      idle[idx].send(d);
      return;
    }

    setTimeout(() => this.send(d));
  }

  public close() {
    for (const i of this.conn) {
      i.close();
    }
  }
}
