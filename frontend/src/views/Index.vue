<script lang="ts" setup>
// Stores
import { useStore } from '@/stores';

// Components
import InitClosed from '@/components/init/InitClosed.vue';
import InitFail from '@/components/init/InitFail.vue';
import InitOk from '@/components/init/InitOk.vue';
import InitUnsupport from '@/components/init/InitUnsupport.vue';
import InitWaiting from '@/components/init/InitWaiting.vue';

// Injects
const { initState } = useStore();
</script>

<template>
  <div>
    <Transition>
      <InitWaiting v-if="initState === 'waiting'" />
      <InitUnsupport v-else-if="initState === 'unsupport'" />
      <InitFail v-else-if="initState === 'fail'" />
      <InitOk v-else-if="initState === 'ok'" />
      <InitClosed v-else />
    </Transition>
  </div>
</template>

<style scoped>
.v-enter-active,
.v-leave-active {
  @apply transition-opacity;
}

.v-enter-from,
.v-leave-to {
  @apply opacity-0;
}
</style>
