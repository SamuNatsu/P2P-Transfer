/// P2P sender
import EventEmitter from 'eventemitter3';

import {
  P2P_BUFFER_SIZE,
  P2P_CONNECTION_COUNT,
  P2P_ICE_SERVERS,
  P2P_PACKET_SIZE
} from '@/utils/p2p';

// Export class
export class P2PSender extends EventEmitter {
  private peers: RTCPeerConnection[] = [];
  private channels: RTCDataChannel[] = [];
  private openedChanelNum: number = 0;
  private currentChannel: number = 0;
  private packetId: number = 0;
  private recvBytes: number = 0;
  private reader: FileReader;
  private fileOffset: number = 0;

  /// Constructor
  public constructor(private file: File, private key: CryptoKey) {
    super();

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

      // Data channel
      peer.addEventListener('datachannel', (ev: RTCDataChannelEvent): void => {
        // Get channel
        const channel: RTCDataChannel = ev.channel;
        channel.binaryType = 'arraybuffer';
        this.channels.push(channel);

        // Error listener
        channel.addEventListener('error', (): void => {
          console.error(`[p2p-sender] Channel #${i} error`);
          this.emit('error', 'channel');
        });

        // Open listener
        channel.addEventListener('open', (): void => {
          if (this.openedChanelNum === 0) {
            // Read file block
            this.reader.readAsArrayBuffer(file.slice(0, P2P_PACKET_SIZE));
            this.fileOffset = P2P_PACKET_SIZE;

            // Emit event
            this.emit('start');
          }
          this.openedChanelNum++;
        });

        // Message listener
        channel.addEventListener(
          'message',
          (ev: MessageEvent<ArrayBuffer>): void => {
            const view: DataView = new DataView(ev.data);
            const recvBytes: number = Number(view.getBigUint64(0));

            if (recvBytes <= this.recvBytes) {
              return;
            }

            this.recvBytes = recvBytes;
            this.emit('progress', recvBytes);
          }
        );
      });
    }

    // ICE candidate listener
    this.on(
      'candidate',
      async (idx: number, candidate: RTCIceCandidate): Promise<void> => {
        try {
          // Add ICE candidate
          await this.peers[idx].addIceCandidate(candidate);
        } catch (err: unknown) {
          console.error(`[p2p-sender] Connection #${idx} candidate error`);
          this.emit('error', 'candidate');
        }
      }
    );

    // Offer listener
    this.on(
      'offer',
      async (idx: number, offer: RTCSessionDescription): Promise<void> => {
        try {
          // Get peer
          const peer: RTCPeerConnection = this.peers[idx];

          // Set remote description
          await peer.setRemoteDescription(offer);

          // Create answer
          const answer: RTCSessionDescriptionInit = await peer.createAnswer();

          // Set local description
          await peer.setLocalDescription(answer);

          // Emit event
          this.emit('answer', idx, answer);
        } catch {
          console.error(`[p2p-sender] Connection #${idx} offer error`);
          this.emit('error', 'offer');
        }
      }
    );

    // Create reader
    this.reader = new FileReader();
    this.reader.addEventListener('load', async (): Promise<void> => {
      const data: ArrayBuffer = this.reader.result as ArrayBuffer;
      const wrappedData: ArrayBuffer = await this.wrapData(data);

      this.packetId++;
      this.sendData(wrappedData);
    });
  }

  /// Wrap data
  private async wrapData(data: ArrayBuffer): Promise<ArrayBuffer> {
    const iv: Uint8Array = crypto.getRandomValues(new Uint8Array(16));
    const encData: ArrayBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.key,
      data
    );

    const ret: Uint8Array = new Uint8Array(24 + data.byteLength);
    const view: DataView = new DataView(ret.buffer);
    view.setBigUint64(0, BigInt(this.packetId));
    ret.set(iv, 8);
    ret.set(new Uint8Array(encData), 24);

    return ret;
  }

  /// Send data
  private async sendData(data: ArrayBuffer): Promise<void> {
    // Find available channel
    for (let i = 1; i < this.openedChanelNum; i++) {
      // Target channel
      const target: number = (this.currentChannel + i) % this.openedChanelNum;
      const channel: RTCDataChannel = this.channels[target];

      // If channel idle
      if (channel.bufferedAmount < P2P_BUFFER_SIZE) {
        // Send data
        channel.send(data);

        // If no data left to be sent
        if (this.fileOffset >= this.file.size) {
          this.emit('finished');
          return;
        }

        // Read next file block
        this.reader.readAsArrayBuffer(
          this.file.slice(this.fileOffset, this.fileOffset + P2P_PACKET_SIZE)
        );
        this.fileOffset += P2P_PACKET_SIZE;

        // Set current channel
        this.currentChannel = target;

        return;
      }
    }

    // If no available
    setTimeout((): Promise<void> => this.sendData(data), 0);
  }
}
