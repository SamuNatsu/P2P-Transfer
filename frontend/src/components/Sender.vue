<script lang="ts" setup>
import { SendServiceError } from '@/utils/send';
import { Socket } from 'socket.io-client';

/* Types */
enum Status {
  Error,
  Idle,
  ConnectSignal,
  WaitingPeer,
  WaitingDownload,
  Negotiating,
  Transfering,
  Finished
}

/* Injects */
const { t } = useI18n();

/* Emits */
const emits = defineEmits<{
  close: [];
}>();

/* Reactives */
const file: Ref<File | undefined> = ref();
const status: Ref<Status> = ref(Status.Idle);
const localId: Ref<string | undefined> = ref();
const remoteId: Ref<string | undefined> = ref();
const shareLink: Ref<string | undefined> = ref();
const speed: Ref<number> = ref(0);
const recvSize: Ref<number> = ref(0);
const error: Ref<string | undefined> = ref();

/* Computed */
const fileSizeTxt = computed((): string => convert(file.value?.size ?? 0, 'B'));
const fileTypeTxt = computed((): string =>
  file.value === undefined || file.value.type.length === 0
    ? 'Unkown'
    : file.value.type
);
const speedTxt = computed((): string => convert(speed.value, 'B/s'));

/* Variables */
let socket: Socket;
let peerConn: RTCPeerConnection;
let handle: number;

/* Functions */
function tryClose(): void {
  if (status.value <= Status.Idle || status.value === Status.Finished) {
    emits('close');
  }
}
function selectFile(ev: Event): void {
  const el: HTMLInputElement = ev.target as HTMLInputElement;
  const files: FileList = el.files as FileList;

  if (files.length === 0) {
    return;
  }

  file.value = files[0];
  status.value = Status.Idle;
  localId.value = undefined;
  remoteId.value = undefined;
  shareLink.value = undefined;
  speed.value = 0;
  recvSize.value = 0;
  error.value = undefined;
}
function abort(): void {
  status.value = Status.Error;
  error.value = t('error.abort');

  if (socket !== undefined) {
    socket.disconnect();
    peerConn.close();
  }

  window.clearInterval(handle);
  window.onbeforeunload = null;
}
function send(): void {
  let lastRecvSize: number = 0;

  startSendService(
    file.value as File,
    (err: SendServiceError): void => {
      if (status.value === Status.Error || status.value === Status.Finished) {
        return;
      }
      abort();

      switch (err) {
        case SendServiceError.WebSocketNotAvailable:
          error.value = t('error.ws_not_avail');
          break;
        case SendServiceError.WebRTCNotAvailable:
          error.value = t('error.webrtc_not_avail');
          break;
        case SendServiceError.SignalConnectFail:
          error.value = t('error.signal_conn_fail');
          break;
        case SendServiceError.SignalUnexpectDisconnect:
          error.value = t('error.signal_disconn_fail');
          break;
        case SendServiceError.WebRTCConnectFail:
          error.value = t('error.webrtc_conn_fail');
          break;
        case SendServiceError.DataChannelError:
          error.value = t('error.data_ch_error');
          break;
      }
    },
    (): void => {
      status.value = Status.ConnectSignal;
    },
    (inSocket: Socket, inPeerConn: RTCPeerConnection): void => {
      socket = inSocket;
      peerConn = inPeerConn;
    },
    (inLocalId: string): void => {
      localId.value = inLocalId;
      shareLink.value = window.location.origin + '?' + inLocalId;
      status.value = Status.WaitingPeer;
    },
    (inRemoteId: string): void => {
      remoteId.value = inRemoteId;
      status.value = Status.WaitingDownload;
    },
    (): void => {
      status.value = Status.Negotiating;
    },
    (): void => {
      handle = window.setInterval((): void => {
        speed.value = recvSize.value - lastRecvSize;
        lastRecvSize = recvSize.value;
      }, 1000);
      status.value = Status.Transfering;
    },
    (inRecvSize: number): void => {
      recvSize.value = inRecvSize;
    },
    (): void => {
      status.value = Status.Finished;
      window.clearInterval(handle);
      window.onbeforeunload = null;
    });
}

/* Life cycle */
onBeforeMount((): void => {
  window.onunload = abort;
});
onBeforeUnmount((): void => {
  window.onunload = null;
});
</script>

<template>
  <div
  class="backdrop-brightness-[.2] fixed flex inset-0 items-center justify-center z-10">
    <div @click="tryClose" class="fixed inset-0"></div>
    <div
      class="bg-white flex flex-col gap-8 items-center p-4 rounded-lg z-20 dark:bg-neutral-900 dark:border-2 dark:border-white dark:text-white">
      <h1
        class="font-bold font-smiley text-2xl">
        {{ $t('button.send_file') }}
      </h1>
      <div class="flex flex-col gap-4 items-center">
        <div class="flex flex-col gap-4 items-center md:flex-row">
          <FileSelector
            @select="selectFile"
            class="border-green-500 dark:hover:bg-green-500 hover:bg-green-500"
            id="file-input">
            {{ $t('button.select_file') }}
          </FileSelector>
          <template v-if="file !== undefined">
            <FilePreview :file="file"/>
            <Button
              v-if="status === Status.Idle"
              @click="send"
              class="border-blue-500 dark:hover:bg-blue-500 hover:bg-blue-500">
              {{ $t('button.start_send') }}
            </Button>
            <Button
              v-if="status > Status.Idle && status < Status.Finished"
              @click="abort"
              class="border-red-500 dark:hover:bg-red-500 hover:bg-red-500">
              {{ $t('button.abort') }}
            </Button>
          </template>
        </div>
        <div
          v-if="file !== undefined"
          class="flex flex-col gap-4 items-center md:flex-row">
          <QRCode v-if="shareLink !== undefined" :text="shareLink"/>
          <table>
            <tbody>
              <tr>
                <th>{{ $t('status._') }}</th>
                <td
                  v-if="status === Status.Error"
                  class="text-red-500">
                  {{ $t('status.error') }}
                </td>
                <td
                  v-else-if="status === Status.Idle"
                  class="text-neutral-500">
                  {{ $t('status.idle') }}
                </td>
                <td
                  v-else-if="status === Status.ConnectSignal"
                  class="text-orange-500">
                  {{ $t('status.conn_signal') }}
                </td>
                <td
                  v-else-if="status === Status.WaitingPeer"
                  class="text-cyan-500">
                  {{ $t('status.wait_peer') }}
                </td>
                <td
                  v-else-if="status === Status.WaitingDownload"
                  class="text-purple-500">
                  {{ $t('status.wait_start') }}
                </td>
                <td
                  v-else-if="status === Status.Negotiating"
                  class="text-yellow-500">
                  {{ $t('status.negotiate') }}
                </td>
                <td
                  v-else-if="status === Status.Transfering"
                  class="text-blue-500">
                  {{ $t('status.transfer') }}
                </td>
                <td v-else
                  class="text-green-500">
                  {{ $t('status.finish') }}
                </td>
              </tr>
              <tr>
                <th>{{ $t('ui.file_name') }}</th>
                <td :title="file.name">{{ file.name }}</td>
              </tr>
              <tr>
                <th>{{ $t('ui.file_size') }}</th>
                <td :title="`${file.size} Byte(s)`">{{ fileSizeTxt }}</td>
              </tr>
              <tr>
                <th>{{ $t('ui.file_type') }}</th>
                <td :title="fileTypeTxt">{{ fileTypeTxt }}</td>
              </tr>
              <tr v-if="localId !== undefined">
                <th>{{ $t('ui.local_id') }}</th>
                <td>{{ localId }}</td>
              </tr>
              <tr v-if="remoteId !== undefined">
                <th>{{ $t('ui.remote_id') }}</th>
                <td>{{ remoteId }}</td>
              </tr>
              <tr v-if="status >= Status.Transfering">
                <th>{{ $t('ui.speed') }}</th>
                <td>{{ speedTxt }}</td>
              </tr>
              <tr v-if="status > Status.Idle && status < Status.Transfering">
                <td class="pt-4 px-4" colspan="2">
                  <LoadingBar/>
                </td>
              </tr>
              <tr v-else-if="status >= Status.Transfering">
                <td class="pt-4 px-4" colspan="2">
                  <ProgressBar
                    class="border-green-600 w-full"
                    color="bg-green-400"
                    :progress="recvSize / file.size * 100"/>
                </td>
              </tr>
              <tr v-if="error !== undefined">
                <td
                  class="break-all font-bold pt-4 px-4 text-center text-red-500 !whitespace-pre-wrap"
                  colspan="2">
                  {{ error }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
td {
  @apply max-w-[10rem] overflow-hidden text-ellipsis whitespace-nowrap
}

th {
  @apply px-4
}
</style>
