/// Sender
import EventEmitter from 'eventemitter3';
import { Socket, io } from 'socket.io-client';
import { useStore } from '@/stores';
import { ConcurrentSender } from '@/utils/concurrent-sender';
import { P2P_CONNECTION_COUNT } from '@/utils/config';

// Types
type SenderEventType =
  | 'failed'
  | 'finished'
  | 'negotiate'
  | 'progress'
  | 'registered'
  | 'start'
  | 'statistic';

// Export class
export class Sender extends EventEmitter<SenderEventType> {
  private failedCount: number = 0;
  private id: string | null = null;
  private key: CryptoKey | null = null;
  private lstRecvBytes: number = 0;
  private recvBytes: number = 0;
  private sender: ConcurrentSender | null = null;
  private socket: Socket;
  private startAt: number = 0;
  private staticTimer?: number;

  /// Constructor
  public constructor(private file: File) {
    super();

    // Clear logs
    useStore().logger.clear();

    // Connect to signal
    this.socket = io('/sender', {
      auth: { sessionId: this.id },
      path: '/ws',
      reconnectionAttempts: 5
    });

    // Reconnect failed listener
    this.socket.io.on('reconnect_failed', (): void => {
      this.emit('failed', 'server');
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
        this.sender!.emit('remotecandidate', idx, candidate);
      }
    );

    // Offer listener
    this.socket.on(
      'offer',
      (idx: number, offer: RTCSessionDescription): void => {
        this.sender!.emit('remoteoffer', idx, offer);
        this.emit('negotiate');
      }
    );

    // Register sender
    this.socket.emit(
      'register',
      this.file.name,
      this.file.size,
      this.file.type,
      async (code: string, key: string): Promise<void> => {
        // Import encrypt key
        this.key = await crypto.subtle.importKey(
          'raw',
          Uint8Array.from(atob(key), (x: string): number => x.charCodeAt(0)),
          'AES-GCM',
          false,
          ['encrypt']
        );

        // Create concurrent sender
        this.sender = new ConcurrentSender(this.file, this.key);
        this.sender.on('error', (reason: string): void => {
          this.failedCount++;

          if (this.failedCount >= P2P_CONNECTION_COUNT) {
            this.destroy();
            this.emit('failed', reason);
          }
        });
        this.sender.on(
          'localcandidate',
          (idx: number, candidate: RTCIceCandidate): void => {
            this.socket.emit('candidate', idx, candidate);
          }
        );
        this.sender.on(
          'localanswer',
          (idx: number, answer: RTCSessionDescription): void => {
            this.socket.emit('answer', idx, answer);
          }
        );
        this.sender.on('start', (): void => {
          this.startAt = Date.now();
          this.staticTimer = window.setInterval((): void => {
            const delta: number = this.recvBytes - this.lstRecvBytes;
            const speed: number = delta / 0.5;
            const time: number = (this.file.size - this.recvBytes) / speed;
            this.lstRecvBytes = this.recvBytes;

            this.emit('statistic', speed, time);
          }, 500);

          this.emit('start');
        });
        this.sender.on('progress', (recvBytes: number): void => {
          this.recvBytes = recvBytes;
          this.emit('progress', recvBytes);

          if (recvBytes >= this.file.size) {
            const totalTime: number = (Date.now() - this.startAt) / 1000;

            this.emit('finished', this.file.size / totalTime);

            clearInterval(this.staticTimer);
            setTimeout((): void => this.destroy(), 5000);
          }
        });

        // Emit event
        this.emit('registered', code);
      }
    );
  }

  /// Destroy
  public destroy(): void {
    this.socket.disconnect();
    this.sender?.destroy();
    clearInterval(this.staticTimer);
  }
}
