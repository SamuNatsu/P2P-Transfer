/// P2P utils
import { Socket, io } from 'socket.io-client';
import serverList from '../assets/ice_servers.json';

/* Types */
export enum P2PErrorType {
  WebRTCDisabled,
  WebRTCConnectError,
  SignalServerConnectError,
  SignalServerDisconnectError,
  DataChannelError
}

/* Constants */
const BUFF_SIZE: number = 4194304;
const PACK_SIZE: number = 16384;

/* Start send file */
export function startSendFile(
  file: File,
  cbError: (err: P2PErrorType) => void,
  cbConnect: (selfId: string, socket: Socket, peerConn: RTCPeerConnection) => void,
  cbPeer: (peerId: string) => void,
  cbStart: () => void,
  cbProgress: (size: number) => void,
  cbDone: () => void
): void {
  if (typeof RTCPeerConnection === 'undefined') {
    cbError(P2PErrorType.WebRTCDisabled);
    return;
  }

  const socket: Socket = io({ reconnection: false });
  const peerConn: RTCPeerConnection = new RTCPeerConnection({
    bundlePolicy: 'max-bundle',
    iceCandidatePoolSize: 32,
    iceServers: serverList.map(
      (value: string): RTCIceServer => ({ urls: value })
    )
  });

  let selfId: null | string = null;
  let peerId: null | string = null;
  let done: boolean = false;

  socket.on('connect_error', (): void => {
    cbError(P2PErrorType.SignalServerConnectError);
  });
  socket.on('disconnect', (): void => {
    if (done) {
      return;
    }
    if (peerConn.connectionState === 'failed') {
      cbError(P2PErrorType.WebRTCConnectError);
      return;
    }
    cbError(P2PErrorType.SignalServerDisconnectError);
  });

  socket.on('assign', (inSelfId: string): void => {
    if (selfId === null) {
      selfId = inSelfId;
      cbConnect(inSelfId, socket, peerConn);
    }
  });

  socket.on('request', (inPeerId: string): void => {
    if (peerId === null) {
      peerId = inPeerId;
      cbPeer(peerId);
    }
    if (peerId !== inPeerId) {
      return;
    }
    socket.emit('response', peerId, {
      fileName: file.name,
      fileSize: file.size
    });
  });

  socket.on('offer', async (inPeerId: string, data: any): Promise<void> => {
    if (peerId !== inPeerId) {
      return;
    }
    await peerConn.setRemoteDescription(data);
    peerConn
      .createAnswer()
      .then(async (answer: RTCSessionDescriptionInit): Promise<void> => {
        await peerConn.setLocalDescription(answer);
        socket.emit('answer', inPeerId, answer);
      });
  });
  socket.on('candidate', async (inPeerId: string, data: any): Promise<void> => {
    if (peerId !== inPeerId) {
      return;
    }
    await peerConn.addIceCandidate(data);
  });

  socket.on('done', (inPeerId: string): void => {
    if (peerId !== inPeerId) {
      return;
    }
    peerConn.close();
    socket.disconnect();
    cbDone();
  });

  peerConn.onicecandidate = (ev: RTCPeerConnectionIceEvent) => {
    socket.emit('candidate', peerId, ev.candidate);
  };
  peerConn.onconnectionstatechange = (): void => {
    if (peerConn.connectionState === 'failed') {
      socket.disconnect();
    }
  };
  peerConn.ondatachannel = (ev: RTCDataChannelEvent): void => {
    const dataCh: RTCDataChannel = ev.channel;
    const reader: FileReader = new FileReader();

    let offset: number = 0;
    let order: number = 0;

    function readSlice(): void {
      if (offset >= file.size) {
        function closeConn(): void {
          if (dataCh.bufferedAmount > 0) {
            setTimeout((): void => {
              closeConn();
            }, 100);
          }
          done = true;
          socket.emit('done', peerId);
        }
        closeConn();
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
      cbProgress(len);
    }

    dataCh.onerror = (): void => {
      if (done) {
        return;
      }
      cbError(P2PErrorType.DataChannelError);
    };
    dataCh.onopen = (): void => {
      cbStart();
    };

    reader.onload = (): void => {
      const result: ArrayBuffer = reader.result as ArrayBuffer;
      const wrapper: Uint8Array = new Uint8Array(result.byteLength + 4);
      const view: DataView = new DataView(wrapper.buffer);

      view.setUint32(0, order);
      wrapper.set(new Uint8Array(result), 4);

      dataCh.send(wrapper);
      ++order;
      readSlice();
    };
    readSlice();
  };
}

/* Start receive file */
export function startRecvFile(
  peerId: string,
  cbError: (err: P2PErrorType) => void,
  cbReady: () => void,
  cbConnect: (selfId: string, socket: Socket, peerConn: RTCPeerConnection) => void,
  cbInfo: (name: string, size: number) => void,
  cbDataOpen: () => void,
  cbMessage: (data: ArrayBuffer) => void,
  cbDone: () => void
): () => void {
  if (typeof RTCPeerConnection === 'undefined') {
    cbError(P2PErrorType.WebRTCDisabled);
    return (): void => {};
  }

  cbReady();

  const socket: Socket = io({ reconnection: false });
  const peerConn: RTCPeerConnection = new RTCPeerConnection({
    bundlePolicy: 'max-bundle',
    iceCandidatePoolSize: 32,
    iceServers: serverList.map(
      (value: string): RTCIceServer => ({ urls: value })
    )
  });
  const dataCh: RTCDataChannel = peerConn.createDataChannel('fileTransfer');

  let selfId: string | null = null;
  let done: boolean = false;

  socket.on('connect_error', (): void => {
    cbError(P2PErrorType.SignalServerConnectError);
  });
  socket.on('disconnect', (): void => {
    if (done) {
      return;
    }
    if (peerConn.connectionState === 'failed') {
      cbError(P2PErrorType.WebRTCConnectError);
      return;
    }
    cbError(P2PErrorType.SignalServerDisconnectError);
  });

  socket.on('assign', (inSelfId: string): void => {
    if (selfId === null) {
      selfId = inSelfId;
      cbConnect(inSelfId, socket, peerConn);
    }
  });

  socket.on('response', (inPeerId: string, data: any): void => {
    if (peerId !== inPeerId) {
      return;
    }
    cbInfo(data.fileName, data.fileSize);
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

  socket.on('done', (inPeerId: string): void => {
    if (peerId !== inPeerId) {
      return;
    }
    function closeConn(): void {
      if (dataCh.bufferedAmount > 0) {
        setTimeout((): void => {
          closeConn();
        }, 100);
      }
      done = true;
      cbDone();
      socket.emit('done', peerId);
    }
    closeConn();
  });

  peerConn.onicecandidate = (ev: RTCPeerConnectionIceEvent): void => {
    socket.emit('candidate', peerId, ev.candidate);
  };
  peerConn.onconnectionstatechange = (): void => {
    if (peerConn.connectionState === 'failed') {
      socket.disconnect();
    }
  };

  dataCh.binaryType = 'arraybuffer';
  dataCh.onopen = (): void => {
    cbDataOpen();
  };
  dataCh.onerror = (): void => {
    if (done) {
      return;
    }
    cbError(P2PErrorType.DataChannelError);
  };
  dataCh.onmessage = (ev: MessageEvent<any>): void => {
    cbMessage(ev.data);
  };

  socket.emit('request', peerId);

  return (): void => {
    peerConn
      .createOffer()
      .then(async (offer: RTCSessionDescriptionInit): Promise<void> => {
        await peerConn.setLocalDescription(offer);
        socket.emit('offer', peerId, offer);
      });
  };
}
