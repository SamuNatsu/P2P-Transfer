<script lang="ts" setup>
import { RouterLink } from 'vue-router';

// Components
import { useI18n } from 'vue-i18n';

// Injects
const { t } = useI18n();
</script>

<template>
  <footer class="bottom-1 fixed flex gap-4 items-center">
    <RouterLink to="/">{{ t('footer.home') }}</RouterLink>
    <RouterLink to="/about">{{ t('footer.about') }}</RouterLink>
    <a
      href="https://github.com/SamuNatsu/P2P-Transfer"
      rel="noopener noreferer"
      target="_blank"
      >Github</a
    >
  </footer>
</template>
