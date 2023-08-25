<script lang="ts" setup>
import { Socket } from 'socket.io-client';
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
  peerId: string
}>();

/* Inject */
const { t } = useI18n();

/* Reactive */
const refs = reactive({
  fileName: null as null | string,
  fileSize: 0,
  fileRecvSize: 0,
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
const blobMap: Map<number, Uint8Array> = new Map();
let stream: WritableStream;
let writer: WritableStreamDefaultWriter;
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
  writer.abort();
}
let startDownload: () => void;

async function init(): Promise<void> {
  if (isInternalBrowser()) {
    return;
  }

  const streamSaver = (await import('streamsaver')).default;
  streamSaver.mitm = '/mitm.html';

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

      switch (err) {
        case RecvServiceError.WebRTCDisabled:
          refs.error = t('error.webrtc_disabled');
          break;
        case RecvServiceError.ConnectFail:
          refs.error = t('error.signal_conn');
          break;
        case RecvServiceError.NotExists:
          refs.error = t('error.not_exists');
          break;
        case RecvServiceError.Paired:
          refs.error = t('error.paired');
          break;
        case RecvServiceError.UnexpectedDisconnect:
          refs.error = t('error.signal_disconn');
          break;
        case RecvServiceError.WebRTCConnectFail:
          refs.error = t('error.webrtc_conn');
          break;
        case RecvServiceError.DataChannelFail:
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
      stream = streamSaver.createWriteStream(refs.fileName, {
        size: refs.fileSize
      });
      writer = stream.getWriter();
      refs.status = Status.WaitingAccept;
    },
    (): void => {
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
      refs.status = Status.Transfering;
    },
    (data: ArrayBuffer): number => {
      const view: DataView = new DataView(data);

      blobMap.set(view.getUint32(0), new Uint8Array(data.slice(4)));
      while (blobMap.has(order)) {
        const blob: Uint8Array = blobMap.get(order) as Uint8Array;

        refs.fileRecvSize += blob.byteLength;
        writer.write(blobMap.get(order) as Uint8Array);
        blobMap.delete(order);
        order++;
      }

      return refs.fileRecvSize;
    },
    (): void => {
      refs.status = Status.Finished;
      writer.close();
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
    await acceptFn();
  };
}

/* Expose */
defineExpose({
  init
});
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <div class="flex gap-4">
      <AppButton
        v-if="refs.status < Status.Transfering"
        @click="startDownload"
        class="border-green-500 hover:bg-green-500"
        :disabled="refs.status < Status.WaitingAccept">
        {{ $t('button.start_download') }}
      </AppButton>
      <AppButton
        v-else
        @click="abort"
        class="border-red-500 hover:bg-red-500"
        :disabled="refs.status === Status.Finished">
        {{ $t('button.abort') }}
      </AppButton>
    </div>
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
          class="text-purple-500">{{ $t('status.wait_accept') }}
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
        <p>
          <b>{{ $t('ui.progress') }}</b>
          {{ (refs.fileRecvSize / refs.fileSize * 100).toFixed(1) }}%
        </p>
        <p><b>{{ $t('ui.avg_speed') }}</b>{{ avgSpeedTxt }}</p>
        <p><b>{{ $t('ui.ins_speed') }}</b>{{ insSpeedTxt }}</p>
      </template>
    </div>
    <p v-if="refs.error.length !== 0" class="font-bold max-w-[15rem] text-red-500">{{ refs.error }}</p>
  </div>
</template>
