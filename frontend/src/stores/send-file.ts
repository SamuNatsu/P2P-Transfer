/// Send file store module
import { createGlobalState } from '@vueuse/core';
import { ComputedRef, Ref, computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { Sender } from '@/utils/sender';

// External stores
import { formatNumber, formatTime, useStore } from '@/stores';

// Export store
export const useSendFileStore = createGlobalState(() => {
  /// Injects
  const { t } = useI18n();
  const { status: mainStatus } = useStore();

  /// States
  const code: Ref<string | null> = ref(null);
  const failReason: Ref<string> = ref('');
  const file: Ref<File | null> = ref(null);
  const recvBytes: Ref<number> = ref(0);
  const speed: Ref<number> = ref(0);
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
  const time: Ref<number> = ref(0);

  let _sender: Sender | null = null;

  /// Getters
  const failReasonStr: ComputedRef<string> = computed((): string =>
    t('fail.' + failReason.value)
  );
  const fileSize: ComputedRef<string> = computed((): string =>
    file.value === null ? '' : formatNumber(file.value.size, 'B')
  );
  const percent: ComputedRef<number> = computed((): number =>
    file.value === null ? 0 : recvBytes.value / file.value.size
  );
  const speedStr: ComputedRef<string> = computed((): string =>
    formatNumber(speed.value, 'B/s')
  );
  const statusStr: ComputedRef<string> = computed((): string =>
    t('status.' + status.value)
  );
  const timeStr: ComputedRef<string> = computed((): string =>
    formatTime(time.value)
  );

  /// Actions
  const cleanup = (): void => {
    _sender?.cleanup();
    _sender = null;
  };
  const interrupt = (): void => {
    status.value = 'interrupted';
    cleanup();
  };
  const resetStore = (): void => {
    file.value = null;
    status.value = 'idle';
    code.value = null;
    recvBytes.value = 0;
    failReason.value = '';

    cleanup();
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
  const start = (): void => {
    status.value = 'connecting';

    // Create sender
    _sender = new Sender(file.value!);
    _sender.on('failed', (reason: string): void => {
      if (
        ['idle', 'finished', 'failed', 'interrupted'].includes(status.value)
      ) {
        return;
      }
      status.value = 'failed';
      failReason.value = reason;
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
    _sender.on('statistic', (curSpeed: number, timeLeft: number): void => {
      speed.value = curSpeed;
      time.value = timeLeft;
    });
    _sender.on('finished', (): void => {
      status.value = 'finished';
    });
  };

  /// Return store
  return {
    code,
    file,
    status,

    failReasonStr,
    fileSize,
    percent,
    speedStr,
    statusStr,
    timeStr,

    interrupt,
    resetStore,
    selectFile,
    start
  };
});
