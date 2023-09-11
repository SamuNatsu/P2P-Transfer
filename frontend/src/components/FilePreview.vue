<script lang="ts" setup>
/* Properties */
const props = defineProps<{
  file?: File;
}>();

/* Reactives */
const showMenu: Ref<boolean> = ref(false);
const textPreview: Ref<string> = ref('');

/* Computed */
const objectUrl = computed((): string | undefined => {
  if (props.file === undefined) {
    return undefined;
  }

  if (
    props.file.type.startsWith('image/') ||
    props.file.type.startsWith('video/') ||
    props.file.type.startsWith('audio/')
  ) {
    return URL.createObjectURL(props.file);
  }

  if (props.file.type.startsWith('text/')) {
    const reader: FileReader = new FileReader();

    reader.onload = (): void => {
      textPreview.value = reader.result as string;

      if ((props.file as File).size > 1024) {
        textPreview.value += ' ...';
      }
    };
    reader.readAsText(props.file.slice(0, 1024));

    return '';
  }

  return undefined;
});
</script>

<template>
  <Transition>
    <div
    v-if="showMenu"
    class="backdrop-brightness-[.2] fixed flex inset-0 items-center justify-center z-30">
      <div @click="showMenu = false" class="fixed inset-0"></div>
      <img
        v-if="file?.type.startsWith('image/')"
        class="border-2 border-white max-h-[90%] max-w-[90%] z-40"
        :src="objectUrl"/>
      <video
        v-else-if="file?.type.startsWith('video/')"
        class="border-2 border-white max-h-[90%] max-w-[90%] z-40"
        controls>
        <source :src="objectUrl" :type="file?.type"/>
      </video>
      <audio
        v-else-if="file?.type.startsWith('audio/')"
        class="z-40"
        controls
        :src="objectUrl">
      </audio>
      <div
        v-else
        class="bg-white border-2 border-white max-h-[90%] max-w-[90%] overflow-auto p-4 z-40 dark:bg-neutral-900">
        <pre>{{ textPreview }}</pre>
      </div>
    </div>
  </Transition>
  <Button
    v-if="objectUrl !== undefined"
    @click="showMenu = true"
    class="border-cyan-500 dark:hover:bg-cyan-500 hover:bg-cyan-500">
    {{ $t('button.file_preview') }}
  </Button>
</template>

<style scoped>
img {
  background-color: #ffffff;
  background-image: repeating-linear-gradient(45deg, #dddddd 25%, transparent 25%, transparent 75%, #dddddd 75%, #dddddd), repeating-linear-gradient(45deg, #dddddd 25%, #ffffff 25%, #ffffff 75%, #dddddd 75%, #dddddd);
  background-position: 0 0, 10px 10px;
  background-size: 20px 20px;
}

.v-enter-active,
.v-leave-active {
  transition: opacity 0.2s;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
