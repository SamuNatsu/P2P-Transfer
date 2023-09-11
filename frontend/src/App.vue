<script lang="ts" setup>
import { isInternalBrowser } from '@/utils/browser';

/* Types */
enum Mode {
  None,
  Send,
  Receive
}

/* Reactives */
const mode: Ref<Mode> = ref(Mode.None);
const peerId: Ref<string> = ref('');

/* Life cycle */
onBeforeMount((): void => {
  detectLanguage();

  if (isInternalBrowser()) {
    return;
  }

  if (window.location.search.startsWith('?')) {
    const firstPair: string = window.location.search.slice(1).split('&')[0];
    const firstKey: string = firstPair.split('=')[0];

    peerId.value = firstKey;
    mode.value = Mode.Receive;
  }
});
</script>

<template>
  <div
    class="bg-neutral-100 fixed inset-0 transition-colors -z-50 dark:bg-neutral-900">
  </div>
  <BlockLayer v-if="isInternalBrowser()"/>
  <notifications position="top center"/>
  <div class="fixed flex flex-col gap-20 inset-0 items-center justify-center">
    <Header></Header>
    <div class="flex flex-col gap-4">
      <Button
        @click="mode = Mode.Send"
        class="border-blue-500 px-8 py-2 dark:hover:bg-blue-500 hover:bg-blue-500">
        {{ $t('button.send_file') }}
      </Button>
      <Button
        @click="mode = Mode.Receive"
        class="border-green-500 px-8 py-2 dark:hover:bg-green-500 hover:bg-green-500">
        {{ $t('button.recv_file') }}
      </Button>
    </div>
  </div>
  <Transition>
    <Sender v-if="mode === Mode.Send" @close="mode = Mode.None"/>
    <Receiver v-else-if="mode === Mode.Receive" @close="mode = Mode.None"/>
  </Transition>
  <Footer></Footer>
</template>

<style scoped>
.v-enter-active,
.v-leave-active {
  transition: opacity 0.2s;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
