<script setup lang="ts">
import { useReceiver } from '@/stores/receiver';
import { computed, onBeforeMount, onBeforeUnmount, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

/* Icons */
import MdiArrowBack from '~icons/mdi/arrow-back';
import MdiConnection from '~icons/mdi/connection';
import MdiContentSave from '~icons/mdi/content-save';
import MdiRocketLaunchOutline from '~icons/mdi/rocket-launch-outline';
import MdiStopRemoveOutline from '~icons/mdi/stop-remove-outline';

/* Components */
import AppButton from '@/components/AppButton.vue';
import OneTimePassword from '@/components/OneTimePassword.vue';
import ReceiverPanel from '@/components/ReceiverPanel.vue';

/* Services */
const route = useRoute();
const router = useRouter();

/* Stores */
const { state, code, saving, connect, start, reset, clearEffect, abort, save } =
  useReceiver();

/* Reactive */
const canConnect = ref(false);

/* Computed */
const hashCode = computed(() => {
  if (!route.hash.startsWith('#')) {
    return '';
  }
  const code = route.hash.slice(1).replace(/[^0-9a-zA-Z]/g, '');
  return code.length === 6 ? code : '';
});

/* Hooks */
onBeforeMount(() => reset());
onBeforeUnmount(() => clearEffect());
</script>

<template>
  <div class="flex flex-col gap-4 items-center">
    <!-- Code input -->
    <section
      v-if="state === 'code-inp'"
      class="flex flex-col gap-4 items-center"
    >
      <h1 class="font-bold text-2xl">Connection Code</h1>
      <OneTimePassword
        v-if="hashCode.length === 0"
        v-model:code="code"
        v-model:completed="canConnect"
        :length="6"
      />
      <OneTimePassword
        v-else
        v-model:code="code"
        v-model:completed="canConnect"
        :default-data="hashCode"
      />
      <div class="flex gap-4 mt-8">
        <AppButton label="Back" variant="error" @click="router.push('/')">
          <template #icon>
            <MdiArrowBack class="text-2xl" />
          </template>
        </AppButton>
        <AppButton
          label="Connect"
          variant="success"
          :disabled="!canConnect"
          @click="connect()"
        >
          <template #icon>
            <MdiConnection class="text-2xl" />
          </template>
        </AppButton>
      </div>
    </section>

    <!-- File receiving -->
    <section v-else class="flex flex-col gap-4 items-center">
      <ReceiverPanel />
      <div class="flex gap-4 mt-8">
        <AppButton
          v-if="['done', 'error'].includes(state)"
          label="Back"
          variant="error"
          @click="router.push('/')"
        >
          <template #icon>
            <MdiArrowBack class="text-2xl" />
          </template>
        </AppButton>
        <AppButton v-else label="Abort" variant="error" @click="abort">
          <template #icon>
            <MdiStopRemoveOutline class="text-2xl" />
          </template>
        </AppButton>

        <AppButton
          v-if="state === 'wait-start'"
          label="Start"
          variant="success"
          @click="start()"
        >
          <template #icon>
            <MdiRocketLaunchOutline class="text-2xl" />
          </template>
        </AppButton>

        <AppButton
          v-if="state === 'done'"
          variant="success"
          :label="saving ? 'Saving' : 'Save'"
          :disabled="saving"
          @click="save()"
        >
          <template #icon>
            <MdiContentSave class="text-2xl" />
          </template>
        </AppButton>
      </div>
    </section>
  </div>
</template>
