/// Store module
import { createGlobalState } from '@vueuse/core';
import { Ref, ref } from 'vue';

// Types
export type LogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

// Export store
export const useStore = createGlobalState(() => {
  /// States
  const debugLogs: Ref<[LogLevel, string][]> = ref([]);
  const status: Ref<'home' | 'unsupport' | 'send' | 'receive'> = ref(
    typeof RTCPeerConnection !== 'function' ? 'unsupport' : 'home'
  );
  const showDebug: Ref<boolean> = ref(false);

  setTimeout((): void => {
    if (typeof RTCPeerConnection !== 'function') {
      status.value = 'unsupport';
    }
  }, 0);
  setTimeout((): void => {
    if (typeof RTCPeerConnection !== 'function') {
      status.value = 'unsupport';
    }
  }, 100);
  setTimeout((): void => {
    if (typeof RTCPeerConnection !== 'function') {
      status.value = 'unsupport';
    }
  }, 500);
  setTimeout((): void => {
    if (typeof RTCPeerConnection !== 'function') {
      status.value = 'unsupport';
    }
  }, 1000);

  /// Actions
  const addLog = (lv: LogLevel, msg: string): void => {
    const time: string = `[${new Date().toISOString()}] `;
    const level: string = `[${lv.padStart(5, ' ')}] `;
    debugLogs.value.push([lv, time + level + msg]);
  };
  const logger = {
    clear: (): void => {
      debugLogs.value = [];
    },
    trace: (msg: string): void => addLog('TRACE', msg),
    debug: (msg: string): void => addLog('DEBUG', msg),
    info: (msg: string): void => addLog('INFO', msg),
    warn: (msg: string): void => addLog('WARN', msg),
    error: (msg: string): void => addLog('ERROR', msg)
  };

  /// Return store
  return { debugLogs, status, showDebug, logger };
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
