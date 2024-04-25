/// Store module
import { createGlobalState } from '@vueuse/core';
import { Ref, ref } from 'vue';

// Export store
export const useStore = createGlobalState(() => {
  /// States
  const initState: Ref<'waiting' | 'unsupport' | 'fail' | 'ok'> =
    ref('waiting');

  let _socket: WebSocket | null = null;

  /// Getters

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
  };

  /// Return store
  return { initState, init };
});
