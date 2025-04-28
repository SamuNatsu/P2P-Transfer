<script setup lang="ts">
import { useReceiver } from '@/stores/receiver';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

/* Icons */
import MdiArrowBack from '~icons/mdi/arrow-back';
import MdiConnection from '~icons/mdi/connection';

/* Components */
import AppButton from '@/components/AppButton.vue';
import OneTimePassword from '@/components/OneTimePassword.vue';
import ReceiverPanel from '@/components/ReceiverPanel.vue';

/* Services */
const route = useRoute();
const router = useRouter();

/* Stores */
const { state, code, connect } = useReceiver();

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
</script>

<template>
  <div class="flex flex-col gap-4 items-center">
    <!-- Code input -->
    <section v-if="state === 'code-inp'" class="flex flex-col gap-4 items-center">
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
        <AppButton label="Back" variant="error" @click="router.push('/')">
          <template #icon>
            <MdiArrowBack class="text-2xl" />
          </template>
        </AppButton>
      </div>
    </section>
  </div>
</template>
