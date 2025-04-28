import { P2PBase } from '@/utils/p2p-base';

/**
 * Events
 *
 * [new candidate](RTCIceCandidate)
 * [answer](RTCSessionDescription)
 * [connected]
 * [message](Uint8Array)
 * [sendable]
 * [busy]
 * [error](Error)
 */

// Export class
export class P2PListener extends P2PBase {
  public constructor() {
    super();

    this.pc.addEventListener('datachannel', (ev) => {
      this.attachListenersForChannel(ev.channel);
      this.ch.push(ev.channel);
    });
  }

  public createAnswer(desc: RTCSessionDescriptionInit) {
    this.pc
      .setRemoteDescription(desc)
      .then(() => this.pc.createAnswer())
      .then((answer) => this.pc.setLocalDescription(answer))
      .then(() => {
        this.emit('answer', this.pc.localDescription);
      })
      .catch((err: Error) => {
        this.close();
        this.emit('error', err);
        console.error(err);
      });
  }
}
