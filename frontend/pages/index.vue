<script lang="ts" setup>
/* Types */
enum Mode {
  Receive,
  Send
}

/* Inject */
const route = useRoute();

/* Page meta */
definePageMeta({
  title: 'seo.title',
  description: 'seo.description'
});

/* Reactive */
const refs = reactive({
  mode: null as null | Mode,
  peerId: ''
});
const recvRef: Ref = ref();

/* Functions */
function init() {
  if (recvRef.value === undefined) {
    return;
  }
  recvRef.value.init();
}

/* Life cycle */
onMounted((): void => {
  const queryKeys: string[] = Object.keys(route.query);

  if (queryKeys.length === 0) {
    refs.mode = Mode.Send;
  } else {
    refs.peerId = queryKeys[0];
    refs.mode = Mode.Receive;
  }
});
</script>

<template>
  <div
    class="fixed flex flex-col gap-12 inset-0 items-center justify-center">
    <AppHeader/>
    <main class="flex flex-col items-center gap-4">
      <Transition mode="out-in" @after-enter="init">
        <LazyReceiver
          v-if="refs.mode === Mode.Receive"
          :peer-id="refs.peerId"
          ref="recvRef"/>
        <LazySender v-else-if="refs.mode === Mode.Send"/>
        <div
          v-else
          class="absolute animate-spin border-4 border-blue-500 border-r-transparent h-12 w-12 rounded-full">
        </div>
      </Transition>
    </main>
  </div>
</template>

<style scoped>
.v-move,
.v-enter-active,
.v-leave-active {
  transition: opacity .2s;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
