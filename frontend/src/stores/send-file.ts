/// Send file store module
import { createGlobalState } from '@vueuse/core';
import { ComputedRef, Ref, computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { Sender } from '@/utils/sender';

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
  const recvBytes: Ref<number> = ref(0);

  let _sender: Sender | null = null;

  /// Getters
  const fileSize: ComputedRef<string> = computed((): string =>
    file.value === null ? '' : formatNumber(file.value.size, 'B')
  );
  const statusStr: ComputedRef<string> = computed((): string =>
    t('status.' + status.value)
  );
  const percent: ComputedRef<number> = computed((): number =>
    file.value === null ? 0 : recvBytes.value / file.value.size
  );

  /// Actions
  const resetStore = (): void => {
    file.value = null;
    status.value = 'idle';
    code.value = null;
    recvBytes.value = 0;

    _sender = null;
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
    _sender = null;
  };
  const start = (): void => {
    status.value = 'connecting';

    // Create sender
    _sender = new Sender(file.value!);
    _sender.on('failed', (_reason: string): void => {
      status.value = 'failed';
    });
    _sender.on('registered', (recvCode: string): void => {
      code.value = recvCode;
      status.value = 'waiting';
    });
    _sender.on('negotiate', (): void => {
      status.value = 'negotiating';
    });
    _sender.on('start', (): void => {
      status.value = 'transfering';
    });
    _sender.on('progress', (recv: number): void => {
      recvBytes.value = recv;
    });
    _sender.on('finished', (): void => {
      status.value = 'finished';
    });
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
    percent,
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
