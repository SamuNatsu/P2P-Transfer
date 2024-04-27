/// Store module
import { createGlobalState } from '@vueuse/core';
import { Ref, ref } from 'vue';

// Export store
export const useStore = createGlobalState(() => {
  /// States
  const status: Ref<'home' | 'unsupport' | 'send' | 'receive'> = ref(
    typeof RTCPeerConnection !== 'function' ? 'unsupport' : 'home'
  );

  /// Return store
  return { status };
});
