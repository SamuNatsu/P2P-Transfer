<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

/* Icons */
import MdiArrowBack from '~icons/mdi/arrow-back';
import MdiConnection from '~icons/mdi/connection';

/* Components */
import AppButton from '@/components/AppButton.vue';
import OneTimePassword from '@/components/OneTimePassword.vue';

/* Services */
const router = useRouter();

/* Reactive */
const code = ref('');
const canConnect = ref(false);
</script>

<template>
  <div class="flex flex-col gap-4 items-center">
    <section class="flex flex-col gap-4 items-center">
      <h1 class="font-bold text-2xl">Connection Code</h1>
      <OneTimePassword
        v-bind:code="code"
        v-model:completed="canConnect"
        :length="6"
      />
      <div class="flex gap-4 mt-8">
        <AppButton label="Back" variant="error" @click="router.push('/')">
          <template #icon>
            <MdiArrowBack class="text-2xl" />
          </template>
        </AppButton>
        <AppButton label="Connect" variant="success" :disabled="!canConnect">
          <template #icon>
            <MdiConnection class="text-2xl" />
          </template>
        </AppButton>
      </div>
    </section>
  </div>
</template>
