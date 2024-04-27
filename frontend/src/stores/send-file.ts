/// Send file store module
import { createGlobalState } from '@vueuse/core';
import { ComputedRef, Ref, computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

// External stores
import { useStore } from '@/stores';
import { PackageFactory, WsPackage, parsePackage } from '@/net/package';

// Export store
export const useSendFileStore = createGlobalState(() => {
  /// Injects
  const { t } = useI18n();
  const { mode, getWs } = useStore();

  /// States
  const file: Ref<File | null> = ref(null);
  const status: Ref<
    | 'idle'
    | 'registering'
    | 'waiting'
    | 'negotiating'
    | 'transfering'
    | 'finished'
    | 'failed'
    | 'interrupted'
  > = ref('idle');
  const code: Ref<string | null> = ref(null);

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
  };
  const selectFile = (): void => {
    const el: HTMLInputElement = document.createElement('input');
    el.type = 'file';
    el.addEventListener('change', (): void => {
      file.value = el.files![0];
      registerListeners();

      mode.value = 'send';
    });
    el.click();
  };
  const messageHandler = (ev: MessageEvent): void => {
    const pkg: WsPackage = parsePackage(ev.data);

    switch (pkg.type) {
      case 'register':
        code.value = pkg.code;
        status.value = 'waiting';
        break;
    }
  };
  const registerListeners = (): void => {
    getWs()!.addEventListener('message', messageHandler);
  };
  const unregisterListeners = (): void => {
    getWs()!.removeEventListener('message', messageHandler);
  };
  const startSend = (): void => {
    status.value = 'registering';
    getWs()!.send(PackageFactory.register());
  };
  const interrupt = (): void => {
    status.value = 'interrupted';
  };

  /// Return store
  return {
    file,
    status,
    code,
    fileSize,
    statusStr,
    resetStore,
    selectFile,
    registerListeners,
    unregisterListeners,
    startSend,
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
