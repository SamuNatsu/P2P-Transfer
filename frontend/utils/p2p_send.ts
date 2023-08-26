/// P2P send utils
import { Socket, io } from 'socket.io-client';
import serverList from '~/assets/ice_servers.json';
import { BUFF_SIZE, PACK_SIZE } from './p2p';
import { Base64 } from 'js-base64';
import { wrap } from 'module';

/* Types */
export enum SendServiceError {
  WebRTCDisabled,
  ConnectFail,
  UnexpectedDisconnect,
  WebRTCConnectFail,
  DataChannelFail
}

/* Start service */
export async function startSendService(
  file: File,
  cbError: (err: SendServiceError) => void,
  cbReady: (socket: Socket, peerConn: RTCPeerConnection) => void,
  cbDisconnect: () => boolean,
  cbAssign: (selfId: string) => void,
  cbPeer: (peerId: string) => void,
  cbOffer: () => void,
  cbStart: () => void,
  cbProgress: (recvBytes: number) => void
): Promise<void> {
  if (typeof RTCPeerConnection === 'undefined') {
    cbError(SendServiceError.WebRTCDisabled);
    return;
  }

  const socket: Socket = io({ reconnection: false });
  const peerConn: RTCPeerConnection = new RTCPeerConnection({
    iceServers: serverList.map(
      (value: string): RTCIceServer => ({ urls: value })
    )
  });
  const key: CryptoKey = await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  );

  let selfId: null | string = null;
  let peerId: null | string = null;
  let retry: number = 0;

  cbReady(socket, peerConn);

  socket.on('connect_error', (): void => {
    cbError(SendServiceError.ConnectFail);
  });

  socket.on('disconnect', (): void => {
    if (!cbDisconnect()) {
      cbError(SendServiceError.UnexpectedDisconnect);
    }
  });

  socket.on('assign', (inSelfId: string): void => {
    if (selfId === null) {
      cbAssign(inSelfId);
      selfId = inSelfId;
    }
  });
  socket.on('request', async (inPeerId: string): Promise<void> => {
    if (peerId === null) {
      cbPeer(inPeerId);
      peerId = inPeerId;
    }
    if (peerId !== inPeerId) {
      return;
    }
    const rawKey: ArrayBuffer = await window.crypto.subtle.exportKey(
      'raw',
      key
    );
    socket.emit('response', peerId, {
      name: file.name,
      size: file.size,
      key: Base64.fromUint8Array(new Uint8Array(rawKey))
    });
  });

  socket.on('offer', async (inPeerId: string, data: any): Promise<void> => {
    if (peerId !== inPeerId) {
      return;
    }
    await peerConn.setRemoteDescription(data);
    const answer: RTCSessionDescriptionInit = await peerConn.createAnswer();

    await peerConn.setLocalDescription(answer);
    socket.emit('answer', inPeerId, answer);

    cbOffer();
  });
  socket.on('candidate', async (inPeerId: string, data: any): Promise<void> => {
    if (peerId !== inPeerId) {
      return;
    }
    await peerConn.addIceCandidate(data);
  });

  peerConn.addEventListener('icecandidate', (ev: RTCPeerConnectionIceEvent) => {
    if (ev.candidate !== null) {
      socket.emit('candidate', peerId, ev.candidate);
    }
  });
  peerConn.addEventListener('connectionstatechange', (): void => {
    if (peerConn.connectionState === 'failed') {
      if (retry < 5) {
        socket.emit('retry', peerId);
        retry++;
      } else {
        cbError(SendServiceError.WebRTCConnectFail);
        socket.disconnect();
      }
    }
  });
  peerConn.addEventListener('datachannel', (ev: RTCDataChannelEvent): void => {
    let offset: number = 0;
    let order: number = 0;

    const dataCh: RTCDataChannel = ev.channel;
    const reader: FileReader = new FileReader();

    function readSlice(): void {
      if (offset >= file.size) {
        return;
      }
      if (dataCh.bufferedAmount > BUFF_SIZE) {
        setTimeout((): void => {
          readSlice();
        }, 0);
        return;
      }

      const len: number = Math.min(PACK_SIZE, file.size - offset);

      reader.readAsArrayBuffer(file.slice(offset, offset + len));
      offset += len;
    }

    dataCh.binaryType = 'arraybuffer';
    dataCh.addEventListener('error', (): void => {
      cbError(SendServiceError.DataChannelFail);
    });
    dataCh.addEventListener('open', cbStart);
    dataCh.addEventListener(
      'message',
      (ev: MessageEvent<ArrayBuffer>): void => {
        const view: DataView = new DataView(ev.data);
        const recvBytes: number = Number(view.getBigUint64(0));

        cbProgress(recvBytes);
      }
    );

    reader.addEventListener('load', async (): Promise<void> => {
      const result: ArrayBuffer = reader.result as ArrayBuffer;

      const iv: ArrayBuffer = new ArrayBuffer(8);
      const ivv: DataView = new DataView(iv);
      ivv.setBigUint64(0, BigInt(order));

      const enResult: ArrayBuffer = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv
        },
        key,
        result
      );

      const wrapper: Uint8Array = new Uint8Array(enResult.byteLength + 8);
      const view: DataView = new DataView(wrapper.buffer);

      view.setBigUint64(0, BigInt(order));
      wrapper.set(new Uint8Array(enResult), 8);
      dataCh.send(wrapper);

      order++;
      readSlice();
    });

    readSlice();
  });
}
