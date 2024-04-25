<script lang="ts" setup>
import { useI18n } from 'vue-i18n';

// Stores
import { useStore } from '@/stores';

// Components
import { Icon } from '@iconify/vue';

// Injects
const { t } = useI18n();
const { initState } = useStore();
</script>

<template>
  <div>
    <div
      v-if="initState === 'waiting'"
      class="fixed flex inset-0 items-center justify-center -z-50">
      <div
        class="animate-spin border-4 border-r-transparent h-12 rounded-full w-12"></div>
    </div>
    <div
      v-else-if="initState === 'unsupport'"
      class="fixed flex flex-col inset-0 items-center justify-center p-8 -z-50">
      <Icon class="text-6xl text-red-500" icon="mdi:warning-outline" />
      <h1 class="break-all text-xl">{{ t('fail.unsupport') }}</h1>
    </div>
    <div
      v-else-if="initState === 'fail'"
      class="fixed flex flex-col inset-0 items-center justify-center p-8 -z-50">
      <Icon class="text-6xl text-red-500" icon="mdi:warning-outline" />
      <h1 class="break-all text-xl">{{ t('fail.connect_to_server') }}</h1>
    </div>
    <div v-else></div>
  </div>
</template>
