/// P2P receive utils
import { Socket, io } from 'socket.io-client';
import serverList from '~/assets/ice_servers.json';
import { PACK_SIZE } from './p2p';
import { Base64 } from 'js-base64';

/* Types */
export enum RecvServiceError {
  WebRTCDisabled,
  ConnectFail,
  NotExists,
  Paired,
  UnexpectedDisconnect,
  WebRTCConnectFail,
  DataChannelFail
}

/* Start service */
export function startRecvService(
  peerId: string,
  cbError: (err: RecvServiceError) => void,
  cbReady: (socket: Socket, peerConn: RTCPeerConnection) => void,
  cbDisconnect: () => boolean,
  cbAssign: (selfId: string) => void,
  cbResponse: (name: string, size: number) => void,
  cbDataOpen: () => void,
  cbMessage: (order: number, data: ArrayBuffer) => number,
  cbDone: () => void
): () => Promise<void> {
  if (typeof RTCPeerConnection === 'undefined') {
    cbError(RecvServiceError.WebRTCDisabled);
    return async (): Promise<void> => {};
  }

  const socket: Socket = io({ reconnection: false });
  const peerConn: RTCPeerConnection = new RTCPeerConnection({
    iceServers: serverList.map(
      (value: string): RTCIceServer => ({ urls: value })
    )
  });
  const dataCh: RTCDataChannel = peerConn.createDataChannel('fileTransfer');

  let selfId: null | string = null;
  let totSize: number = 0;
  let key: CryptoKey;
  let tPerNum: number = 1;
  let tNum: number = 0;
  let retry: number = 0;

  cbReady(socket, peerConn);

  socket.on('connect_error', (): void => {
    cbError(RecvServiceError.ConnectFail);
  });
  socket.on('not_exists', (): void => {
    cbError(RecvServiceError.NotExists);
    socket.disconnect();
  });
  socket.on('paired', (): void => {
    cbError(RecvServiceError.Paired);
    socket.disconnect();
  });

  socket.on('disconnect', (): void => {
    if (!cbDisconnect()) {
      cbError(RecvServiceError.UnexpectedDisconnect);
    }
  });

  socket.on('assign', (inSelfId: string): void => {
    if (selfId === null) {
      cbAssign(inSelfId);
      selfId = inSelfId;
    }
  });
  socket.on('response', async (inPeerId: string, data: any): Promise<void> => {
    if (peerId !== inPeerId) {
      return;
    }
    totSize = data.size;
    tPerNum = Math.ceil(totSize / PACK_SIZE / 1000);
    key = await window.crypto.subtle.importKey(
      'raw',
      Base64.toUint8Array(data.key),
      { name: 'AES-GCM' },
      true,
      ['encrypt', 'decrypt']
    );
    cbResponse(data.name, data.size);
  });

  socket.on('answer', async (inPeerId: string, data: any): Promise<void> => {
    if (peerId !== inPeerId) {
      return;
    }
    await peerConn.setRemoteDescription(data);
  });
  socket.on('candidate', async (inPeerId: string, data: any): Promise<void> => {
    if (peerId !== inPeerId) {
      return;
    }
    await peerConn.addIceCandidate(data);
  });

  socket.on('retry', async (inPeerId: string): Promise<void> => {
    if (peerId !== inPeerId) {
      return;
    }
    const offer: RTCSessionDescriptionInit = await peerConn.createOffer({
      iceRestart: true
    });
    await peerConn.setLocalDescription(offer);
    socket.emit('offer', peerId, offer);
  });

  peerConn.addEventListener('icecandidate', (ev: RTCPeerConnectionIceEvent) => {
    if (ev.candidate !== null) {
      socket.emit('candidate', peerId, ev.candidate);
    }
  });
  peerConn.addEventListener(
    'connectionstatechange',
    async (): Promise<void> => {
      if (peerConn.connectionState === 'failed') {
        if (retry < 5) {
          const offer: RTCSessionDescriptionInit = await peerConn.createOffer({
            iceRestart: true
          });
          await peerConn.setLocalDescription(offer);
          socket.emit('offer', peerId, offer);
          retry++;
          return;
        }
        cbError(RecvServiceError.WebRTCConnectFail);
        socket.disconnect();
      }
    }
  );

  dataCh.binaryType = 'arraybuffer';
  dataCh.addEventListener('error', (): void => {
    cbError(RecvServiceError.DataChannelFail);
  });
  dataCh.addEventListener('open', cbDataOpen);

  dataCh.addEventListener(
    'message',
    async (ev: MessageEvent<ArrayBuffer>): Promise<void> => {
      const ivv: DataView = new DataView(ev.data);
      const dePack = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: ev.data.slice(0, 8)
        },
        key,
        ev.data.slice(8)
      );

      const recvBytes: number = cbMessage(Number(ivv.getBigUint64(0)), dePack);

      tNum++;
      if (tNum % tPerNum === 0) {
        const buffer: Uint8Array = new Uint8Array(8);
        const view: DataView = new DataView(buffer.buffer);

        view.setBigUint64(0, BigInt(recvBytes));
        dataCh.send(buffer);
      }
      if (recvBytes >= totSize) {
        const buffer: Uint8Array = new Uint8Array(8);
        const view: DataView = new DataView(buffer.buffer);

        view.setBigUint64(0, BigInt(recvBytes));
        dataCh.send(buffer);

        cbDone();
      }
    }
  );

  socket.emit('request', peerId);

  return async (): Promise<void> => {
    const offer: RTCSessionDescriptionInit = await peerConn.createOffer();
    await peerConn.setLocalDescription(offer);
    socket.emit('offer', peerId, offer);
  };
}
