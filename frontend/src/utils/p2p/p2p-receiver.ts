/// P2P receiver
import EventEmitter from 'eventemitter3';

import { P2P_CONNECTION_COUNT, P2P_ICE_SERVERS } from '@/utils/p2p';
import { cache } from '@/utils/p2p/p2p-cache';

/**
 * Emit events:
 *
 * error: (reason)
 * candidate: (index, candidate)
 * offer: (index, offer)
 * start: ()
 * progress: (recvBytes)
 */

/**
 * On events:
 *
 * addcandidate: (index, candidate)
 * answer: (index, offer)
 */

// Export class
export class P2PReceiver extends EventEmitter {
  private channels: RTCDataChannel[] = [];
  private failedPeerNum: number = 0;
  private openedChanelNum: number = 0;
  private peers: RTCPeerConnection[] = [];
  private recvBytes: number = 0;

  /// Constructor
  public constructor(private key: CryptoKey) {
    super();

    // ICE candidate listener
    this.on(
      'addcandidate',
      async (idx: number, candidate: RTCIceCandidate): Promise<void> => {
        try {
          // Add ICE candidate
          await this.peers[idx].addIceCandidate(candidate);
        } catch (err: unknown) {
          console.error(err);
          this.emit('error', 'webrtc_candidate');
        }
      }
    );

    // Answer listener
    this.on(
      'answer',
      async (idx: number, answer: RTCSessionDescription): Promise<void> => {
        try {
          // Get peer
          const peer: RTCPeerConnection = this.peers[idx];

          // Set remote description
          await peer.setRemoteDescription(answer);
        } catch (err: unknown) {
          console.error(err);
          this.emit('error', 'webrtc_answer');
        }
      }
    );

    // Create connections
    for (let i = 0; i < P2P_CONNECTION_COUNT; i++) {
      // Create connection
      const peer: RTCPeerConnection = new RTCPeerConnection({
        iceServers: P2P_ICE_SERVERS
      });
      this.peers.push(peer);

      // ICE candidate listener
      peer.addEventListener(
        'icecandidate',
        (ev: RTCPeerConnectionIceEvent): void => {
          if (ev.candidate !== null) {
            this.emit('candidate', i, ev.candidate);
          }
        }
      );

      // Connection state change listener
      peer.addEventListener('connectionstatechange', (): void => {
        if (peer.connectionState === 'failed') {
          this.failedPeerNum++;
          if (this.failedPeerNum >= P2P_CONNECTION_COUNT) {
            this.emit('error', 'webrtc_connection');
          }
        }
      });

      // Create data channel
      const channel: RTCDataChannel = peer.createDataChannel(`ch${i}`);
      channel.binaryType = 'arraybuffer';
      this.channels.push(channel);

      // Error listener
      channel.addEventListener('error', (): void => {
        this.emit('error', 'webrtc_channel');
      });

      // Open listener
      channel.addEventListener('open', (): void => {
        if (this.openedChanelNum === 0) {
          this.emit('start');
        }
        this.openedChanelNum++;
      });

      // Message listener
      channel.addEventListener(
        'message',
        async (ev: MessageEvent<ArrayBuffer>): Promise<void> => {
          try {
            // Get data & index
            const data: ArrayBuffer = ev.data;
            const [idx, decryptedData] = await this.unwrapData(data);

            // Update data
            this.recvBytes += decryptedData.byteLength;

            // Emit event
            this.emit('progress', this.recvBytes);

            // Report progress
            const buffer: ArrayBuffer = new ArrayBuffer(8);
            const view: DataView = new DataView(buffer);
            view.setBigUint64(0, BigInt(this.recvBytes));
            channel.send(buffer);

            // Store in cache
            await cache.set(idx, i, decryptedData);
          } catch (err: unknown) {
            console.error(err);
            this.emit('error', 'webrtc_message');
          }
        }
      );

      // Start negotiating
      peer
        .createOffer()
        .then(async (offer: RTCSessionDescriptionInit): Promise<void> => {
          // Set local description
          await peer.setLocalDescription(offer);

          // Emit event
          this.emit('offer', i, offer);
        })
        .catch((err: unknown): void => {
          console.error(err);
          this.emit('error', 'webrtc_offer');
        });
    }
  }

  /// Unwrap data
  private async unwrapData(data: ArrayBuffer): Promise<[number, ArrayBuffer]> {
    const view: DataView = new DataView(data);
    const id: number = Number(view.getBigUint64(0));
    const iv: ArrayBuffer = data.slice(8, 24);
    const decData: ArrayBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      this.key,
      data.slice(24)
    );

    return [id, decData];
  }

  /// Clean up
  public cleanup(): void {
    for (const i of this.peers) {
      i.close();
    }
  }
}
