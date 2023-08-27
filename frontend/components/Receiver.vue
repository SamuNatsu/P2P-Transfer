<script lang="ts" setup>
import { Socket } from 'socket.io-client';
import { DLStream } from '~/utils/dl';
import { RecvServiceError } from '~/utils/p2p_recv';

/* Types */
enum Status {
  Error,
  Idle,
  ConnectSignal,
  WaitingPeer,
  WaitingAccept,
  Negotiating,
  Transfering,
  Finished
}

/* Properties */
const props = defineProps<{
  peerId: string;
}>();

/* Inject */
const { t } = useI18n();
const { log } = useDebugInfo();

/* Reactive */
const refs = reactive({
  fileName: null as null | string,
  fileSize: 0,
  fileRecvSize: 0,
  dlMode: false,
  status: Status.Idle,
  selfId: null as null | string,
  avgSpeed: 0,
  insSpeed: 0,
  error: ''
});

/* Computed */
const fileSizeTxt = computed((): string => convert(refs.fileSize, 'B'));
const avgSpeedTxt = computed((): string => convert(refs.avgSpeed, 'B/s'));
const insSpeedTxt = computed((): string => convert(refs.insSpeed, 'B/s'));

/* Variables */
const blobMap: Map<number, ArrayBuffer> = new Map();
let dlStream: null | DLStream = null;
let socket: Socket;
let peerConn: RTCPeerConnection;
let handle: number;

/* Functions */
function abort(): void {
  refs.status = Status.Error;
  refs.error = t('error.abort');
  socket.disconnect();
  peerConn.close();
  clearInterval(handle);
  window.onbeforeunload = null;
  if (dlStream !== null) {
    dlStream.abort();
  }
  log('Abort triggered');
}
let startDownload: () => void;

async function init(): Promise<void> {
  if (isInternalBrowser()) {
    return;
  }

  let startTime: number;
  let lastRecvSize: number = 0;
  let order: number = 0;

  const acceptFn: () => Promise<void> = startRecvService(
    props.peerId,
    (err: RecvServiceError): void => {
      if (refs.status === Status.Finished || refs.status === Status.Error) {
        return;
      }
      refs.status = Status.Error;
      socket.disconnect();
      peerConn.close();
      clearInterval(handle);
      window.onbeforeunload = null;
      if (dlStream !== null) {
        dlStream.abort();
      }

      switch (err) {
        case RecvServiceError.WebRTCDisabled:
          log('Recv service error: WebRTC disabled');
          refs.error = t('error.webrtc_disabled');
          break;
        case RecvServiceError.ConnectFail:
          log('Recv service error: Signal connect fail');
          refs.error = t('error.signal_conn');
          break;
        case RecvServiceError.NotExists:
          log('Recv service error: Peer not exists');
          refs.error = t('error.not_exists');
          break;
        case RecvServiceError.Paired:
          log('Recv service error: Peer has been paired');
          refs.error = t('error.paired');
          break;
        case RecvServiceError.UnexpectedDisconnect:
          log('Recv service error: Unexpected signal disconnect');
          refs.error = t('error.signal_disconn');
          break;
        case RecvServiceError.WebRTCConnectFail:
          log('Recv service error: WebRTC connect fail');
          refs.error = t('error.webrtc_conn');
          break;
        case RecvServiceError.DataChannelFail:
          log('Recv service error: Data channel fail');
          refs.error = t('error.data_ch');
          break;
      }
    },
    (_socket: Socket, _peerConn: RTCPeerConnection): void => {
      socket = _socket;
      peerConn = _peerConn;
      window.addEventListener('unload', abort);
      window.onbeforeunload = (): string => 'Sure to exit?';
      refs.status = Status.ConnectSignal;
    },
    (): boolean => {
      return refs.status === Status.Finished || refs.status === Status.Error;
    },
    (selfId: string): void => {
      refs.selfId = selfId;
      refs.status = Status.WaitingPeer;
    },
    (name: string, size: number): void => {
      refs.fileName = name;
      refs.fileSize = size;
      refs.status = Status.WaitingAccept;
    },
    async (): Promise<void> => {
      log('Start transfering');
      refs.fileRecvSize = 0;
      refs.avgSpeed = 0;
      refs.insSpeed = 0;
      startTime = new Date().getTime();
      handle = window.setInterval((): void => {
        refs.avgSpeed =
          (refs.fileRecvSize / (new Date().getTime() - startTime)) * 1000;
        refs.insSpeed = (refs.fileRecvSize - lastRecvSize) * 2;
        lastRecvSize = refs.fileRecvSize;
      }, 500);
      dlStream = await createDlStream(
        refs.fileName as string,
        refs.fileSize,
        refs.dlMode
      );
      refs.status = Status.Transfering;
    },
    (_order: number, data: ArrayBuffer): number => {
      blobMap.set(_order, data);
      while (blobMap.has(order)) {
        const blob: ArrayBuffer = blobMap.get(order) as ArrayBuffer;

        refs.fileRecvSize += blob.byteLength;
        if (dlStream !== null) {
          dlStream.write(blob);
        }
        blobMap.delete(order);
        order++;
      }

      return refs.fileRecvSize;
    },
    (): void => {
      refs.status = Status.Finished;
      log('Recv finished');
      if (dlStream !== null) {
        dlStream.close();
      }
      clearInterval(handle);
      window.onbeforeunload = null;
      setTimeout((): void => {
        socket.disconnect();
        peerConn.close();
      }, 3000);
    }
  );

  startDownload = async (): Promise<void> => {
    refs.status = Status.Negotiating;
    log('Start negotiating');
    await acceptFn();
  };
}

/* Expose */
defineExpose({ init });
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <div class="flex flex-col">
      <p>
        <b>{{ $t('status._') }}</b>
        <span
          v-if="refs.status === Status.Error"
          class="text-red-500">
          {{ $t('status.error') }}
        </span>
        <span
          v-else-if="refs.status === Status.Idle"
          class="text-gray-400">
          {{ $t('status.idle') }}
        </span>
        <span
          v-else-if="refs.status === Status.ConnectSignal"
          class="text-orange-500">
          {{ $t('status.conn_signal') }}
        </span>
        <span
          v-else-if="refs.status === Status.WaitingPeer"
          class="text-cyan-500">
          {{ $t('status.wait_peer') }}
        </span>
        <span
          v-else-if="refs.status === Status.WaitingAccept"
          class="text-purple-500">{{ $t('status.wait_accept_recv') }}
        </span>
        <span
          v-else-if="refs.status === Status.Negotiating"
          class="text-yellow-500">
          {{ $t('status.negotiate') }}
        </span>
        <span
          v-else-if="refs.status === Status.Transfering"
          class="text-blue-500">
          {{ $t('status.transfer') }}
        </span>
        <span v-else class="text-green-500">{{ $t('status.finish') }}</span>
      </p>
      <p><b>{{ $t('ui.peer_id') }}</b>{{ peerId }}</p>
      <p v-if="refs.selfId !== null">
        <b>{{ $t('ui.self_id') }}</b>{{ refs.selfId }}
      </p>
      <template v-if="refs.fileName !== null">
        <div class="flex">
          <b class="whitespace-pre-wrap">{{ $t('ui.file_name') }}</b>
          <div
            class="max-w-[10rem] overflow-hidden text-ellipsis whitespace-nowrap"
            :title="refs.fileName">
            {{ refs.fileName }}
          </div>
        </div>
        <p>
          <b>{{ $t('ui.file_size') }}</b>
          <span :title="`${refs.fileSize} Byte(s)`">{{ fileSizeTxt }}</span>
        </p>
      </template>
      <template v-if="refs.status >= Status.Transfering">
        <p><b>{{ $t('ui.avg_speed') }}</b>{{ avgSpeedTxt }}</p>
        <p><b>{{ $t('ui.ins_speed') }}</b>{{ insSpeedTxt }}</p>
        <ProgressBar
            class="my-1"
            color="bg-green-400"
            :progress="refs.fileRecvSize / refs.fileSize * 100"/>
      </template>
    </div>
    <DLModeSelector
      v-if="refs.status === Status.WaitingAccept"
      v-model:input="refs.dlMode"/>
    <div class="flex gap-4">
      <AppButton
        v-if="refs.status === Status.WaitingAccept"
        @click="startDownload"
        class="border-green-500 hover:bg-green-500">
        {{ $t('button.start_download') }}
      </AppButton>
      <AppButton
        v-if="Status.Negotiating <= refs.status && refs.status < Status.Finished"
        @click="abort"
        class="border-red-500 hover:bg-red-500">
        {{ $t('button.abort') }}
      </AppButton>
    </div>
    <p v-if="refs.error.length !== 0" class="font-bold max-w-[15rem] text-red-500">{{ refs.error }}</p>
  </div>
</template>
