/// P2P receive utils
import { Socket, io } from 'socket.io-client';
import serverList from '~/assets/ice_servers.json';
import { PACK_SIZE } from './p2p';
import { decryptData, importKey } from './crypto';

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
  const { log } = useDebugInfo();
  log('Start send service');

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

  socket.on('connect_error', (err: Error): void => {
    log(`Signal connect error: ${err.message}`);
    cbError(RecvServiceError.ConnectFail);
  });
  socket.on('rtc_fail', (inPeerId: string): void => {
    if (peerId !== inPeerId) {
      return;
    }
    log('Peer RTC fail');
    cbError(RecvServiceError.WebRTCConnectFail);
    socket.disconnect();
  });
  socket.on('not_exists', (): void => {
    log('Peer not exists');
    cbError(RecvServiceError.NotExists);
    socket.disconnect();
  });
  socket.on('paired', (): void => {
    log('Peer has been paired');
    cbError(RecvServiceError.Paired);
    socket.disconnect();
  });

  socket.on('disconnect', (reason: Socket.DisconnectReason): void => {
    log(`Signal disconnected: ${reason}`);
    if (!cbDisconnect()) {
      cbError(RecvServiceError.UnexpectedDisconnect);
    }
  });

  socket.on('assign', (inSelfId: string): void => {
    if (selfId === null) {
      log(`Self ID assigned by signal server: ${inSelfId}`);
      cbAssign(inSelfId);
      selfId = inSelfId;
    }
  });
  socket.on('response', async (inPeerId: string, data: any): Promise<void> => {
    if (peerId !== inPeerId) {
      return;
    }

    log('Receive response from peer');
    totSize = data.size;
    tPerNum = Math.ceil(totSize / PACK_SIZE / 1000);
    key = await importKey(data.key);
    cbResponse(data.name, data.size);
  });

  socket.on('answer', async (inPeerId: string, data: any): Promise<void> => {
    if (peerId !== inPeerId) {
      return;
    }

    log('Receive answer from peer');
    await peerConn.setRemoteDescription(data);
  });
  socket.on('candidate', async (inPeerId: string, data: any): Promise<void> => {
    if (peerId !== inPeerId) {
      return;
    }

    log('Receive candidate from peer');
    await peerConn.addIceCandidate(data);
  });

  socket.on('retry', async (inPeerId: string): Promise<void> => {
    if (peerId !== inPeerId) {
      return;
    }

    log(`Receive retry request from peer, now retry`);
    const offer: RTCSessionDescriptionInit = await peerConn.createOffer({
      iceRestart: true
    });
    await peerConn.setLocalDescription(offer);
    socket.emit('offer', peerId, offer);
  });

  peerConn.addEventListener('icecandidate', (ev: RTCPeerConnectionIceEvent) => {
    if (ev.candidate !== null) {
      log('Send candidate to peer');
      socket.emit('candidate', peerId, ev.candidate);
    }
  });
  peerConn.addEventListener(
    'connectionstatechange',
    async (): Promise<void> => {
      if (peerConn.connectionState === 'failed') {
        if (retry < 5) {
          log(`RTC connection fail, retry: ${retry++}`);
          const offer: RTCSessionDescriptionInit = await peerConn.createOffer({
            iceRestart: true
          });
          await peerConn.setLocalDescription(offer);
          socket.emit('offer', peerId, offer);
        } else {
          log('RTC connection fail, out of retry times');
          cbError(RecvServiceError.WebRTCConnectFail);
          socket.emit('rtc_fail', peerId);
          socket.disconnect();
        }
      }
    }
  );

  dataCh.binaryType = 'arraybuffer';
  dataCh.addEventListener('open', (): void => {
    log('Data channel open');
    cbDataOpen();
  });
  dataCh.addEventListener('error', (ev: Event): void => {
    log(`Data channel error: ${(ev as RTCErrorEvent).error.message}`);
    cbError(RecvServiceError.DataChannelFail);
  });

  dataCh.addEventListener(
    'message',
    async (ev: MessageEvent<ArrayBuffer>): Promise<void> => {
      const ivv: DataView = new DataView(ev.data);
      const dePack = await decryptData(key, ev.data.slice(8));
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

  log('Send request to peer');
  socket.emit('request', peerId);

  return async (): Promise<void> => {
    log('Send offer to peer');
    const offer: RTCSessionDescriptionInit = await peerConn.createOffer();
    await peerConn.setLocalDescription(offer);
    socket.emit('offer', peerId, offer);
  };
}
