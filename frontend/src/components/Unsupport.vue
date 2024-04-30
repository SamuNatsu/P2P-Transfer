<script lang="ts" setup>
// Icons
import MdiWarningOutline from '~icons/mdi/warning-outline';
</script>

<template>
  <div class="flex flex-col items-center justify-center">
    <MdiWarningOutline class="text-6xl text-red-500" />
    <h1 class="break-all text-xl">{{ $t('fail.unsupport') }}</h1>
  </div>
</template>
