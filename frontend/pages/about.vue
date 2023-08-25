<script lang="ts" setup>
/* Inject */
const { t } = useI18n({ useScope: 'local' });

/* Page meta */
definePageMeta({
  title: 'seo.about_title',
  description: 'seo.description'
});
</script>

<template>
  <main class="flex flex-col items-center gap-4">
    <p class="font-smiley text-xl">
      <b>{{ t('inspired_by') }}</b>
      <NuxtLink
        class="text-blue-500 transition-colors hover:text-red-500"
        target="_blank"
        to="https://transfer.zip/">
        transfer.zip
      </NuxtLink>
    </p>
    <p class="font-smiley text-xl">
    <b>{{ t('made_with_love_by') }}</b>
      <NuxtLink
        class="text-blue-500 transition-colors hover:text-red-500"
        target="_blank"
        to="https://github.com/SamuNatsu/">
        SNRainiar
      </NuxtLink>
    </p>
  </main>
</template>

<i18n lang="json">
{
  "en": {
    "inspired_by": "Inspired by ",
    "made_with_love_by": "Made with love by "
  },
  "zh": {
    "inspired_by": "灵感源自 ",
    "made_with_love_by": "匠心制作 "
  }
}
</i18n>
