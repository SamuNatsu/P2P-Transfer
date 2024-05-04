/// Concurrent receiver
import EventEmitter from 'eventemitter3';
import { P2P_CONNECTION_COUNT } from '@/utils/config';
import { cache } from '@/utils/file-cache';
import { RecvChannel } from '@/utils/recv-channel';

// Types
type ConcurrentReceiverEventType =
  | 'error'
  | 'localcandidate'
  | 'localoffer'
  | 'progress'
  | 'remoteanswer'
  | 'remotecandidate'
  | 'start';

// Export class
export class ConcurrentReceiver extends EventEmitter<ConcurrentReceiverEventType> {
  private channels: RecvChannel[] = [];
  private recvBytes: number = 0;
  private started: boolean = false;

  /// Constructor
  public constructor(private key: CryptoKey) {
    // Super constructor
    super();

    // Remote answer listener
    this.on(
      'remoteanswer',
      (index: number, answer: RTCSessionDescription): void => {
        this.channels[index].emit('remoteanswer', answer);
      }
    );

    // Remote candidate listener
    this.on(
      'remotecandidate',
      (index: number, candidate: RTCIceCandidate): void => {
        this.channels[index].emit('remotecandidate', candidate);
      }
    );

    // Create connections
    for (let i = 0; i < P2P_CONNECTION_COUNT; i++) {
      // Create channel
      const channel: RecvChannel = new RecvChannel(i, this.key);
      this.channels.push(channel);

      // Error listener
      channel.on('error', (err: unknown): void => {
        this.emit('error', err);
      });

      // Local candidate listener
      channel.on('localcandidate', (candidate: RTCIceCandidate): void => {
        this.emit('localcandidate', i, candidate);
      });

      // Local offer listener
      channel.on('localoffer', (answer: RTCSessionDescription): void => {
        this.emit('localoffer', i, answer);
      });

      // Remote message listener
      channel.on('remotemessage', (index: number, data: ArrayBuffer): void => {
        this.recvBytes += data.byteLength;
        this.emit('progress', this.recvBytes);

        channel.reportProgress(this.recvBytes);
        cache.set(index, i, data);
      });

      // Start listener
      channel.on('start', (): void => {
        if (this.started) {
          return;
        }

        this.started = true;
        this.emit('start');
      });
    }
  }

  /// Destroy
  public destroy(): void {
    for (const i of this.channels) {
      i.destroy();
    }
  }
}
