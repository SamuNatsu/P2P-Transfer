<script lang="ts" setup>
/* Inject */
const { t } = useI18n({ useScope: 'local' });
</script>

<template>
  <p class="font-smiley text-xl">
    <b>{{ t('inspired_by') }}</b>
    <a class="text-blue-500 transition-colors hover:text-red-500" href="https://transfer.zip/" target="_blank">https://transfer.zip/</a>
  </p>
  <p class="font-smiley text-xl">
    <b>{{ t('made_with_love_by') }}</b>
    <a class="text-blue-500 transition-colors hover:text-red-500" href="https://github.com/SamuNatsu" target="_blank">SNRainiar</a>
  </p>
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
