/// P2P send utils
import { Socket, io } from 'socket.io-client';
import serverList from '~/assets/ice_servers.json';
import { BUFF_SIZE, PACK_SIZE } from './p2p';
import { encryptData, exportKey, generateKey } from './crypto';

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
  const { log } = useDebugInfo();
  log('Start send service');

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
  const key: CryptoKey = await generateKey();

  let selfId: null | string = null;
  let peerId: null | string = null;
  let retry: number = 0;

  cbReady(socket, peerConn);

  socket.on('connect_error', (err: Error): void => {
    log(`Signal connect error: ${err.message}`);
    cbError(SendServiceError.ConnectFail);
  });
  socket.on('rtc_fail', (inPeerId: string): void => {
    if (peerId !== inPeerId) {
      return;
    }
    log('Peer RTC fail');
    cbError(SendServiceError.WebRTCConnectFail);
    socket.disconnect();
  });

  socket.on('disconnect', (reason: Socket.DisconnectReason): void => {
    log(`Signal disconnected: ${reason}`);
    if (!cbDisconnect()) {
      cbError(SendServiceError.UnexpectedDisconnect);
    }
  });

  socket.on('assign', (inSelfId: string): void => {
    if (selfId === null) {
      log(`Self ID assigned by signal server: ${inSelfId}`);
      cbAssign(inSelfId);
      selfId = inSelfId;
    }
  });
  socket.on('request', async (inPeerId: string): Promise<void> => {
    if (peerId === null) {
      log(`Get peer ID from request: ${inPeerId}`);
      cbPeer(inPeerId);
      peerId = inPeerId;
    }
    if (peerId !== inPeerId) {
      return;
    }

    log('Send response to peer');
    socket.emit('response', peerId, {
      name: file.name,
      size: file.size,
      key: await exportKey(key)
    });
  });

  socket.on('offer', async (inPeerId: string, data: any): Promise<void> => {
    if (peerId !== inPeerId) {
      return;
    }

    log('Receive offer from peer');
    await peerConn.setRemoteDescription(data);
    const answer: RTCSessionDescriptionInit = await peerConn.createAnswer();

    log('Send answer to peer');
    await peerConn.setLocalDescription(answer);
    socket.emit('answer', inPeerId, answer);

    cbOffer();
  });
  socket.on('candidate', async (inPeerId: string, data: any): Promise<void> => {
    if (peerId !== inPeerId) {
      return;
    }

    log('Receive candidate from peer');
    await peerConn.addIceCandidate(data);
  });

  peerConn.addEventListener('icecandidate', (ev: RTCPeerConnectionIceEvent) => {
    if (ev.candidate !== null) {
      log('Send candidate to peer');
      socket.emit('candidate', peerId, ev.candidate);
    }
  });
  peerConn.addEventListener('connectionstatechange', (): void => {
    if (peerConn.connectionState === 'failed') {
      if (retry < 5) {
        log(`RTC connection fail, retry: ${retry++}`);
        socket.emit('retry', peerId);
      } else {
        log('RTC connection fail, out of retry times');
        cbError(SendServiceError.WebRTCConnectFail);
        socket.emit('rtc_fail', peerId);
        socket.disconnect();
      }
    }
  });
  peerConn.addEventListener('datachannel', (ev: RTCDataChannelEvent): void => {
    log('Data channel constructed');

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
    dataCh.addEventListener('open', (): void => {
      log('Data channel open');
      cbStart();
    });
    dataCh.addEventListener('error', (ev: Event): void => {
      log(`Data channel error: ${(ev as RTCErrorEvent).error.message}`);
      cbError(SendServiceError.DataChannelFail);
    });
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
      const enResult: ArrayBuffer = await encryptData(key, result);
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
