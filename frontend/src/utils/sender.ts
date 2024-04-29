/// Sender
import EventEmitter from 'eventemitter3';

import { Socket, io } from 'socket.io-client';
import { P2PSender } from '@/utils/p2p/p2p-sender';

/**
 * Events:
 *
 * failed: (reason)
 * registered: (code)
 * negotiate: ()
 * start: ()
 * progress: (recvBytes)
 * statistic: (speed, time)
 * finished: ()
 */

/**
 * Socket emit events:
 *
 * register: (name, size, callback(code, key))
 * candidate: (index, candidate)
 * answer: (index, answer)
 */

/**
 * Socket on events:
 *
 * session: (id)
 * candidate: (index, candidate)
 * offer: (index, offer)
 */

// Export class
export class Sender extends EventEmitter {
  private id: string | null = null;
  private key: CryptoKey | null = null;
  private lstRecvBytes: number = 0;
  private recvBytes: number = 0;
  private sender: P2PSender | null = null;
  private socket: Socket;
  private staticTimer?: number;

  /// Constructor
  public constructor(private file: File) {
    super();

    // Connect to signal
    this.socket = io({
      auth: { sessionId: this.id },
      path: '/ws',
      reconnectionAttempts: 5
    });

    // Reconnect failed listener
    this.socket.io.on('reconnect_failed', (): void => {
      this.emit('failed', 'connect_to_server');
    });

    // Assign session ID listener
    this.socket.on('session', (id: string): void => {
      this.id = id;
    });

    // Candidate listener
    this.socket.on(
      'candidate',
      (idx: number, candidate: RTCIceCandidate): void => {
        this.sender!.emit('addcandidate', idx, candidate);
      }
    );

    // Offer listener
    this.socket.on(
      'offer',
      (idx: number, offer: RTCSessionDescription): void => {
        this.sender!.emit('offer', idx, offer);
        this.emit('negotiate');
      }
    );

    // Register sender
    this.socket.emit(
      'register',
      this.file.name,
      this.file.size,
      async (code: string, key: string): Promise<void> => {
        // Import encrypt key
        this.key = await crypto.subtle.importKey(
          'raw',
          Uint8Array.from(atob(key), (x: string): number => x.charCodeAt(0)),
          'AES-GCM',
          false,
          ['encrypt']
        );

        // Create P2P sender
        this.sender = new P2PSender(this.file, this.key);
        this.sender.on('error', (reason: string): void => {
          this.emit('failed', reason);
        });
        this.sender.on(
          'candidate',
          (idx: number, candidate: RTCIceCandidate): void => {
            this.socket.emit('candidate', idx, candidate);
          }
        );
        this.sender.on(
          'answer',
          (idx: number, answer: RTCSessionDescription): void => {
            this.socket.emit('answer', idx, answer);
          }
        );
        this.sender.on('start', (): void => {
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
            this.emit('finished');

            setTimeout((): void => this.cleanup(), 5000);
          }
        });

        // Emit event
        this.emit('registered', code);
      }
    );
  }

  /// Clean up
  public cleanup(): void {
    this.socket.disconnect();
    this.sender?.cleanup();
    window.clearInterval(this.staticTimer);
  }
}
