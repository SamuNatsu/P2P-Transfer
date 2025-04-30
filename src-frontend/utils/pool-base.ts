import EventEmitter from 'eventemitter3';
import { P2PListener } from '@/utils/p2p-listener';
import { P2PConnector } from '@/utils/p2p-connector';

/**
 * Events
 *
 * [sendable]
 * [busy]
 */

// Export class
export class PoolBase<
  T extends P2PListener | P2PConnector,
> extends EventEmitter {
  protected static readonly MAX_CONNECTION: number = 8;

  protected conn: T[] = [];
  protected sendable: boolean[] = [];
  protected numConnected: number = 0;

  private queue: Uint8Array[] = [];
  private isStartQueuing: boolean = false;

  private getIdleConn() {
    const conn = this.conn.filter((_, idx) => this.sendable[idx]);
    return conn.length === 0
      ? null
      : conn[Math.trunc(Math.random() * conn.length)];
  }

  private async scheduleSend() {
    if (this.isStartQueuing) {
      return;
    }
    this.isStartQueuing = true;

    while (this.queue.length > 0) {
      const d = this.queue[0];
      const conn = this.getIdleConn();

      if (conn === null) {
        this.emit('busy');
        await new Promise((r) => setTimeout(r, 100));
        continue;
      }

      try {
        conn.send(d);
        this.queue.shift();
        this.emit('sendable');
      } catch (err: unknown) {
        console.error(err);
      }
    }

    this.isStartQueuing = false;
  }

  public addCandidate(idx: number, candidate: RTCIceCandidateInit) {
    this.conn[idx].addCandidate(candidate);
  }

  public send(d: Uint8Array) {
    this.queue.push(d);
    if (!this.isStartQueuing) {
      this.scheduleSend();
    }
  }

  public close() {
    for (const i of this.conn) {
      i.close();
    }
  }
}
