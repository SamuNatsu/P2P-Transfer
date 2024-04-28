/// Sender
import EventEmitter from 'eventemitter3';

import { Socket, io } from 'socket.io-client';
import { P2PSender } from '@/utils/p2p/p2p-sender';

// Export class
export class Sender extends EventEmitter {
  private socket: Socket;
  private id: string | null = null;
  private key: CryptoKey | null = null;
  private sender: P2PSender | null = null;

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
        this.sender!.emit('candidate', idx, candidate);
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
        this.sender.on('error', (name: string): void => {
          this.emit('failed', name);
        });
        this.sender.on('start', (): void => {
          this.emit('start');
        });
        this.sender.on('progress', (recvBytes: number): void => {
          this.emit('progress', recvBytes);
        });
        this.sender.on('finished', (): void => {
          this.emit('finished');
        });

        // Emit event
        this.emit('registered', code);
      }
    );
  }
}
