/// Receive file store module
import { createGlobalState } from '@vueuse/core';
import { ComputedRef, Ref, computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { Receiver } from '@/utils/receiver';

// External stores
import { formatNumber, formatTime } from '@/stores';

// Export store
export const useRecvFileStore = createGlobalState(() => {
  /// Injects
  const { t } = useI18n();

  /// States
  const failReason: Ref<string> = ref('');
  const fileName: Ref<string> = ref('');
  const fileSize: Ref<number> = ref(0);
  const recvBytes: Ref<number> = ref(0);
  const speed: Ref<number> = ref(0);
  const status: Ref<
    | 'idle'
    | 'connecting'
    | 'negotiating'
    | 'transfering'
    | 'finished'
    | 'failed'
    | 'interrupted'
  > = ref('idle');
  const time: Ref<number> = ref(0);

  let _receiver: Receiver | null = null;

  /// Getters
  const failReasonStr: ComputedRef<string> = computed((): string =>
    t('fail.' + failReason.value)
  );
  const fileSizeStr: ComputedRef<string> = computed((): string =>
    formatNumber(fileSize.value, 'B')
  );
  const percent: ComputedRef<number> = computed((): number =>
    fileSize.value === 0 ? 0 : recvBytes.value / fileSize.value
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
    _receiver?.cleanup();
    _receiver = null;
  };
  const interrupt = (): void => {
    status.value = 'interrupted';
    cleanup();
  };
  const resetStore = (): void => {
    status.value = 'idle';
    fileName.value = '';
    fileSize.value = 0;
    recvBytes.value = 0;
    failReason.value = '';

    cleanup();
  };
  const start = (code: string): void => {
    status.value = 'connecting';

    // Create sender
    _receiver = new Receiver(code);
    _receiver.on('failed', (reason: string): void => {
      if (
        ['idle', 'finished', 'failed', 'interrupted'].includes(status.value)
      ) {
        return;
      }
      status.value = 'failed';
      failReason.value = reason;
    });
    _receiver.on('requested', (name: string, size: number): void => {
      fileName.value = name;
      fileSize.value = size;
      status.value = 'negotiating';
    });
    _receiver.on('start', (): void => {
      status.value = 'transfering';
    });
    _receiver.on('progress', (recv: number): void => {
      recvBytes.value = recv;
    });
    _receiver.on('statistic', (curSpeed: number, timeLeft: number): void => {
      speed.value = curSpeed;
      time.value = timeLeft;
    });
    _receiver.on('finished', (): void => {
      status.value = 'finished';
    });
  };

  /// Return store
  return {
    fileName,
    fileSize,
    status,

    failReasonStr,
    fileSizeStr,
    percent,
    speedStr,
    statusStr,
    timeStr,

    interrupt,
    resetStore,
    start
  };
});
