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
const PACK_SIZE: number = 15360;

/* Start send file */
export function startSendFile(
  file: File,
  cbError: (err: P2PErrorType) => void,
  cbConnect: (selfId: string) => void,
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

  let peerId: null | string = null;

  socket.on('connect', (): void => {
    cbConnect(socket.id);
  });
  socket.on('connect_error', (): void => {
    cbError(P2PErrorType.SignalServerConnectError);
  });
  socket.on('disconnect', (): void => {
    if (peerConn.connectionState === 'failed') {
      cbError(P2PErrorType.WebRTCConnectError);
      return;
    }
    if (peerConn.connectionState !== 'connected') {
      cbError(P2PErrorType.SignalServerDisconnectError);
    }
  });
  socket.on(
    'offer',
    async (pack: { peerId: string; data: any }): Promise<void> => {
      if (peerId === null) {
        peerId = pack.peerId;
        cbPeer(peerId);
      }
      if (peerId !== pack.peerId) {
        return;
      }
      await peerConn.setRemoteDescription(pack.data);
      peerConn
        .createAnswer()
        .then(async (answer: RTCSessionDescriptionInit): Promise<void> => {
          await peerConn.setLocalDescription(answer);
          socket.emit('answer', {
            peerId,
            data: answer
          });
        });
    }
  );
  socket.on(
    'candidate',
    async (pack: { peerId: string; data: any }): Promise<void> => {
      if (pack.peerId !== peerId) {
        return;
      }
      await peerConn.addIceCandidate(pack.data);
    }
  );

  peerConn.onicecandidate = (ev) => {
    socket.emit('candidate', {
      peerId,
      data: ev.candidate
    });
  };
  peerConn.onicecandidateerror = (ev: Event): void => {
    const err: RTCPeerConnectionIceErrorEvent =
      ev as RTCPeerConnectionIceErrorEvent;

    console.error(err);
  };
  peerConn.onconnectionstatechange = (): void => {
    if (
      peerConn.connectionState === 'failed' ||
      peerConn.connectionState === 'connected'
    ) {
      socket.disconnect();
    }
  };
  peerConn.ondatachannel = async (ev: RTCDataChannelEvent): Promise<void> => {
    const channel: RTCDataChannel = ev.channel;
    const reader: FileReader = new FileReader();

    let offset: number = 0;
    let order: number = 0;

    function readSlice(): void {
      if (offset >= file.size) {
        cbDone();

        function closeConn(): void {
          if (channel.bufferedAmount > 0) {
            setTimeout((): void => {
              closeConn();
            }, 100);
            return;
          }
          channel.close();
          peerConn.close();
        }
        closeConn();
        return;
      }
      if (channel.bufferedAmount > BUFF_SIZE) {
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

    channel.onerror = (): void => {
      cbError(P2PErrorType.DataChannelError);
    };
    channel.onopen = (): void => {
      cbStart();
    };

    reader.onload = (): void => {
      const result: ArrayBuffer = reader.result as ArrayBuffer;
      const wrapper: Uint8Array = new Uint8Array(result.byteLength + 4);
      const view: DataView = new DataView(wrapper.buffer);

      view.setUint32(0, order);
      wrapper.set(new Uint8Array(result), 4);

      channel.send(wrapper);
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
  cbConnect: (selfId: string) => void,
  cbDataOpen: () => void,
  cbMessage: (data: ArrayBuffer) => void,
  cbDone: () => void
): void {
  if (typeof RTCPeerConnection === 'undefined') {
    cbError(P2PErrorType.WebRTCDisabled);
    return;
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

  socket.on('connect', (): void => {
    cbConnect(socket.id);
  });
  socket.on('connect_error', (): void => {
    cbError(P2PErrorType.SignalServerConnectError);
  });
  socket.on('disconnect', (): void => {
    if (peerConn.connectionState === 'failed') {
      cbError(P2PErrorType.WebRTCConnectError);
      return;
    }
    if (peerConn.connectionState !== 'connected') {
      cbError(P2PErrorType.SignalServerDisconnectError);
    }
  });
  socket.on(
    'answer',
    async (pack: { peerId: string; data: any }): Promise<void> => {
      if (pack.peerId !== peerId) {
        return;
      }
      await peerConn.setRemoteDescription(pack.data);
    }
  );
  socket.on(
    'candidate',
    async (pack: { peerId: string; data: any }): Promise<void> => {
      if (pack.peerId !== peerId) {
        return;
      }
      await peerConn.addIceCandidate(pack.data);
    }
  );

  peerConn.onicecandidate = (ev: RTCPeerConnectionIceEvent): void => {
    socket.emit('candidate', {
      peerId: peerId,
      data: ev.candidate
    });
  };
  peerConn.onconnectionstatechange = (): void => {
    if (
      peerConn.connectionState === 'failed' ||
      peerConn.connectionState === 'connected'
    ) {
      socket.disconnect();
    }
  };

  dataCh.binaryType = 'arraybuffer';
  dataCh.onopen = (): void => {
    cbDataOpen();
  };
  dataCh.onerror = (ev: Event): void => {
    const err: RTCErrorEvent = ev as RTCErrorEvent;
    if (err.error.message === 'User-Initiated Abort, reason=Close called') {
      return;
    }

    cbError(P2PErrorType.DataChannelError);
  };
  dataCh.onmessage = (ev: MessageEvent<any>): void => {
    cbMessage(ev.data);
  };
  dataCh.onclose = (): void => {
    cbDone();
  };

  peerConn
    .createOffer({ iceRestart: true })
    .then(async (offer: RTCSessionDescriptionInit): Promise<void> => {
      await peerConn.setLocalDescription(offer);
      socket.emit('offer', {
        peerId: peerId,
        data: offer
      });
    });
}
