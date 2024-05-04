/// Receive file store module
import { createGlobalState } from '@vueuse/core';
import { ComputedRef, Ref, computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { Receiver } from '@/utils/receiver';
import { cache } from '@/utils/file-cache';

// External stores
import { formatNumber, formatTime } from '@/stores';

// Export store
export const useRecvFileStore = createGlobalState(() => {
  /// Injects
  const { t } = useI18n();

  /// States
  const avgSpeed: Ref<number> = ref(0);
  const failReason: Ref<string> = ref('');
  const fileName: Ref<string> = ref('');
  const fileSize: Ref<number> = ref(0);
  const fileType: Ref<string> = ref('');
  const metaGot: Ref<boolean> = ref(false);
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
  const avgSpeedStr: ComputedRef<string> = computed((): string =>
    formatNumber(avgSpeed.value, 'B/s')
  );
  const failReasonStr: ComputedRef<string> = computed((): string =>
    t('fail.' + failReason.value)
  );
  const fileSizeStr: ComputedRef<string> = computed((): string =>
    formatNumber(fileSize.value, 'B')
  );
  const percentStr: ComputedRef<string> = computed(
    (): string =>
      (fileSize.value === 0
        ? 0
        : (recvBytes.value / fileSize.value) * 100
      ).toFixed(1) + '%'
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
    _receiver?.destroy();
    _receiver = null;

    cache.clear();
  };
  const interrupt = (): void => {
    status.value = 'interrupted';
    cleanup();
  };
  const resetStore = (): void => {
    failReason.value = '';
    fileName.value = '';
    fileSize.value = 0;
    metaGot.value = false;
    recvBytes.value = 0;
    speed.value = 0;
    status.value = 'idle';
    time.value = 0;

    cleanup();
  };
  const saveMemory = async (): Promise<void> => {
    await cache.memoryDownload(fileName.value, fileType.value);
  };
  const saveStream = async (): Promise<void> => {
    await cache.streamDownload(fileName.value, fileSize.value);
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
    _receiver.on(
      'requested',
      (name: string, size: number, type: string): void => {
        fileName.value = name;
        fileSize.value = size;
        fileType.value = type;
        metaGot.value = true;

        status.value = 'negotiating';
      }
    );
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
    _receiver.on('finished', (speed: number): void => {
      avgSpeed.value = speed;
      status.value = 'finished';
    });
  };

  /// Return store
  return {
    fileName,
    fileSize,
    metaGot,
    status,

    avgSpeedStr,
    failReasonStr,
    fileSizeStr,
    percentStr,
    speedStr,
    statusStr,
    timeStr,

    interrupt,
    resetStore,
    saveMemory,
    saveStream,
    start
  };
});
