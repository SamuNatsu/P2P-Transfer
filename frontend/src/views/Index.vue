<script lang="ts" setup>
import { useI18n } from 'vue-i18n';

// Components
import { Icon } from '@iconify/vue';

// Injects
const { t } = useI18n();
</script>

<template>
  <div>
    <div
      v-if="false"
      class="fixed flex inset-0 items-center justify-center -z-50">
      <div
        class="animate-spin border-4 border-r-transparent h-12 rounded-full w-12"></div>
    </div>
    <div
      class="fixed flex flex-col inset-0 items-center justify-center p-8 -z-50">
      <Icon class="text-6xl text-red-500" icon="mdi:warning-outline" />
      <h1 class="break-all text-xl">{{ t('fail.connect_to_server') }}</h1>
    </div>
  </div>
</template>
