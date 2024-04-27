/// Send file store module
import { createGlobalState } from '@vueuse/core';
import { ComputedRef, Ref, computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { Socket, io } from 'socket.io-client';

// External stores
import { useStore } from '@/stores';

// Export store
export const useSendFileStore = createGlobalState(() => {
  /// Injects
  const { t } = useI18n();
  const { status: mainStatus } = useStore();

  /// States
  const file: Ref<File | null> = ref(null);
  const status: Ref<
    | 'idle'
    | 'connecting'
    | 'waiting'
    | 'negotiating'
    | 'transfering'
    | 'finished'
    | 'failed'
    | 'interrupted'
  > = ref('idle');
  const code: Ref<string | null> = ref(null);

  let _sessionId: string | null = null;
  let _peerId: string | null = null;
  let _socket: Socket | null = null;

  /// Getters
  const fileSize: ComputedRef<string> = computed((): string =>
    file.value === null ? '' : formatNumber(file.value.size, 'B')
  );
  const statusStr: ComputedRef<string> = computed((): string =>
    t('status.' + status.value)
  );

  /// Actions
  const resetStore = (): void => {
    file.value = null;
    status.value = 'idle';
    code.value = null;

    _sessionId = null;
    _peerId = null;
    _socket = null;
  };
  const selectFile = (): void => {
    resetStore();

    const el: HTMLInputElement = document.createElement('input');
    el.type = 'file';
    el.addEventListener('change', (): void => {
      file.value = el.files![0];

      mainStatus.value = 'send';
    });
    el.click();
  };
  const cleanup = (): void => {
    if (_socket !== null) {
      _socket.disconnect();
      _socket = null;
    }
  };
  const start = (): void => {
    status.value = 'connecting';

    _socket = io({
      auth: { sessionId: _sessionId },
      path: '/ws',
      reconnectionAttempts: 5
    });
    _socket.io.on('reconnect_failed', (): void => {
      status.value = 'failed';
    });
    _socket.on('session', (sessionId: string): void => {
      _sessionId = sessionId;
    });
    _socket.on('peer', (peerId: string): void => {
      _peerId = peerId;
      status.value = 'negotiating';
    });

    // Register session
    _socket.emit(
      'register',
      file.value!.name,
      file.value!.size,
      (receiveCode: string): void => {
        code.value = receiveCode;
        status.value = 'waiting';
      }
    );
  };
  const interrupt = (): void => {
    cleanup();
    status.value = 'interrupted';
  };

  /// Return store
  return {
    file,
    status,
    code,
    fileSize,
    statusStr,
    selectFile,
    cleanup,
    start,
    interrupt
  };
});

// Get formatted number string
const formatNumber = (x: number, unit: string): string => {
  if (x < 1024) {
    return x.toString() + ' ' + unit;
  } else if (x < 1048576) {
    return (x / 1024).toFixed(1) + ' K' + unit;
  } else if (x < 1073741824) {
    return (x / 1048576).toFixed(1) + ' M' + unit;
  } else if (x < 1099511627776) {
    return (x / 1073741824).toFixed(1) + ' G' + unit;
  } else {
    return (x / 1099511627776).toFixed(1) + ' T' + unit;
  }
};
