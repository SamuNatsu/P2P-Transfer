<script lang="ts" setup>
// Stores
import { useStore } from '@/stores';

// Components
import Home from '@/components/Home.vue';
import ReceiveFile from '@/components/ReceiveFile.vue';
import SendFile from '@/components/SendFile.vue';
import Unsupport from '@/components/Unsupport.vue';

// Injects
const { status } = useStore();
</script>

<template>
  <div class="flex flex-col items-center mt-20">
    <Transition>
      <Home v-if="status === 'home'" />
      <Unsupport v-else-if="status === 'unsupport'" />
      <SendFile v-else-if="status === 'send'" />
      <ReceiveFile v-else-if="status === 'receive'" />
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

.v-leave-active {
  @apply absolute;
}
</style>
