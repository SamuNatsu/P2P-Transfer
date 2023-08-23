<script lang="ts" setup>
import { Socket } from 'socket.io-client';
import { P2PErrorType } from '../utils/p2p';

/* Types */
enum Status {
  Idle,
  Requesting,
  Waiting,
  Connecting,
  Transfering,
  Finished,
  Error
}

/* Inject */
const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();

/* Seo */
useSeoMeta({
  title: t('seo.title'),
  description: t('seo.description'),
  ogTitle: t('seo.title'),
  ogDescription: t('seo.description')
});
useHeadSafe({
  htmlAttrs: {
    lang: locale.value
  }
});

/* Reactive */
const refs = reactive({
  status: Status.Idle,
  selfId: '',
  peerId: '',
  fileName: null as null | string,
  fileSize: 0,
  recvSize: 0,
  avgSpeed: 0,
  insSpeed: 0,
  error: ''
});

/* Computed */
const sizeTxt = computed((): string => convert(refs.fileSize, 'B'));
const avgSpeedTxt = computed((): string => convert(refs.avgSpeed, 'B/s'));
const insSpeedTxt = computed((): string => convert(refs.insSpeed, 'B/s'));

/* Functions */
let start: () => void;

/* Life cycle */
onMounted(async (): Promise<void> => {
  if (Object.keys(route.query).length === 0) {
    router.push('/');
    return;
  }

  const streamSaver = (await import('streamsaver')).default;
  streamSaver.mitm = '/mitm.html';

  refs.peerId = Object.keys(route.query)[0];

  let startTime: number;
  let lastRecvSize: number = 0;
  let handle: number;
  let order: number = 0;
  let lock: boolean = false;

  const blobMap: Map<number, Uint8Array> = new Map();
  let stream: WritableStream;
  let writer: WritableStreamDefaultWriter;

  const cb: () => void = startRecvFile(
    refs.peerId,
    (err: P2PErrorType): void => {
      if (refs.status === Status.Error) {
        return;
      }

      refs.status = Status.Error;
      switch (err) {
        case P2PErrorType.WebRTCDisabled:
          refs.error = t('error.webrtc_disabled');
          break;
        case P2PErrorType.SignalServerConnectError:
          refs.error = t('error.signal_conn');
          break;
        case P2PErrorType.SignalServerDisconnectError:
          refs.error = t('error_signal_disconn');
          break;
        case P2PErrorType.WebRTCConnectError:
          refs.error = t('error.webrtc_conn');
          break;
        case P2PErrorType.DataChannelError:
          refs.error = t('error.data_ch');
          break;
      }
    },
    (): void => {
      refs.status = Status.Requesting;
    },
    (selfId: string, socket: Socket, peerConn: RTCPeerConnection): void => {
      refs.selfId = selfId;
      window.onbeforeunload = (): string =>{
        return 'Sure to exit?';
      };
      window.onunload = (): void => {
        socket.disconnect();
        peerConn.close();
      };
    },
    (name: string, size: number): void => {
      refs.fileName = name;
      refs.fileSize = size;

      stream = streamSaver.createWriteStream(refs.fileName, {
        size: refs.fileSize
      });
      writer = stream.getWriter();
      refs.status = Status.Waiting;
    },
    () => {
      refs.status = Status.Transfering;
      startTime = new Date().getTime();
      handle = window.setInterval((): void => {
        refs.insSpeed = (refs.recvSize - lastRecvSize) * 2;
        lastRecvSize = refs.recvSize;
      }, 500);
    },
    (data: ArrayBuffer): void => {
      const view: DataView = new DataView(data);

      refs.recvSize += data.byteLength - 4;
      refs.avgSpeed =
        (refs.recvSize / (new Date().getTime() - startTime)) * 1000;

      blobMap.set(
        view.getUint32(0),
        new Uint8Array(data.slice(4))
      );

      if (!lock) {
        lock = true;
        while (blobMap.has(order)) {
          writer.write(blobMap.get(order) as Uint8Array);
          blobMap.delete(order);
          order++;
        }
        lock = false;
      }
    },
    (): void => {
      while (blobMap.has(order)) {
        if (lock) {
          continue;
        }
        writer.write(blobMap.get(order) as Uint8Array);
        blobMap.delete(order);
        order++;
      }

      window.clearInterval(handle);
      refs.status = Status.Finished;
      writer.close();
      window.onbeforeunload = null;
    }
  );

  start = (): void => {
    refs.status = Status.Connecting;
    cb();
  };
});
</script>

<template>
  <div class="bg-gray-50 fixed flex flex-col gap-12 items-center inset-0 justify-center">
    <header class="flex gap-4 items-center select-none">
      <img class="h-16 w-16" draggable="false" src="/favicon.svg" />
      <h1 class="font-bold font-smiley text-4xl">P2P Transfer</h1>
    </header>
    <ClientOnly>
      <main class="flex flex-col">
        <p><strong>{{ $t('recv.self_id') }}</strong>{{ refs.selfId }}</p>
        <p><strong>{{ $t('recv.peer_id') }}</strong>{{ refs.peerId }}</p>
        <p><strong>{{ $t('recv.file_name') }}</strong>{{ refs.fileName }}</p>
        <p>
          <strong>{{ $t('recv.file_size') }}</strong>
          <span :title="`${refs.fileSize} Byte(s)`">{{ sizeTxt }}</span>
        </p>
        <p>
          <strong>{{ $t('recv.status._') }}</strong>
          <span v-if="refs.status === Status.Requesting" class="text-gray-400">{{ $t('recv.status.requesting') }}</span>
          <span v-else-if="refs.status === Status.Waiting" class="text-purple-500">{{ $t('recv.status.waiting') }}</span>
          <span v-else-if="refs.status === Status.Connecting" class="text-yellow-500">{{ $t('recv.status.connecting') }}</span>
          <span v-else-if="refs.status === Status.Transfering" class="text-blue-500">{{ $t('recv.status.transfering') }}</span>
          <span v-else-if="refs.status === Status.Finished" class="text-green-500">{{ $t('recv.status.finished') }}</span>
          <span v-else class="text-red-500">{{ $t('recv.status.error') }}</span>
        </p>
        <template v-if="refs.status === Status.Transfering || refs.status === Status.Finished">
          <p><strong>{{ $t('recv.progress') }}</strong>{{ (refs.recvSize / refs.fileSize * 100).toFixed(1) }}%</p>
          <p><strong>{{ $t('recv.avg_speed') }}</strong>{{ avgSpeedTxt }}</p>
          <p><strong>{{ $t('recv.ins_speed') }}</strong>{{ insSpeedTxt }}</p>
        </template>
        <button v-if="refs.fileName" @click="start" class="bg-white border-2 border-green-500 font-bold mt-4 px-4 py-1 rounded-3xl select-none self-center transition-colors disabled:bg-white disabled:cursor-not-allowed disabled:opacity-50 disabled:text-black hover:bg-green-500 hover:text-white" :disabled="refs.status >= Status.Connecting">{{ $t('recv.start_download') }}</button>
      </main>
      <div class="max-w-sm text-red-500 break-all">{{ refs.error }}</div>
    </ClientOnly>
  </div>
</template>
