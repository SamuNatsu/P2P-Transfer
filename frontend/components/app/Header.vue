<script lang="ts" setup>
/* Inject */
const runtimeConfig = useRuntimeConfig();

/* Variables */
let lastClick: number = 0;
let clickCount: number = 0;

/* Functions */
function tryOpenDebug(): void {
  const { isShow } = useDebugInfo();
  const now: number = new Date().getTime();

  if (now > lastClick + 1000) {
    clickCount = 1;
  } else {
    clickCount++;
  }
  lastClick = now;

  if (clickCount >= 5) {
    isShow.value = true;
    clickCount = 0;
  }
}
</script>

<template>
  <header
    @click="tryOpenDebug"
    class="flex font-smiley gap-4 items-center justify-center select-none">
    <SvgoLogo class="h-16 w-16"/>
    <h1 class="font-bold relative">
      <span class="text-4xl">P2P Transfer</span>
      <span class="absolute -bottom-5 right-2">
        {{ runtimeConfig.public.version }}
      </span>
    </h1>
  </header>
</template>
