/// Send utils
import { Socket, io } from 'socket.io-client';
import iceServerList from '@/assets/ice_servers.json';

/* Types */
export enum SendServiceError {
  WebSocketNotAvailable,
  WebRTCNotAvailable,
  SignalConnectFail,
  SignalUnexpectDisconnect,
  WebRTCConnectFail,
  DataChannelError
}

/* Start send service */
export async function startSendService(
  file: File,
  cbError: (err: SendServiceError) => void,
  cbReady: () => void,
  cbConnection: (socket: Socket, peerConn: RTCPeerConnection) => void,
  cbLocalId: (localId: string) => void,
  cbRequest: (remoteId: string) => void,
  cbOffer: () => void,
  cbStart: () => void,
  cbProgress: (recvSize: number) => void,
  cbDone: () => void
): Promise<void> {
  if (typeof WebSocket === 'undefined') {
    cbError(SendServiceError.WebSocketNotAvailable);
    return;
  }

  if (typeof RTCPeerConnection === 'undefined') {
    cbError(SendServiceError.WebRTCNotAvailable);
    return;
  }

  cbReady();

  const socket: Socket = io({ reconnection: false });
  const peerConn: RTCPeerConnection = new RTCPeerConnection({
    iceServers: iceServerList.map(
      (value: string): RTCIceServer => ({ urls: value })
    )
  });
  const key: CryptoKey = await generateKey();

  cbConnection(socket, peerConn);

  let token: string;
  let remoteId: string;

  socket.on('connect', (): void => {
    socket.emit('session_new');
  });
  socket.on('reconnect', (): void => {
    if (token !== undefined) {
      socket.emit('session_resume', token);
    } else {
      socket.emit('session_new');
    }
  });
  socket.on('reconnect_error', (): void => {
    cbError(SendServiceError.SignalUnexpectDisconnect);
  });
  socket.on('connect_error', (): void => {
    cbError(SendServiceError.SignalConnectFail);
  });
  socket.on('disconnect', (reason: Socket.DisconnectReason): void => {
    if (reason === 'io client disconnect') {
      return;
    }
    socket.io.open();
  });

  socket.on('session_new', (inLocalId: string, inToken: string): void => {
    token = inToken;
    cbLocalId(inLocalId);
  });

  socket.on('meta_request', async (inRemoteId: string): Promise<void> => {
    if (remoteId === undefined) {
      remoteId = inRemoteId;
      cbRequest(inRemoteId);
    }

    socket.emit('meta_response', inRemoteId, {
      name: file.name,
      size: file.size,
      key: await exportKey(key)
    });
  });

  socket.on('rtc_offer', async (data: any): Promise<void> => {
    await peerConn.setRemoteDescription(data);

    const answer: RTCSessionDescriptionInit = await peerConn.createAnswer();
    socket.emit('rtc_answer', remoteId, answer);

    cbOffer();
  });
  socket.on('rtc_candidate', async (data: any): Promise<void> => {
    await peerConn.addIceCandidate(data);
  });
  socket.on('rtc_fail', (): void => {
    cbError(SendServiceError.WebRTCConnectFail);
    peerConn.close();
    socket.disconnect();
  });

  peerConn.addEventListener(
    'icecandidate',
    (ev: RTCPeerConnectionIceEvent): void => {
      if (ev.candidate !== null) {
        socket.emit('rtc_candidate', remoteId, ev.candidate);
      }
    }
  );
  peerConn.addEventListener('connectionstatechange', (): void => {
    if (peerConn.connectionState === 'failed') {
      socket.emit('rtc_retry', remoteId);
    }
  });
  peerConn.addEventListener('datachannel', (ev: RTCDataChannelEvent): void => {
    let recvSize: number = 0;
    let offset: number = 0;
    let order: number = 0;

    const dataCh: RTCDataChannel = ev.channel;
    const reader: FileReader = new FileReader();

    dataCh.binaryType = 'arraybuffer';
    dataCh.addEventListener('open', (): void => {
      socket.emit('session_done');
      socket.disconnect();
      cbStart();
    });
    dataCh.addEventListener('error', (): void => {
      cbError(SendServiceError.DataChannelError);
    });
    dataCh.addEventListener(
      'message',
      (ev: MessageEvent<ArrayBuffer>): void => {
        const view: DataView = new DataView(ev.data);
        const inRecvSize: number = Number(view.getBigUint64(0));

        if (inRecvSize > recvSize) {
          recvSize = inRecvSize;
          cbProgress(inRecvSize);

          if (inRecvSize >= file.size) {
            cbDone();
          }
        }
      }
    );

    function readSlice(): void {
      if (offset >= file.size) {
        return;
      }

      if (dataCh.bufferedAmount >= 4194304) {
        setTimeout((): void => {
          readSlice();
        }, 0);
        return;
      }

      const length: number = Math.min(15360, file.size - offset);
      reader.readAsArrayBuffer(file.slice(offset, offset + length));
    }

    reader.addEventListener('load', async (): Promise<void> => {
      const result: ArrayBuffer = reader.result as ArrayBuffer;
      const encrypt: ArrayBuffer = await encryptData(key, result);
      const wrapper: Uint8Array = new Uint8Array(encrypt.byteLength + 8);
      const view: DataView = new DataView(wrapper.buffer);

      view.setBigUint64(0, BigInt(order));
      wrapper.set(new Uint8Array(encrypt), 8);

      dataCh.send(wrapper);
      offset += result.byteLength;
      order++;

      readSlice();
    });

    readSlice();
  });
}
