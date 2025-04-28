import { P2PBase } from '@/utils/p2p-base';

/**
 * Events
 *
 * [new candidate](RTCIceCandidate)
 * [offer](RTCSessionDescription)
 * [connected]
 * [message](Uint8Array)
 * [sendable]
 * [busy]
 * [error](Error)
 */

// Export class
export class P2PConnector extends P2PBase {
  public constructor() {
    super();

    for (let i = 0; i < P2PConnector.MAX_CH_NUM; i++) {
      const ch = this.pc.createDataChannel(`ch${i}`);
      this.attachListenersForChannel(ch);
    }
  }

  public createOffer() {
    this.pc
      .createOffer()
      .then((offer) => this.pc.setLocalDescription(offer))
      .then(() => {
        this.emit('offer', this.pc.localDescription);
      })
      .catch((err: Error) => {
        this.close();
        this.emit('error', err);
        console.error(err);
      });
  }

  public setAnswer(desc: RTCSessionDescriptionInit) {
    this.pc.setRemoteDescription(desc).catch((err: Error) => {
      this.close();
      this.emit('error', err);
      console.error(err);
    });
  }
}
