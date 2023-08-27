<script lang="ts" setup>
import { Socket } from 'socket.io-client';
import QRCode from 'qrcode';
import { SendServiceError } from '~/utils/p2p_send';

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

/* Inject */
const { t } = useI18n();
const { log } = useDebugInfo();

/* Reactive */
const refs = reactive({
  fileName: null as null | string,
  fileSize: 0,
  fileRecvSize: 0,
  status: Status.Idle,
  shareLink: '',
  qrDataUrl: null as null | string,
  selfId: null as null | string,
  peerId: null as null | string,
  avgSpeed: 0,
  insSpeed: 0,
  error: ''
});

/* Computed */
const fileSizeTxt = computed((): string => convert(refs.fileSize, 'B'));
const avgSpeedTxt = computed((): string => convert(refs.avgSpeed, 'B/s'));
const insSpeedTxt = computed((): string => convert(refs.insSpeed, 'B/s'));

/* Variables */
let file: File;
let socket: Socket;
let peerConn: RTCPeerConnection;
let handle: number;

/* Functions */
function selectFile(ev: Event): void {
  const el: HTMLInputElement = ev.target as HTMLInputElement;
  const files: FileList = el.files as FileList;

  if (files.length === 0) {
    el.value = '';
    return;
  }
  file = files[0];

  log(`File selected: name="${file.name}" size=${file.size}`);
  refs.fileName = file.name;
  refs.fileSize = file.size;
  refs.qrDataUrl = null;
  refs.selfId = null;
  refs.peerId = null;
  refs.error = '';
  refs.status = Status.Idle;

  el.value = '';
}
function abort(): void {
  refs.status = Status.Error;
  refs.error = t('error.abort');
  socket.disconnect();
  peerConn.close();
  clearInterval(handle);
  window.onbeforeunload = null;
  log('Abort triggered');
}
function sendFile(): void {
  let startTime: number;
  let lastRecvSize: number = 0;

  startSendService(
    file,
    (err: SendServiceError): void => {
      if (refs.status === Status.Finished || refs.status === Status.Error) {
        return;
      }
      refs.status = Status.Error;
      socket.disconnect();
      peerConn.close();
      clearInterval(handle);
      window.onbeforeunload = null;

      switch (err) {
        case SendServiceError.WebRTCDisabled:
          log('Send service error: WebRTC disabled');
          refs.error = t('error.webrtc_disabled');
          break;
        case SendServiceError.ConnectFail:
          log('Send service error: Signal connect fail');
          refs.error = t('error.signal_conn');
          break;
        case SendServiceError.UnexpectedDisconnect:
          log('Send service error: Unexpected signal disconnect');
          refs.error = t('error.signal_disconn');
          break;
        case SendServiceError.WebRTCConnectFail:
          log('Send service error: WebRTC connect fail');
          refs.error = t('error.webrtc_conn');
          break;
        case SendServiceError.DataChannelFail:
          log('Send service error: Data channel fail');
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
    async (selfId: string): Promise<void> => {
      refs.selfId = selfId;
      refs.shareLink = window.location.href + '?' + selfId;
      refs.qrDataUrl = await QRCode.toDataURL(refs.shareLink);
      refs.status = Status.WaitingPeer;
    },
    (peerId: string): void => {
      refs.peerId = peerId;
      refs.status = Status.WaitingAccept;
    },
    (): void => {
      log('Start negotiating');
      refs.status = Status.Negotiating;
    },
    (): void => {
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
      refs.status = Status.Transfering;
    },
    (recvBytes: number): void => {
      if (recvBytes > refs.fileRecvSize) {
        refs.fileRecvSize = recvBytes;
        if (recvBytes >= refs.fileSize) {
          refs.status = Status.Finished;
          log('Send finished');
          clearInterval(handle);
          window.onbeforeunload = null;
          setTimeout((): void => {
            socket.disconnect();
            peerConn.close();
          }, 3000);
        }
      }
    }
  );
}
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <div class="flex gap-4">
      <FileSelector
        v-if="refs.status <= Status.Idle || refs.status === Status.Finished"
        @select="selectFile"
        class="border-green-500 hover:bg-green-500"
        id="file-input">
        {{ $t('button.select_file') }}
      </FileSelector>
      <template v-if="refs.fileName !== null">
        <AppButton
          v-if="refs.status === Status.Idle"
          @click="sendFile"
          class="border-blue-500 hover:bg-blue-500"
          :disabled="refs.fileName === null">
          {{ $t('button.send') }}
        </AppButton>
        <AppButton
          v-if="Status.Idle < refs.status && refs.status < Status.Finished"
          @click="abort"
          class="border-red-500 hover:bg-red-500">
          {{ $t('button.abort') }}
        </AppButton>
      </template>
    </div>
    <div v-if="refs.fileName !== null" class="flex flex-col gap-2 items-center md:flex-row md:gap-4">
      <AppQRCode
        v-if="refs.qrDataUrl !== null"
        :data-url="refs.qrDataUrl"
        :share-link="refs.shareLink"/>
      <div class="flex flex-col">
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
        <p v-if="refs.selfId !== null">
          <b>{{ $t('ui.self_id') }}</b>{{ refs.selfId }}
        </p>
        <p v-if="refs.peerId !== null">
          <b>{{ $t('ui.peer_id') }}</b>{{ refs.peerId }}
        </p>
        <template v-if="refs.status >= Status.Transfering">
          <p><b>{{ $t('ui.avg_speed') }}</b>{{ avgSpeedTxt }}</p>
          <p><b>{{ $t('ui.ins_speed') }}</b>{{ insSpeedTxt }}</p>
          <ProgressBar
            class="my-1"
            color="bg-green-400"
            :progress="refs.fileRecvSize / refs.fileSize * 100"/>
        </template>
      </div>
    </div>
    <p
      v-if="refs.error.length !== 0"
      class="font-bold max-w-[15rem] text-red-500">
      {{ refs.error }}
    </p>
  </div>
</template>
