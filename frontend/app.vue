<script setup lang="ts">
const { finalizePendingLocaleChange } = useI18n()

async function onBeforeEnter(): Promise<void> {
  await finalizePendingLocaleChange();
};
</script>

<template>
  <NuxtLayout>
    <NuxtPage
      :transition="{
        name: 'page',
        mode: 'out-in',
        onBeforeEnter
      }"/>
  </NuxtLayout>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: all 0.4s;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>
