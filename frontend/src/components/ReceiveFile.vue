<script lang="ts" setup>
import { Ref, onBeforeMount, onBeforeUnmount, ref } from 'vue';

// Stores
import { useRecvFileStore } from '@/stores/recv-file';

// Components
import ReceiverController from '@/components/receiver/ReceiverController.vue';
import ReceiverInput from '@/components/receiver/ReceiverInput.vue';
import ReceiverPanel from '@/components/receiver/ReceiverPanel.vue';
import ReceiverSaver from '@/components/receiver/ReceiverSaver.vue';

// Injects
const { status, resetStore } = useRecvFileStore();

// Reactive
const comStatus: Ref<'waiting' | 'transfering' | 'saving'> = ref('waiting');

// Hooks
onBeforeMount((): void => {
  resetStore();
});
onBeforeUnmount((): void => {
  resetStore();
});
</script>

<template>
  <div class="flex flex-col items-center">
    <Transition>
      <ReceiverInput
        v-if="comStatus === 'waiting'"
        @start="comStatus = 'transfering'" />
      <div v-else>
        <ReceiverController
          @save="comStatus = 'saving'"
          :can-save="status === 'finished' && comStatus === 'transfering'" />
        <div class="flex flex-col items-center">
          <Transition>
            <ReceiverPanel v-if="comStatus === 'transfering'" />
            <ReceiverSaver v-else />
          </Transition>
        </div>
      </div>
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
