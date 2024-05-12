/// Receiver
import EventEmitter from 'eventemitter3';
import { Socket, io } from 'socket.io-client';
import { useStore } from '@/stores';
import { ConcurrentReceiver } from '@/utils/concurrent-receiver';
import { P2P_CONNECTION_COUNT } from '@/utils/config';

// Types
type ReceiverEventType =
  | 'failed'
  | 'finished'
  | 'progress'
  | 'start'
  | 'statistic'
  | 'requested';

// Export class
export class Receiver extends EventEmitter<ReceiverEventType> {
  private failedCount: number = 0;
  private fileSize: number = 0;
  private id: string | null = null;
  private key: CryptoKey | null = null;
  private lstRecvBytes: number = 0;
  private receiver: ConcurrentReceiver | null = null;
  private recvBytes: number = 0;
  private socket: Socket;
  private startAt: number = 0;
  private staticTimer?: number;

  /// Constructor
  public constructor(private code: string) {
    super();

    // Clear logs
    useStore().logger.clear();

    // Connect to signal
    this.socket = io('/receiver', {
      auth: { sessionId: this.id },
      path: '/ws',
      reconnectionAttempts: 5
    });

    // Reconnect failed listener
    this.socket.io.on('reconnect_failed', (): void => {
      this.emit('failed', 'signal_server');
    });

    // Session timeout listener
    this.socket.on('timeout', (): void => {
      this.emit('failed', 'timeout');
    });

    // Assign session ID listener
    this.socket.on('session', (id: string): void => {
      this.id = id;
    });

    // Candidate listener
    this.socket.on(
      'candidate',
      (idx: number, candidate: RTCIceCandidate): void => {
        this.receiver!.emit('remotecandidate', idx, candidate);
      }
    );

    // Answer listener
    this.socket.on(
      'answer',
      (idx: number, answer: RTCSessionDescription): void => {
        this.receiver!.emit('remoteanswer', idx, answer);
      }
    );

    // Request sender
    this.socket.emit(
      'request',
      this.code,
      async (
        success: boolean,
        name: string,
        size: number,
        type: string,
        key: string
      ): Promise<void> => {
        // If not succecss
        if (!success) {
          this.emit('failed', 'not_found');
          return;
        }

        // Store data
        this.fileSize = size;

        // Import encrypt key
        this.key = await crypto.subtle.importKey(
          'raw',
          Uint8Array.from(atob(key), (x: string): number => x.charCodeAt(0)),
          'AES-GCM',
          false,
          ['decrypt']
        );

        // Create concurrent receiver
        this.receiver = new ConcurrentReceiver(this.key);
        this.receiver.on('error', (reason: string): void => {
          this.failedCount++;

          if (this.failedCount >= P2P_CONNECTION_COUNT) {
            this.destroy();
            this.emit('failed', reason);
          }
        });
        this.receiver.on(
          'localcandidate',
          (idx: number, candidate: RTCIceCandidate): void => {
            this.socket.emit('candidate', idx, candidate);
          }
        );
        this.receiver.on(
          'localoffer',
          (idx: number, offer: RTCSessionDescription): void => {
            this.socket.emit('offer', idx, offer);
          }
        );
        this.receiver.on('start', (): void => {
          this.startAt = Date.now();
          this.staticTimer = window.setInterval((): void => {
            const delta: number = this.recvBytes - this.lstRecvBytes;
            const speed: number = delta / 0.5;
            const time: number = (this.fileSize - this.recvBytes) / speed;
            this.lstRecvBytes = this.recvBytes;

            this.emit('statistic', speed, time);
          }, 500);

          this.emit('start');
        });
        this.receiver.on('progress', (recvBytes: number): void => {
          this.emit('progress', recvBytes);

          this.recvBytes = recvBytes;
          if (this.recvBytes >= this.fileSize) {
            const totalTime: number = (Date.now() - this.startAt) / 1000;
            this.emit('finished', this.fileSize / totalTime);

            clearInterval(this.staticTimer);
            setTimeout((): void => this.destroy(), 5000);
          }
        });

        // Emit event
        this.emit('requested', name, size, type);
      }
    );
  }

  /// Destroy
  public destroy(): void {
    this.socket.disconnect();
    this.receiver?.destroy();
    clearInterval(this.staticTimer);
  }
}
