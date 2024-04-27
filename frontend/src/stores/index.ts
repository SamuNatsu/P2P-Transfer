/// Store module
import { PackageFactory } from '@/net/package';
import { createGlobalState } from '@vueuse/core';
import { Ref, ref } from 'vue';

// Export store
export const useStore = createGlobalState(() => {
  /// States
  const initState: Ref<'waiting' | 'unsupport' | 'fail' | 'ok' | 'closed'> =
    ref('waiting');
  const mode: Ref<'send' | 'receive' | null> = ref(null);

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
    _socket.addEventListener('close', (): void => {
      initState.value = 'closed';
    });
    _socket.addEventListener('error', (): void => {
      initState.value = 'fail';
    });
    _socket.addEventListener('open', (): void => {
      initState.value = 'ok';

      _socket!.binaryType = 'arraybuffer';
      setInterval((): void => {
        _socket!.send(PackageFactory.heartbeat());
      }, 10000);
    });
  };
  const getWs = (): WebSocket | null => _socket;

  /// Return store
  return { initState, mode, init, getWs };
});
