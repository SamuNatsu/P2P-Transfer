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
  protected static readonly MAX_BUF_SIZE: number = 4194304; // 4MB
  protected static readonly ICE_SERVERS: RTCIceServer[] = rawStunList
    .trim()
    .split('\n')
    .map((ip) => ({ urls: `stun:${ip}` }));

  protected pc: RTCPeerConnection;
  protected ch: RTCDataChannel[] = [];
  protected numErrCh: number = 0;

  protected attachListenersForChannel(ch: RTCDataChannel) {
    ch.addEventListener('open', () => {
      this.ch.push(ch);
      if (this.ch.length === 0) {
        this.emit('sendable');
      }
    });

    ch.addEventListener('message', (ev) => {
      this.emit('message', pako.inflate(ev.data));
    });

    ch.addEventListener('error', (ev) => {
      console.error(ev.error);
      ch.close();
      this.numErrCh++;
      if (this.numErrCh === P2PBase.MAX_CH_NUM) {
        this.close();
        this.emit('error', Error('P2P channel closed'));
      }
    });
  }

  protected scheduleSend(d: Uint8Array) {
    let ch = null as RTCDataChannel | null;
    let mn = Number.MAX_SAFE_INTEGER;

    for (const i of this.ch) {
      if (
        i.bufferedAmount + d.byteLength < P2PBase.MAX_BUF_SIZE &&
        i.bufferedAmount < mn
      ) {
        ch = i;
        mn = i.bufferedAmount;
      }
    }

    if (ch !== null) {
      ch.send(d);
      this.emit('sendable');
      return;
    }

    this.emit('busy');
    setTimeout(() => this.scheduleSend(d));
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
    this.scheduleSend(pako.deflate(d));
  }

  public close() {
    for (const i of this.ch) {
      i.close();
    }
    this.pc.close();
  }
}
