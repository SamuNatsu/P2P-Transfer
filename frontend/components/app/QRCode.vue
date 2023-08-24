<script lang="ts" setup>
import { notify } from '@kyvg/vue3-notification';

/* Properties */
const props = defineProps<{
  shareLink: string;
  dataUrl: string;
}>();

/* Inject */
const { t } = useI18n();

/* Functions */
function copyLink(): void {
  window.navigator.clipboard
    .writeText(props.shareLink)
    .then((): void => {
      notify({
        title: t('ui.copy_ok'),
        type: 'success'
      });
    })
    .catch((): void => {
      notify({
        title: t('ui.copy_fail'),
        type: 'error'
      });
    });
}
</script>

<template>
  <div class="flex flex-col gap-2 items-center">
    <img class="border-4 border-dashed h-[160px] w-[160px]" :src="dataUrl"/>
    <AppButton @click="copyLink" class="border-yellow-400 hover:bg-yellow-400">{{ $t('button.click_to_copy') }}</AppButton>
  </div>
</template>
