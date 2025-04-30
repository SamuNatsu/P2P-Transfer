import { cacheDb } from '@/databases/cache';
import { Receiver } from '@/utils/receiver';
import { createGlobalState } from '@vueuse/core';
import { computed, ref } from 'vue';

/* Types */
export type ReceiverState =
  | 'code-inp'
  | 'conn-sig'
  | 'wait-start'
  | 'negotiate'
  | 'recv'
  | 'done'
  | 'error';

// Export store
export const useReceiver = createGlobalState(() => {
  /* States */
  const state = ref<ReceiverState>('code-inp');
  const error = ref<Error | null>(null);
  const code = ref<string>('');
  const fileName = ref<string | null>(null);
  const fileMime = ref<string | null>(null);
  const fileSize = ref<number | null>(null);
  const available = ref<boolean | null>(null);
  const progress = ref<number>(0);
  const remainingTime = ref<number>(0);
  const speed = ref<number>(0);

  let receiver = null as Receiver | null;

  /* Getter */
  const stateStr = computed(() => {
    switch (state.value) {
      case 'code-inp':
        return 'Inputing Code';
      case 'conn-sig':
        return 'Connecting signal server';
      case 'wait-start':
        return 'Waiting for starting';
      case 'negotiate':
        return 'Negotiating';
      case 'recv':
        return 'Receiving';
      case 'done':
        return 'Finished';
      case 'error':
        return 'Error';
    }
  });
  const stateCls = computed(() => {
    switch (state.value) {
      case 'code-inp':
        return '';
      case 'conn-sig':
        return 'text-cyan-500';
      case 'wait-start':
        return 'text-yellow-500';
      case 'negotiate':
        return 'text-purple-500';
      case 'recv':
        return 'text-blue-500';
      case 'done':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
    }
  });

  /* Actions */
  const onBeforeUnload = (ev: BeforeUnloadEvent) => {
    if (!['file-sel', 'done', 'error'].includes(state.value)) {
      ev.preventDefault();
      ev.returnValue = '';
    }
  };
  const reset = () => {
    state.value = 'code-inp';
    error.value = null;
    code.value = '';
    fileName.value = null;
    fileMime.value = null;
    fileSize.value = null;
    available.value = null;
    progress.value = 0;
    remainingTime.value = 0;
    speed.value = 0;

    receiver = null;

    window.addEventListener('beforeunload', onBeforeUnload);
    cacheDb.delete({ disableAutoOpen: false });
  };
  const clearEffect = () => {
    receiver?.close();

    window.removeEventListener('beforeunload', onBeforeUnload);
    cacheDb.delete({ disableAutoOpen: false });
  };
  const connect = async () => {
    state.value = 'conn-sig';

    receiver = new Receiver();
    receiver.on('connected', () => receiver?.find(code.value));
    receiver.on(
      'file',
      (name: string, mime: string, size: number, avail: boolean) => {
        state.value = 'wait-start';
        fileName.value = name;
        fileMime.value = mime;
        fileSize.value = size;
        available.value = avail;
      },
    );
    receiver.on('negotiate', () => (state.value = 'negotiate'));
    receiver.on('recv', () => (state.value = 'recv'));
    receiver.on('progress', (spd: number, rt: number, pct: number) => {
      progress.value = pct;
      remainingTime.value = rt;
      speed.value = spd;
    });
    receiver.on('done', () => {
      state.value = 'done';
      receiver?.close();
    });
    receiver.on('error', (err: Error) => {
      state.value = 'error';
      error.value = err;
      receiver = null;
      console.error(err);
    });
  };
  const start = async () => {
    state.value = 'negotiate';
    receiver?.start();
  };

  // Returns
  return {
    state,
    error,
    code,
    fileName,
    fileMime,
    fileSize,
    available,
    progress,
    remainingTime,
    speed,

    stateStr,
    stateCls,

    reset,
    clearEffect,
    connect,
    start,
  };
});
