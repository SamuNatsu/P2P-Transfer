/// Concurrent sender
import EventEmitter from 'eventemitter3';
import { P2P_CONNECTION_COUNT } from '@/utils/config';
import { SendChannel } from '@/utils/send-channel';

// Types
type ConcurrentSenderEventType =
  | 'error'
  | 'localanswer'
  | 'localcandidate'
  | 'progress'
  | 'remotecandidate'
  | 'remoteoffer'
  | 'start';

// Packet size
const PACKET_SIZE: number = 16384;

// Export class
export class ConcurrentSender extends EventEmitter<ConcurrentSenderEventType> {
  private channels: SendChannel[] = [];
  private currentChannel: number = 0;
  private failed: number = 0;
  private fileOffset: number = 0;
  private started: boolean = false;
  private packetIndex: number = 0;
  private reader: FileReader;
  private recvBytes: number = 0;

  /// Constructor
  public constructor(private file: File, private key: CryptoKey) {
    // Super constructor
    super();

    // Remote candidate listener
    this.on(
      'remotecandidate',
      (index: number, candidate: RTCIceCandidate): void => {
        this.channels[index].emit('remotecandidate', candidate);
      }
    );

    // Remote offer listener
    this.on(
      'remoteoffer',
      (index: number, offer: RTCSessionDescription): void => {
        this.channels[index].emit('remoteoffer', offer);
      }
    );

    // Create connections
    for (let i = 0; i < P2P_CONNECTION_COUNT; i++) {
      // Create channel
      const channel: SendChannel = new SendChannel(i, this.key);
      this.channels.push(channel);

      // Error listener
      channel.on('error', (err: unknown): void => {
        if (err === 'connection') {
          this.failed++;
          if (this.failed >= P2P_CONNECTION_COUNT) {
            this.emit('error', err);
          }
          return;
        }
        this.emit('error', err);
      });

      // Local answer listener
      channel.on('localanswer', (answer: RTCSessionDescription): void => {
        this.emit('localanswer', i, answer);
      });

      // Local candidate listener
      channel.on('localcandidate', (candidate: RTCIceCandidate): void => {
        this.emit('localcandidate', i, candidate);
      });

      // Remote message listener
      channel.on('remotemessage', (progress: number): void => {
        if (progress < this.recvBytes) {
          return;
        }

        this.recvBytes = progress;
        this.emit('progress', this.recvBytes);
      });

      // Start listener
      channel.on('start', (): void => {
        if (this.started) {
          return;
        }

        this.started = true;
        this.reader.readAsArrayBuffer(this.file.slice(0, PACKET_SIZE));
        this.emit('start');
      });
    }

    // Create reader
    this.reader = new FileReader();
    this.reader.addEventListener('load', (): void => {
      this.fileOffset += PACKET_SIZE;
      this.sendData(this.reader.result as ArrayBuffer);
    });
  }

  /// Send data
  private sendData(data: ArrayBuffer): void {
    // Find available channel
    for (let i = 1; i <= P2P_CONNECTION_COUNT; i++) {
      // Get target channel
      const target: number = (this.currentChannel + i) % P2P_CONNECTION_COUNT;
      const channel: SendChannel = this.channels[target];

      // If channel available
      if (channel.ready) {
        // Send data
        channel.sendData(this.packetIndex, data);
        this.packetIndex++;

        // If not data left to be sent
        if (this.fileOffset >= this.file.size) {
          return;
        }

        // Read next file block
        this.reader.readAsArrayBuffer(
          this.file.slice(this.fileOffset, this.fileOffset + PACKET_SIZE)
        );

        // Set current channel
        this.currentChannel = target;
        return;
      }
    }

    // If no available
    setTimeout((): void => this.sendData(data), 0);
  }

  /// Destroy
  public destroy(): void {
    for (const i of this.channels) {
      i.destroy();
    }
  }
}
