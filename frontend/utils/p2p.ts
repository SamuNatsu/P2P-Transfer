/// P2P utils
import { Socket, io } from 'socket.io-client';
import serverList from '../assets/ice_servers.json';

/* Types */
export enum P2PErrorType {
  WebRTCDisabled,
  WebRTCConnectError,
  SignalServerConnectError,
  SignalServerDisconnectError,
  DataChannelError,
  InvalidPeerID,
  PeerNotExists
}

/* Constants */
const BUFF_SIZE: number = 4194304;
const PACK_SIZE: number = 16384;

/* Start send file */
export function startSendFile(
  file: File,
  cbError: (err: P2PErrorType) => void,
  cbConnect: (
    selfId: string,
    socket: Socket,
    peerConn: RTCPeerConnection
  ) => void,
  cbPeer: (peerId: string) => void,
  cbStart: () => void,
  cbProgress: (recvBytes: number) => void,
  cbDone: () => void
): void {
  if (typeof RTCPeerConnection === 'undefined') {
    cbError(P2PErrorType.WebRTCDisabled);
    return;
  }

  let selfId: null | string = null;
  let peerId: null | string = null;
  let done: boolean = false;

  const socket: Socket = io({ reconnection: false });
  const peerConn: RTCPeerConnection = new RTCPeerConnection({
    iceServers: serverList.map(
      (value: string): RTCIceServer => ({ urls: value })
    )
  });

  socket.on('connect_error', (): void => {
    cbError(P2PErrorType.SignalServerConnectError);
  });
  socket.on('invalid peer id', (): void => {
    cbError(P2PErrorType.InvalidPeerID);
    socket.disconnect();
  });
  socket.on('peer not exists', (): void => {
    cbError(P2PErrorType.PeerNotExists);
    socket.disconnect();
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

  peerConn.addEventListener('icecandidate', (ev: RTCPeerConnectionIceEvent) => {
    if (ev.candidate !== null) {
      socket.emit('candidate', peerId, ev.candidate);
    }
  });
  peerConn.addEventListener('connectionstatechange', (): void => {
    if (peerConn.connectionState === 'failed') {
      socket.emit('retry', peerId);
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
      if (done) {
        return;
      }
      cbError(P2PErrorType.DataChannelError);
    });
    dataCh.addEventListener('open', cbStart);
    dataCh.addEventListener('message', (ev: MessageEvent<ArrayBuffer>): void => {
      const view: DataView = new DataView(ev.data);
      const recvBytes: number = Number(view.getBigUint64(0));

      cbProgress(recvBytes);
      if (recvBytes >= file.size && !done) {
        done = true;
        cbDone();
        socket.disconnect();
      }
    });

    reader.addEventListener('load', (): void => {
      const result: ArrayBuffer = reader.result as ArrayBuffer;
      const wrapper: Uint8Array = new Uint8Array(result.byteLength + 4);
      const view: DataView = new DataView(wrapper.buffer);

      view.setUint32(0, order);
      wrapper.set(new Uint8Array(result), 4);
      dataCh.send(wrapper);

      order++;
      readSlice();
    });

    readSlice();
  });
}

/* Start receive file */
export function startRecvFile(
  peerId: string,
  cbError: (err: P2PErrorType) => void,
  cbReady: () => void,
  cbConnect: (
    selfId: string,
    socket: Socket,
    peerConn: RTCPeerConnection
  ) => void,
  cbInfo: (name: string, size: number) => void,
  cbDataOpen: () => void,
  cbMessage: (data: ArrayBuffer) => number,
  cbDone: () => void
): () => void {
  if (typeof RTCPeerConnection === 'undefined') {
    cbError(P2PErrorType.WebRTCDisabled);
    return (): void => {};
  }

  cbReady();

  let selfId: string | null = null;
  let totSize: number = 0;
  let tPerNum: number = 1;
  let tNum: number = 0;
  let done: boolean = false;

  const socket: Socket = io({ reconnection: false });
  const peerConn: RTCPeerConnection = new RTCPeerConnection({
    iceServers: serverList.map(
      (value: string): RTCIceServer => ({ urls: value })
    )
  });
  const dataCh: RTCDataChannel = peerConn.createDataChannel('fileTransfer');

  socket.on('connect_error', (): void => {
    cbError(P2PErrorType.SignalServerConnectError);
  });
  socket.on('invalid peer id', (): void => {
    cbError(P2PErrorType.InvalidPeerID);
    socket.disconnect();
  });
  socket.on('peer not exists', (): void => {
    cbError(P2PErrorType.PeerNotExists);
    socket.disconnect();
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
    totSize = data.fileSize;
    tPerNum = Math.ceil(totSize / PACK_SIZE / 1000);
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

  socket.on('retry', (inPeerId: string): void => {
    if (peerId !== inPeerId) {
      return;
    }
    peerConn
      .createOffer({ iceRestart: true })
      .then(async (offer: RTCSessionDescriptionInit): Promise<void> => {
        await peerConn.setLocalDescription(offer);
        socket.emit('offer', peerId, offer);
      });
  });

  peerConn.addEventListener('icecandidate', (ev: RTCPeerConnectionIceEvent) => {
    if (ev.candidate !== null) {
      socket.emit('candidate', peerId, ev.candidate);
    }
  });

  peerConn.onicecandidate = (ev: RTCPeerConnectionIceEvent): void => {
    socket.emit('candidate', peerId, ev.candidate);
  };
  peerConn.addEventListener('connectionstatechange', (): void => {
    if (peerConn.connectionState === 'failed') {
      socket.disconnect();
    }
  });

  dataCh.binaryType = 'arraybuffer';
  dataCh.addEventListener('open', (): void => {
    cbDataOpen();
  });
  dataCh.addEventListener('error', (): void => {
    if (done) {
      return;
    }
    cbError(P2PErrorType.DataChannelError);
  });
  dataCh.addEventListener('message', (ev: MessageEvent<ArrayBuffer>): void => {
    const recvBytes: number = cbMessage(ev.data);

    tNum++;
    if (tNum % tPerNum === 0) {
      dataCh.send(new BigUint64Array(recvBytes));
    }
    if (recvBytes >= totSize) {
      done = true;
      dataCh.send(new BigUint64Array(recvBytes));
      cbDone();
      socket.disconnect();
    }
  });

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
