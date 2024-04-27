<script lang="ts" setup>
// Stores
import { useStore } from '@/stores';

// Components
import Home from '@/components/Home.vue';
import SendFile from '@/components/SendFile.vue';
import Unsupport from '@/components/Unsupport.vue';

// Injects
const { status } = useStore();
</script>

<template>
  <div>
    <Transition>
      <Home v-if="status === 'home'" />
      <Unsupport v-else-if="status === 'unsupport'" />
      <SendFile v-else-if="status === 'send'" />
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
