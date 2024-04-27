<script lang="ts" setup>
// Icons
import MdiLanDisconnect from '~icons/mdi/lan-disconnect';
</script>

<template>
  <div
    class="fixed flex flex-col inset-0 items-center justify-center p-8 -z-50">
    <MdiLanDisconnect class="text-6xl text-red-500" />
    <h1 class="break-all text-xl">{{ $t('fail.disconnect') }}</h1>
  </div>
</template>
