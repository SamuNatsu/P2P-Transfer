/// Store module
import { createGlobalState } from '@vueuse/core';
import { ComputedRef, Ref, computed, ref } from 'vue';

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

// Export store
export const useStore = createGlobalState(() => {
  /// States
  const initState: Ref<'waiting' | 'unsupport' | 'fail' | 'ok'> =
    ref('waiting');
  const selectedFile: Ref<File | null> = ref(null);

  let _socket: WebSocket | null = null;

  /// Getters
  const selectedFileSize: ComputedRef<string> = computed((): string =>
    selectedFile.value === null
      ? ''
      : formatNumber(selectedFile.value.size, 'B')
  );

  /// Actions
  const init = (): void => {
    // Check unsupport
    if (typeof WebSocket !== 'function') {
      initState.value = 'unsupport';
      return;
    }
    if (typeof RTCPeerConnection !== 'function') {
      initState.value = 'unsupport';
      return;
    }

    // Connect server
    _socket = new WebSocket(location.origin.replace('http', 'ws') + '/ws');
    _socket.addEventListener('error', (): void => {
      initState.value = 'fail';
    });
    _socket.addEventListener('open', (): void => {
      initState.value = 'ok';
    });
    _socket.addEventListener('close', (): void => {
      initState.value = 'fail';
    });
  };
  const selectFile = (): void => {
    const el: HTMLInputElement = document.createElement('input');
    el.type = 'file';
    el.addEventListener('change', (): void => {
      selectedFile.value = el.files![0];
    });
    el.click();
  };

  /// Return store
  return { initState, selectedFile, selectedFileSize, init, selectFile };
});
