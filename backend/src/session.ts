/// Session module
import { customAlphabet } from 'nanoid';
import { Socket } from 'socket.io';

/* Constants */
const nanoid: (size?: number) => string = customAlphabet(
  '346789ABCDEFGHJKLMNPQRTUVWXYabcdefghijkmnpqrtwxyz'
);

/* Classes */
export class Session {
  private peerMap: Map<string, Socket> = new Map();
  private tokenMap: Map<string, string> = new Map();
  private pairMap: Map<string, string> = new Map();

  private assignId(): string {
    while (true) {
      const id: string = nanoid(6);
      if (!this.peerMap.has(id)) {
        return id;
      }
    }
  }
  private assignToken(): string {
    while (true) {
      const token: string = nanoid(16);
      if (!this.tokenMap.has(token)) {
        return token;
      }
    }
  }

  public addConnection(socket: Socket): void {
    let id: string = this.assignId();
    this.peerMap.set(id, socket);

    let token: string = this.assignToken();
    this.tokenMap.set(token, id);

    console.log(`[Websocket] New connection: ${id}`);

    socket.on('session_new', (): void => {
      socket.emit('session_new', id, token);
    });
    socket.on('session_resume', (inToken: string): void => {
      if (!this.tokenMap.has(inToken)) {
        socket.disconnect();
        return;
      }

      id = this.tokenMap.get(inToken) as string;
      this.peerMap.set(id, socket);
      token = inToken;

      socket.emit('session_new', id, inToken);
    });

    socket.on('meta_request', (peerId: string): void => {
      if (!this.peerMap.has(peerId)) {
        socket.emit('not_found');
        return;
      }

      if (!this.pairMap.has(peerId)) {
        this.pairMap.set(peerId, id);
      } else if (this.pairMap.get(peerId) !== id) {
        socket.emit('paired');
        return;
      }

      this.peerMap.get(peerId)?.emit('meta_request', id);
    });
    socket.on('meta_response', (peerId: string, data: any): void => {
      if (!this.peerMap.has(peerId)) {
        socket.emit('not_found');
        return;
      }

      if (this.pairMap.get(id) !== peerId) {
        socket.emit('paired');
        return;
      }

      this.peerMap.get(peerId)?.emit('meta_response', id, data);
    });
  }
}
