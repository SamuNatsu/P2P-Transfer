<script lang="ts" setup>
import QRCode from 'qrcode';
import { notify } from '@kyvg/vue3-notification';

/* Properties */
const props = defineProps<{
  text: string;
}>();

/* Inject */
const { t } = useI18n();

/* Reactives */
const showMenu: Ref<boolean> = ref(false);
const dataUrl: Ref<string> = ref('');

/* Watches */
watchEffect(async (): Promise<void> => {
  dataUrl.value = await QRCode.toDataURL(props.text);
});

/* Functions */
function copyLink(): void {
  window.navigator.clipboard
    .writeText(props.text)
    .then((): void => {
      notify({
        title: t('notification.copy.ok'),
        type: 'success'
      });
    })
    .catch((): void => {
      notify({
        title: t('notification.copy.fail'),
        type: 'error'
      });
      showMenu.value = true;
    });
}
</script>

<template>
  <Transition>
    <div
    v-if="showMenu"
    class="backdrop-brightness-[.2] fixed flex inset-0 items-center justify-center z-40">
      <div @click="showMenu = false" class="fixed inset-0"></div>
      <div
        class="bg-white flex flex-col font-bold font-sans gap-8 items-center p-4 rounded-lg z-50 dark:bg-neutral-900 dark:border-2 dark:border-white dark:text-white">
        <h1
          class="font-bold font-smiley text-2xl">
          {{ $t('ui.manual_copy') }}
        </h1>
        <p>{{ text }}</p>
      </div>
    </div>
  </Transition>
  <div class="flex flex-col gap-2 items-center">
    <img class="border-4 border-dashed h-[160px] w-[160px]" :src="dataUrl"/>
    <Button
      @click="copyLink"
      class="border-yellow-400 dark:hover:bg-yellow-400 hover:bg-yellow-400">
      {{ $t('button.click_to_copy') }}
    </Button>
  </div>
</template>
