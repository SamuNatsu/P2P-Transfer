<script setup lang="ts">
import { useRouter } from 'vue-router';

/* Icons */
import MdiArrowBack from '~icons/mdi/arrow-back';

/* Components */
import AppButton from '@/components/AppButton.vue';

/* Services */
const router = useRouter();
</script>

<template>
  <div class="flex flex-col gap-4">
    <AppButton label="Back" variant="info" @click="router.push('/')">
      <template #icon>
        <MdiArrowBack class="text-2xl" />
      </template>
    </AppButton>
  </div>
</template>
