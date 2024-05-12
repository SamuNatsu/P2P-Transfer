/// Receive channel
import EventEmitter from 'eventemitter3';
import { inflate } from 'pako';
import { useStore } from '@/stores';
import { P2P_ICE_SERVERS } from '@/utils/config';

// Types
type RecvChannelEventType =
  | 'error'
  | 'localcandidate'
  | 'localoffer'
  | 'remoteanswer'
  | 'remotecandidate'
  | 'remotemessage'
  | 'start';

// Export class
export class RecvChannel extends EventEmitter<RecvChannelEventType> {
  private connection!: RTCPeerConnection;
  private channel?: RTCDataChannel;

  /// Constructor
  public constructor(private index: number, private key: CryptoKey) {
    // Super constructor
    super();

    // Get logger
    const { logger } = useStore();

    // Remote answer listener
    this.on('remoteanswer', (answer: RTCSessionDescription): void => {
      this.connection
        .setRemoteDescription(answer)
        .then((): void => {
          logger.trace(`[recv-channel #${this.index}] Remote answer`);
        })
        .catch((err: unknown): void => {
          console.error(err);
          this.emit('error', 'remote_answer');
          logger.error(
            `[recv-channel #${this.index}] Remote answer: error=${err}`
          );
        });
    });

    // Remote candidate listener
    this.on('remotecandidate', (candidate: RTCIceCandidate): void => {
      this.connection
        .addIceCandidate(candidate)
        .then((): void => {
          logger.trace(
            `[recv-channel #${this.index}] Remote candidate: component=${candidate.component}, protocol=${candidate.protocol}, tcpType=${candidate.tcpType}, type=${candidate.type}`
          );
        })
        .catch((err: unknown): void => {
          console.error(err);
          this.emit('error', 'remote_candidate');
          logger.error(
            `[recv-channel #${this.index}] Remote candidate: error=${err}`
          );
        });
    });

    // Open channel
    this.open();
  }

  /// Open channel
  private open(): void {
    // Get logger
    const { logger } = useStore();

    // Create connection
    this.channel = undefined;
    this.connection = new RTCPeerConnection({
      iceServers: P2P_ICE_SERVERS,
      peerIdentity: `ch${this.index}`
    });

    // Connection state change listener
    this.connection.addEventListener('connectionstatechange', (): void => {
      logger.info(
        `[recv-channel ${this.index}] State change: state=${this.connection.connectionState}`
      );

      if (this.connection.connectionState === 'failed') {
        this.emit('error', 'connection');
      }
    });

    // ICE candidate listener
    this.connection.addEventListener(
      'icecandidate',
      (ev: RTCPeerConnectionIceEvent): void => {
        if (ev.candidate !== null) {
          this.emit('localcandidate', ev.candidate);
          logger.trace(
            `[recv-channel #${this.index}] Local candidate: component=${ev.candidate.component}, protocol=${ev.candidate.protocol}, tcpType=${ev.candidate.tcpType}, type=${ev.candidate.type}`
          );
        }
      }
    );

    // Create channel
    this.channel = this.connection.createDataChannel(`rc-${this.index}`);
    this.channel.binaryType = 'arraybuffer';

    // Error listener
    this.channel.addEventListener('error', (): void => {
      this.emit('error', 'channel');
    });

    // Message listener
    this.channel.addEventListener(
      'message',
      (ev: MessageEvent<ArrayBuffer>): void => {
        this.unwrapData(ev.data)
          .then(([index, data]): void => {
            this.emit('remotemessage', index, data);
          })
          .catch((err: unknown): void => {
            console.error(err);
            this.emit('error', 'message');
            logger.error(`[recv-channel #${this.index}] Message: error=${err}`);
          });
      }
    );

    // Open listener
    this.channel.addEventListener('open', (): void => {
      this.emit('start');
      logger.info(`[recv-channel #${this.index}] Opened`);
    });

    // Start negotiating
    this.connection
      .createOffer()
      .then((offer: RTCSessionDescriptionInit): void => {
        this.connection
          .setLocalDescription(offer)
          .then((): void => {
            this.emit('localoffer', offer);
            logger.trace(`[recv-channel #${this.index}] Local offer`);
          })
          .catch((err: unknown): void => {
            console.error(err);
            this.emit('error', 'local_offer');
            logger.error(
              `[recv-channel #${this.index}] Local offer: error=${err}`
            );
          });
      })
      .catch((err: unknown): void => {
        console.error(err);
        this.emit('error', 'local_offer');
        logger.error(`[recv-channel #${this.index}] Local offer: error=${err}`);
      });
  }

  /// Unwrap data
  private async unwrapData(data: ArrayBuffer): Promise<[number, ArrayBuffer]> {
    const inflatedData: Uint8Array = inflate(data);
    const index: number = Number(
      new DataView(inflatedData.buffer).getBigUint64(0)
    );
    const decryptedData: ArrayBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: inflatedData.slice(8, 24) },
      this.key,
      inflatedData.slice(24)
    );

    return [index, decryptedData];
  }

  /// Report progress
  public reportProgress(progress: number): void {
    const buffer: ArrayBuffer = new ArrayBuffer(8);
    new DataView(buffer).setBigUint64(0, BigInt(progress));

    this.channel?.send(buffer);
  }

  /// Destroy
  public destroy(): void {
    // Get logger
    const { logger } = useStore();

    // Release resources
    this.channel?.close();
    this.connection.close();

    logger.trace(`[recv-channel #${this.index}] Destroyed`);
  }
}
