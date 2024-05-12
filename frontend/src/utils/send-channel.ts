/// Send channel
import EventEmitter from 'eventemitter3';
import { deflate } from 'pako';
import { useStore } from '@/stores';
import { P2P_ICE_SERVERS } from '@/utils/config';

// Types
type SendChannelEventType =
  | 'error'
  | 'localanswer'
  | 'localcandidate'
  | 'remotecandidate'
  | 'remotemessage'
  | 'remoteoffer'
  | 'start';

// Buffer size
const BUFFER_SIZE: number = 4194304;

// Export class
export class SendChannel extends EventEmitter<SendChannelEventType> {
  private connection!: RTCPeerConnection;
  private channel?: RTCDataChannel;
  private opened: boolean = false;

  /// Getters
  public get ready(): boolean {
    return (
      this.channel !== undefined &&
      this.channel.readyState === 'open' &&
      this.channel.bufferedAmount < BUFFER_SIZE
    );
  }

  /// Constructor
  public constructor(private index: number, private key: CryptoKey) {
    // Super constructor
    super();

    // Get logger
    const { logger } = useStore();

    // Remote candidate listener
    this.on('remotecandidate', (candidate: RTCIceCandidate): void => {
      this.connection
        .addIceCandidate(candidate)
        .then((): void => {
          logger.trace(
            `[send-channel #${
              this.index
            }] Remote candidate: candidate=${JSON.stringify(candidate)}`
          );
        })
        .catch((err: unknown): void => {
          console.error(err);
          this.emit('error', 'remote_candidate');
          logger.error(
            `[send-channel #${this.index}] Remote candidate: error=${err}`
          );
        });
    });

    // Remote offer listener
    this.on('remoteoffer', (offer: RTCSessionDescription): void => {
      this.connection
        .setRemoteDescription(offer)
        .then((): void => {
          logger.trace(`[send-channel #${this.index}] Remote offer`);

          this.connection
            .createAnswer()
            .then((answer: RTCSessionDescriptionInit): void => {
              this.connection
                .setLocalDescription(answer)
                .then((): void => {
                  this.emit('localanswer', answer);
                  logger.trace(`[send-channel #${this.index}] Local answer`);
                })
                .catch((err: unknown): void => {
                  console.error(err);
                  this.emit('error', 'local_answer');
                  logger.error(
                    `[send-channel #${this.index}] Answer: error=${err}`
                  );
                });
            })
            .catch((err: unknown): void => {
              console.error(err);
              this.emit('error', 'local_answer');
              logger.error(
                `[send-channel #${this.index}] Answer: error=${err}`
              );
            });
        })
        .catch((err: unknown): void => {
          console.error(err);
          this.emit('error', 'remote_offer');
          logger.error(
            `[send-channel #${this.index}] Remote offer: error=${err}`
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
    this.connection = new RTCPeerConnection({ iceServers: P2P_ICE_SERVERS });

    // Connection state change listener
    this.connection.addEventListener('connectionstatechange', (): void => {
      logger.info(
        `[send-channel #${this.index}] State change: state=${this.connection.connectionState}`
      );

      if (this.connection.connectionState === 'failed') {
        if (this.opened) {
          this.emit('error', 'failed');
        } else {
          this.emit('error', 'connection');
        }
      }
    });

    // Data channel listener
    this.connection.addEventListener(
      'datachannel',
      (ev: RTCDataChannelEvent): void => {
        // Get channel
        this.channel = ev.channel;
        this.channel.binaryType = 'arraybuffer';

        // Error listener
        this.channel.addEventListener('error', (): void => {
          this.emit('error', 'channel');
        });

        // Message listener
        this.channel.addEventListener(
          'message',
          (ev: MessageEvent<ArrayBuffer>): void => {
            const progress: number = Number(
              new DataView(ev.data).getBigUint64(0)
            );

            this.emit('remotemessage', progress);
          }
        );

        // Open listener
        this.channel.addEventListener('open', (): void => {
          this.opened = true;
          this.emit('start');
          logger.info(`[send-channel #${this.index}] Opened`);
        });
      }
    );

    // ICE candidate listener
    this.connection.addEventListener(
      'icecandidate',
      (ev: RTCPeerConnectionIceEvent): void => {
        if (ev.candidate !== null) {
          this.emit('localcandidate', ev.candidate);
          logger.trace(
            `[send-channel #${
              this.index
            }] Local candidate: candidate=${JSON.stringify(ev.candidate)}`
          );
        }
      }
    );
  }

  /// Wrap data
  private async wrapData(
    index: number,
    data: ArrayBuffer
  ): Promise<ArrayBuffer> {
    const iv: Uint8Array = crypto.getRandomValues(new Uint8Array(16));
    const encryptedData: ArrayBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.key,
      data
    );

    const wrapper: Uint8Array = new Uint8Array(24 + encryptedData.byteLength);
    new DataView(wrapper.buffer).setBigUint64(0, BigInt(index));
    wrapper.set(iv, 8);
    wrapper.set(new Uint8Array(encryptedData), 24);

    return deflate(wrapper, { level: 9 });
  }

  /// Send data
  public sendData(index: number, data: ArrayBuffer): void {
    // Get logger
    const { logger } = useStore();

    // Send data
    this.wrapData(index, data)
      .then((buffer: ArrayBuffer): void => {
        this.channel?.send(buffer);
      })
      .catch((err: unknown): void => {
        console.error(err);
        this.emit('error', 'send');
        logger.error(`[send-channel #${this.index}] Send: error=${err}`);
      });
  }

  /// Destroy
  public destroy(): void {
    // Get logger
    const { logger } = useStore();

    // Release resources
    this.channel?.close();
    this.connection.close();

    logger.trace(`[send-channel #${this.index}] Destroyed`);
  }
}
