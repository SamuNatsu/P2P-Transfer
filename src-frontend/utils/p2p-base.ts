import rawStunList from '@/assets/stun-servers.txt?raw';
import EventEmitter from 'eventemitter3';
import pako from 'pako';

/**
 * Events
 *
 * [new candidate](RTCIceCandidate)
 * [connected]
 * [message](Uint8Array)
 * [sendable]
 * [busy]
 * [error](Error)
 */

// Export class
export class P2PBase extends EventEmitter {
  // Constants
  protected static readonly MAX_CH_NUM: number = 4;
  private static readonly MAX_BUF_SIZE: number = 4_194_304; // 4MB
  private static readonly BASE_THROTTLE_DELAY: number = 100;
  private static readonly ICE_SERVERS: RTCIceServer[] = rawStunList
    .trim()
    .split('\n')
    .map((ip) => ({ urls: `stun:${ip}` }));

  protected pc: RTCPeerConnection;
  protected ch: RTCDataChannel[] = [];

  private queue: Uint8Array[] = [];
  private scores: Map<RTCDataChannel, number> = new Map();
  private isStartQueuing: boolean = false;
  private lastSentTime: number = 0;
  private avgRate: number = 0;

  protected attachListenersForChannel(ch: RTCDataChannel) {
    ch.addEventListener('open', () => {
      this.ch.push(ch);
      if (!this.isStartQueuing) {
        this.scheduleSend();
      }

      this.emit('sendable');
    });

    ch.addEventListener('message', (ev) => {
      try {
        this.emit('message', pako.inflate(ev.data));
      } catch (err: unknown) {
        console.error(err);
        this.close();
        this.emit('error', err);
      }
    });

    ch.addEventListener('error', (ev) => {
      console.error(ev.error);
      this.close();
      this.emit('error', Error('P2P channel closed'));
    });
  }

  private getIdleChannel(size: number) {
    const decayFactor = 0.95;
    const candidates = this.ch.filter(
      (ch) => ch.bufferedAmount + size < P2PBase.MAX_BUF_SIZE,
    );

    if (candidates.length === 0) {
      return null;
    }

    for (const [ch, score] of this.scores.entries()) {
      this.scores.set(ch, score * decayFactor);
    }

    return candidates.reduce((best, current) => {
      const bestScore = this.scores.get(best) ?? 0;
      const currentScore = this.scores.get(current) ?? 0;

      return currentScore < bestScore ? current : best;
    }, candidates[0]);
  }

  private getThrottleDelay(size: number) {
    const now = Date.now();
    const elapsed = now - this.lastSentTime || 1;
    this.avgRate = this.avgRate * 0.9 + (size / elapsed) * 0.1;
    this.lastSentTime = now;

    const factor = Math.max(0, this.avgRate / 8_388_608); // 8MB/s
    return Math.min(1000, P2PBase.BASE_THROTTLE_DELAY * factor);
  }

  private async scheduleSend() {
    if (this.isStartQueuing) {
      return;
    }
    this.isStartQueuing = true;

    while (this.queue.length > 0 && this.ch.length > 0) {
      const d = this.queue[0];
      const ch = this.getIdleChannel(d.byteLength);

      if (ch === null) {
        this.emit('busy');
        await new Promise((r) => setTimeout(r, P2PBase.BASE_THROTTLE_DELAY));
        continue;
      }

      try {
        ch.send(d);
        this.queue.shift();
        this.scores.set(ch, (this.scores.get(ch) || 0) + 1);
        this.emit('sendable');
      } catch (err: unknown) {
        console.error(err);
      }

      const delay = this.getThrottleDelay(d.byteLength);
      if (delay > 0) {
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    this.isStartQueuing = false;
  }

  public constructor() {
    super();

    this.pc = new RTCPeerConnection({
      bundlePolicy: 'balanced',
      iceServers: P2PBase.ICE_SERVERS,
      iceTransportPolicy: 'all',
    });

    this.pc.addEventListener('connectionstatechange', () => {
      switch (this.pc.connectionState) {
        case 'connected':
          this.emit('connected');
          break;
        case 'failed':
          this.close();
          this.emit('error', Error('P2P connection failed'));
          break;
      }
    });

    this.pc.addEventListener('icecandidate', (ev) => {
      if (ev.candidate !== null) {
        this.emit('new candidate', ev.candidate);
      }
    });
  }

  public addCandidate(candidate: RTCIceCandidateInit) {
    this.pc.addIceCandidate(candidate).catch((err: Error) => {
      console.error(err);
    });
  }

  public send(d: Uint8Array) {
    this.queue.push(pako.deflate(d));
    if (!this.isStartQueuing) {
      this.scheduleSend();
    }
  }

  public close() {
    for (const i of this.ch) {
      i.close();
    }
    this.pc.close();
    this.ch = [];
    this.queue = [];
    this.scores.clear();
  }
}
