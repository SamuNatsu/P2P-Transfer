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
export class PoolConnector extends PoolBase<P2PConnector> {
  private attachListeners(idx: number, l: P2PConnector) {
    l.on('new candidate', (candidate: RTCIceCandidate) => {
      this.emit('new candidate', idx, candidate);
    });

    l.on('offer', (desc: RTCSessionDescription) => {
      this.emit('offer', idx, desc);
    });

    l.on('connected', () => {
      this.numConnected++;
      if (this.numConnected === PoolConnector.MAX_CONNECTION) {
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

  public prepareOffers() {
    for (const i of this.conn) {
      i.createOffer();
    }
  }

  public setAnswer(idx: number, desc: RTCSessionDescriptionInit) {
    this.conn[idx].setAnswer(desc);
  }
}
