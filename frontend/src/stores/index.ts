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

// Get formatted number string
export const formatNumber = (x: number, unit: string): string => {
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

// Get formatted time string
export const formatTime = (x: number): string => {
  x = Math.floor(x);

  const hr: number = Math.floor(x / 3600);
  x %= 3600;
  const mn: number = Math.floor(x / 60);
  x %= 60;

  return hr > 99
    ? '∞'
    : `${hr}:${mn.toString().padStart(2, '0')}:${x
        .toString()
        .padStart(2, '0')}`;
};
