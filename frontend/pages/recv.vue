<script lang="ts" setup>
import { Base64 } from 'js-base64';
import { P2PErrorType } from '../utils/p2p';
import { write } from 'fs';

/* Types */
enum Status {
  Idle,
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
  selfId: null as null | string,
  peerId: null as null | string,
  fileName: '',
  fileSize: 0,
  recvSize: 0,
  avgSpeed: 0,
  insSpeed: 0,
  error: null as null | string
});

/* Variable */
let writer: WritableStreamDefaultWriter;

/* Computed */
const sizeTxt = computed((): string => convert(refs.fileSize, 'B'));
const avgSpeedTxt = computed((): string => convert(refs.avgSpeed, 'B/s'));
const insSpeedTxt = computed((): string => convert(refs.insSpeed, 'B/s'));

/* Functions */
function download(): void {
  writer.close();
}

/* Life cycle */
onMounted(async (): Promise<void> => {
  const streamSaver = (await import('streamsaver')).default;
  streamSaver.mitm = '/mitm.html';

  if (route.query.d === undefined) {
    router.push('/');
    return;
  }

  const data: any = JSON.parse(Base64.decode(route.query.d as string));
  refs.peerId = data.peerId;
  refs.fileName = data.fileName;
  refs.fileSize = data.fileSize;

  let startTime: number;
  let lastRecvSize: number = 0;
  let handle: number;
  let order: number = 0;
  let lock: boolean = false;

  const blobMap: Map<number, Uint8Array> = new Map();
  const stream: WritableStream = streamSaver.createWriteStream(refs.fileName, {
    size: refs.fileSize
  });
  writer = stream.getWriter();

  startRecvFile(
    data.peerId,
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
      refs.status = Status.Connecting;
    },
    (selfId: string): void => {
      refs.selfId = selfId;
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
      console.log(view.getUint32(0));
      if (blobMap.size > 128 && !lock) {
        lock = true;
        while (blobMap.has(order)) {
          writer.write(blobMap.get(order) as Uint8Array).then(()=>{
            console.log(writer);
          });
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
        writer.write(blobMap.get(order) as Uint8Array).then(()=>{
          console.log(writer);
        });
        blobMap.delete(order);
        order++;
      }

      window.clearInterval(handle);
      refs.status = Status.Finished;
    }
  );
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
          <span v-if="refs.status === Status.Idle" class="text-gray-400">{{ $t('recv.status.idle') }}</span>
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
        <button v-if="refs.status === Status.Finished" @click="download" class="bg-white border-2 border-green-500 font-bold mt-4 px-4 py-1 rounded-3xl select-none self-center transition-colors hover:bg-green-500 hover:text-white">{{ $t('recv.get_file') }}</button>
      </main>
      <div class="max-w-sm text-red-500 break-all">{{ refs.error }}</div>
    </ClientOnly>
  </div>
</template>
