<script setup lang="ts">
const { finalizePendingLocaleChange } = useI18n()

async function onBeforeEnter(): Promise<void> {
  await finalizePendingLocaleChange();
};
</script>

<template>
  <NuxtLayout>
    <ClientOnly>
      <notifications position="top center"/>
    </ClientOnly>
    <div
      class="bg-gray-50 fixed flex flex-col gap-12 inset-0 items-center justify-center">
      <AppHeader/>
      <NuxtPage
        :transition="{
          name: 'page',
          mode: 'out-in',
          onBeforeEnter
        }"/>
    </div>
    <AppFooter/>
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
