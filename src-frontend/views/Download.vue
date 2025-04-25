<script setup lang="ts">
import { useRouter } from 'vue-router';

/* Icons */
import MdiArrowBack from '~icons/mdi/arrow-back';

/* Components */
import AppButton from '@/components/AppButton.vue';
import OneTimePassword from '@/components/OneTimePassword.vue';

/* Services */
const router = useRouter();
</script>

<template>
  <div class="flex flex-col gap-4 items-center">
    <section class="flex flex-col gap-4 items-center">
      <h1 class="font-bold text-2xl">Connection Code</h1>
      <OneTimePassword :length="8" />
    </section>
    <AppButton class="mt-12" label="Back" variant="info" @click="router.push('/')">
      <template #icon>
        <MdiArrowBack class="text-2xl" />
      </template>
    </AppButton>
  </div>
</template>
