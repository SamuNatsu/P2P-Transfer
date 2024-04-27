<script lang="ts" setup>
// Icons
import MdiWarningOutline from '~icons/mdi/warning-outline';
</script>

<template>
  <div
    class="fixed flex flex-col inset-0 items-center justify-center p-8 -z-50">
    <MdiWarningOutline class="text-6xl text-red-500" />
    <h1 class="break-all text-xl">{{ $t('fail.unsupport') }}</h1>
  </div>
</template>
