import { cacheDb } from '@/databases/cache';
import { Sender } from '@/utils/sender';
import { createGlobalState } from '@vueuse/core';
import { computed, ref } from 'vue';

/* Types */
export type SenderState =
  | 'file-sel'
  | 'conn-sig'
  | 'wait-recv'
  | 'negotiate'
  | 'send'
  | 'done'
  | 'error';

// Export store
export const useSender = createGlobalState(() => {
  /* States */
  const state = ref<SenderState>('file-sel');
  const error = ref<Error | null>(null);
  const file = ref<File | null>(null);
  const code = ref<string | null>(null);
  const progress = ref<number>(0);
  const remainingTime = ref<number>(0);
  const speed = ref<number>(0);

  let sender = null as Sender | null;

  /* Getter */
  const stateStr = computed(() => {
    switch (state.value) {
      case 'file-sel':
        return 'Selecting file';
      case 'conn-sig':
        return 'Connecting signal server';
      case 'wait-recv':
        return 'Waiting for receiver';
      case 'negotiate':
        return 'Negotiating';
      case 'send':
        return 'Sending';
      case 'done':
        return 'Finished';
      case 'error':
        return 'Error';
    }
  });
  const stateCls = computed(() => {
    switch (state.value) {
      case 'file-sel':
        return '';
      case 'conn-sig':
        return 'text-cyan-500';
      case 'wait-recv':
        return 'text-yellow-500';
      case 'negotiate':
        return 'text-purple-500';
      case 'send':
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
    state.value = 'file-sel';
    error.value = null;
    file.value = null;
    code.value = null;
    progress.value = 0;
    remainingTime.value = 0;
    speed.value = 0;
    sender = null;

    window.addEventListener('beforeunload', onBeforeUnload);
    cacheDb.delete({ disableAutoOpen: false });
  };
  const clearEffect = () => {
    sender?.close();

    window.removeEventListener('beforeunload', onBeforeUnload);
    cacheDb.delete({ disableAutoOpen: false });
  };
  const start = async () => {
    state.value = 'conn-sig';

    sender = new Sender(file.value!);
    sender.on('connected', () => sender?.start());
    sender.on('code', (c: string) => {
      state.value = 'wait-recv';
      code.value = c;
    });
    sender.on('negotiate', () => {
      state.value = 'negotiate';
    });
    sender.on('send', () => {
      state.value = 'send';
    });
    sender.on('progress', (spd: number, rt: number, pct: number) => {
      progress.value = pct;
      remainingTime.value = rt;
      speed.value = spd;
    });
    sender.on('done', () => {
      state.value = 'done';
    });
    sender.on('error', (err: Error) => {
      state.value = 'error';
      error.value = err;
      sender = null;
      console.error(err);
    });
  };

  // Returns
  return {
    state,
    error,
    file,
    code,
    progress,
    remainingTime,
    speed,

    stateStr,
    stateCls,

    reset,
    clearEffect,
    start,
  };
});
