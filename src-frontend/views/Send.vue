<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

/* Icons */
import MdiArrowBack from '~icons/mdi/arrow-back';
import MdiRocketLaunchOutline from '~icons/mdi/rocket-launch-outline';

/* Components */
import AppButton from '@/components/AppButton.vue';
import FileDropZone from '@/components/FileDropZone.vue';

/* Services */
const router = useRouter();

/* Reactive */
const file = ref<File | null>(null);
</script>

<template>
  <div class="flex flex-col gap-4 items-center">
    <section class="flex flex-col gap-4 items-center">
      <FileDropZone v-model:file="file" />
      <div class="flex gap-4 mt-8">
        <AppButton label="Back" variant="error" @click="router.push('/')">
          <template #icon>
            <MdiArrowBack class="text-2xl" />
          </template>
        </AppButton>
        <AppButton label="Start" variant="success" :disabled="file === null">
          <template #icon>
            <MdiRocketLaunchOutline class="text-2xl" />
          </template>
        </AppButton>
      </div>
    </section>
  </div>
</template>
