/// Receiver
import EventEmitter from 'eventemitter3';

import { Socket, io } from 'socket.io-client';
import { P2PReceiver } from '@/utils/p2p/p2p-receiver';
import { cache } from '@/utils/p2p/p2p-cache';

/**
 * Emit events:
 *
 * failed: (reason)
 * start: ()
 * progress: (recvBytes)
 * statistic: (speed, time)
 * finished: ()
 */

/**
 * Socket emit events:
 *
 * request: (code, callback(name, size, key))
 * candidate: (index, candidate)
 * offer: (index, offer)
 */

/**
 * Socket on events:
 *
 * session: (id)
 * candidate: (index, candidate)
 * answer: (index, answer)
 */

// Export class
export class Receiver extends EventEmitter {
  private socket: Socket;
  private id: string | null = null;
  private key: CryptoKey | null = null;
  private receiver: P2PReceiver | null = null;
  private fileSize: number = 0;
  private recvBytes: number = 0;
  private staticTimer?: number;
  private lstRecvBytes: number = 0;

  /// Constructor
  public constructor(private code: string) {
    super();

    // Connect to signal
    this.socket = io({
      auth: { sessionId: this.id },
      path: '/ws',
      reconnectionAttempts: 5
    });

    // Reconnect failed listener
    this.socket.io.on('reconnect_failed', (): void => {
      this.emit('failed', 'signal_server');
    });

    // Invalid listener
    this.socket.on('invalid', (): void => {
      this.emit('failed', 'invalid');
    });

    // Assign session ID listener
    this.socket.on('session', (id: string): void => {
      this.id = id;
    });

    // Candidate listener
    this.socket.on(
      'candidate',
      (idx: number, candidate: RTCIceCandidate): void => {
        this.receiver!.emit('addcandidate', idx, candidate);
      }
    );

    // Answer listener
    this.socket.on(
      'answer',
      (idx: number, answer: RTCSessionDescription): void => {
        this.receiver!.emit('answer', idx, answer);
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
        key: string
      ): Promise<void> => {
        // If not succecss
        if (!success) {
          this.emit('failed', 'not_found');
          return;
        }

        // Store size
        this.fileSize = size;

        // Import encrypt key
        this.key = await crypto.subtle.importKey(
          'raw',
          Uint8Array.from(atob(key), (x: string): number => x.charCodeAt(0)),
          'AES-GCM',
          false,
          ['decrypt']
        );

        // Create P2P receiver
        this.receiver = new P2PReceiver(this.key);
        this.receiver.on('error', (reason: string): void => {
          this.emit('failed', reason);
          this.cleanup();
        });
        this.receiver.on(
          'candidate',
          (idx: number, candidate: RTCIceCandidate): void => {
            this.socket.emit('candidate', idx, candidate);
          }
        );
        this.receiver.on(
          'offer',
          (idx: number, offer: RTCSessionDescription): void => {
            this.socket.emit('offer', idx, offer);
          }
        );
        this.receiver.on('start', (): void => {
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
            cache.statistic();
            this.emit('finished');

            setTimeout((): void => this.cleanup(), 5000);
          }
        });

        // Emit event
        this.emit('requested', name, size);
      }
    );
  }

  /// Clean up
  public cleanup(): void {
    this.socket.disconnect();
    this.receiver?.cleanup();
    window.clearInterval(this.staticTimer);
  }
}
