<script lang="ts" setup>
import QRCode from 'qrcode';
import { P2PErrorType } from '../utils/p2p';
import { Socket } from 'socket.io-client';

/* Types */
enum Status {
  Idle,
  WaitingPeer,
  WaitingAccept,
  Transfering,
  Finished,
  Error
}

/* Inject */
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
  fileName: null as null | string,
  fileSize: 0,
  sendSize: 0,
  link: '',
  QRCodeData: '/imgs/cloud-xmark.svg',
  avgSpeed: 0,
  insSpeed: 0,
  error: null as null | string
});

/* Variables */
let file: File;

/* Computed */
const sendBtnTxt = computed(() => {
  return refs.fileName === null
    ? t('index.send')
    : `${t('index.send')} "${refs.fileName}"`;
});
const sizeTxt = computed((): string => convert(refs.fileSize, 'B'));
const avgSpeedTxt = computed((): string => convert(refs.avgSpeed, 'B/s'));
const insSpeedTxt = computed((): string => convert(refs.insSpeed, 'B/s'));

/* Functions */
function selectFile(ev: Event): void {
  const el: HTMLInputElement = ev.target as HTMLInputElement;
  const files: FileList = el.files as FileList;

  file = files[0];
  refs.status = Status.Idle;
  refs.selfId = null;
  refs.peerId = null;
  refs.fileName = file.name;
  refs.fileSize = file.size;
  refs.sendSize = 0;
  refs.link = '';
  refs.QRCodeData = '/imgs/cloud-xmark.svg';
  refs.avgSpeed = 0;
  refs.insSpeed = 0;
  refs.error = null;
}
function copyLink(): void {
  window.navigator.clipboard
    .writeText(refs.link)
    .then((): void => {
      alert('OK');
    })
    .catch((): void => {
      alert('Fail');
    });
}
async function sendFile(): Promise<void> {
  let startTime: number;
  let lastSendSize: number = 0;
  let handle: number;

  startSendFile(
    file,
    (err: P2PErrorType): void => {
      window.clearInterval(handle);
      window.onbeforeunload = null;

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
          refs.error = t('error.signal_disconn');
          break;
        case P2PErrorType.WebRTCConnectError:
          refs.error = t('error.webrtc_conn');
          break;
        case P2PErrorType.DataChannelError:
          refs.error = t('error.data_ch');
          break;
      }
    },
    (selfId: string, socket: Socket, peerConn: RTCPeerConnection): void => {
      refs.status = Status.WaitingPeer;
      refs.selfId = selfId;
      refs.link = window.location.href + '/@?' + selfId;

      QRCode.toDataURL(refs.link)
        .then((value: string): void => {
          refs.QRCodeData = value;
        })
        .catch((): void => {
          refs.status = Status.Error;
          refs.error = t('error.qrcode_gen');
          throw '';
        });

      window.onbeforeunload = (): string => {
        return 'Sure to exit?';
      };
      window.onunload = (): void => {
        socket.disconnect();
        peerConn.close();
      };
    },
    (peerId: string): void => {
      refs.peerId = peerId;
      refs.status = Status.WaitingAccept;
    },
    (): void => {
      refs.status = Status.Transfering;
      startTime = new Date().getTime();
      handle = window.setInterval((): void => {
        refs.avgSpeed =
          (refs.sendSize / (new Date().getTime() - startTime)) * 1000;
        refs.insSpeed = (refs.sendSize - lastSendSize) * 2;
        lastSendSize = refs.sendSize;
      }, 500);
    },
    (recvSize: number): void => {
      refs.sendSize = recvSize;
    },
    (): void => {
      refs.status = Status.Finished;
      window.clearInterval(handle);
      window.onbeforeunload = null;
      refs.avgSpeed =
        (refs.sendSize / (new Date().getTime() - startTime)) * 1000;
    }
  );
}
</script>

<template>
  <div class="bg-gray-50 fixed flex flex-col gap-12 items-center inset-0 justify-center">
    <header class="flex gap-4 items-center select-none">
      <img class="h-16 w-16" draggable="false" src="/favicon.svg" />
      <h1 class="font-bold font-smiley text-4xl">P2P Transfer</h1>
    </header>
    <main class="flex flex-col items-center gap-4">
      <label class="cursor-pointer bg-white border-2 border-green-500 font-bold px-4 py-1 rounded-3xl select-none transition-colors hover:bg-green-500 hover:text-white" for="file-input">
        <span>{{ $t('index.select_file') }}</span>
        <input @change="selectFile" class="hidden" id="file-input" type="file" />
      </label>
      <button @click="sendFile" class="bg-white border-2 border-blue-500 font-bold px-4 py-1 rounded-3xl select-none transition-colors disabled:bg-white disabled:cursor-not-allowed disabled:opacity-50 disabled:text-black hover:bg-blue-500 hover:text-white" :disabled="refs.fileName === null || refs.status !== Status.Idle">{{ sendBtnTxt }}</button>
      <div v-if="refs.status !== Status.Idle" class="flex flex-col gap-4 items-center md:flex-row">
        <img class="border-2 border-dashed border-gray-300 h-[200px] w-[200px]" draggable="false" :src="(refs.QRCodeData as string)"/>
        <div class="flex flex-col">
          <button @click="copyLink" class="bg-white border border-yellow-500 my-2 px-4 rounded-3xl select-none self-center transition-colors hover:bg-yellow-500 hover:text-white">
            {{ $t('index.click_to_copy') }}
          </button>
          <p>
            <strong>{{ $t('index.link') }}</strong>
            <span>{{ refs.link }}</span>
          </p>
          <p>
            <strong>{{ $t('index.file_size') }}</strong>
            <span :title="`${refs.fileSize} Byte(s)`">{{ sizeTxt }}</span>
          </p>
          <p>
            <strong>{{ $t('index.status._') }}</strong>
            <span v-if="refs.status === Status.WaitingPeer" class="text-gray-400">{{ $t('index.status.waiting_peer') }}</span>
            <span v-else-if="refs.status === Status.WaitingAccept" class="text-yellow-500">{{ $t('index.status.waiting_accept') }}</span>
            <span v-else-if="refs.status === Status.Transfering" class="text-blue-500">{{ $t('index.status.transfering') }}</span>
            <span v-else-if="refs.status === Status.Finished" class="text-green-500">{{ $t('index.status.finished') }}</span>
            <span v-else class="text-red-500">{{ $t('index.status.error') }}</span>
          </p>
          <p><strong>{{ $t('recv.self_id') }}</strong>{{ refs.selfId }}</p>
          <p><strong>{{ $t('recv.peer_id') }}</strong>{{ refs.peerId }}</p>
          <template v-if="refs.status === Status.Transfering || refs.status === Status.Finished">
            <p><strong>{{ $t('index.progress') }}</strong>{{ (refs.sendSize / refs.fileSize * 100).toFixed(1) }}%</p>
            <p><strong>{{ $t('recv.avg_speed') }}</strong>{{ avgSpeedTxt }}</p>
            <p><strong>{{ $t('recv.ins_speed') }}</strong>{{ insSpeedTxt }}</p>
          </template>
        </div>
    </div>
  </main>
  <div class="max-w-sm text-red-500 break-all">{{ refs.error }}</div>
</div></template>
