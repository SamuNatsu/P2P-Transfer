<script lang="ts" setup>
import { notify } from '@kyvg/vue3-notification';

/* Inject */
const { isShow, logText } = useDebugInfo();

/* Functions */
function copyDebugLog(): void {
  window.navigator.clipboard
    .writeText(logText.value)
    .then((): void => {
      notify({
        title: 'OK',
        type: 'success'
      });
    })
    .catch((): void => {
      notify({
        title: 'FAIL',
        type: 'error'
      });
    });
}
</script>

<template>
  <div
    v-if="isShow"
    class="backdrop-brightness-[.2] fixed flex inset-0 items-center justify-center z-40">
    <div @click="isShow = false" class="fixed inset-0"></div>
    <div class="bg-white flex flex-col gap-4 h-5/6 p-4 rounded-lg w-2/3 z-50">
      <div class="flex items-baseline justify-between">
        <h1 class="font-bold text-xl">Debug Info</h1>
        <AppButton
          @click="copyDebugLog"
          class="border-yellow-400 text-sm hover:bg-yellow-400">
          Copy
        </AppButton>
      </div>
      <div class="bg-black overflow-y-scroll p-4 h-full text-white">
        <pre class="whitespace-pre-wrap">{{ logText }}</pre>
      </div>
    </div>
  </div>
</template>
