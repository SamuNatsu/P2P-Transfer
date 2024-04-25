<script lang="ts" setup>
import { RouterLink } from 'vue-router';

// Components
import { useI18n } from 'vue-i18n';

// Injects
const { t } = useI18n();
</script>

<template>
  <footer class="bottom-1 fixed flex gap-4 items-center">
    <RouterLink class="text-blue-300 hover:text-red-300" to="/">{{
      t('footer.home')
    }}</RouterLink>
    <RouterLink class="text-blue-300 hover:text-red-300" to="/about">{{
      t('footer.about')
    }}</RouterLink>
    <a
      class="text-blue-300 hover:text-red-300"
      href="https://github.com/SamuNatsu/P2P-Transfer"
      rel="noopener noreferer"
      target="_blank"
      >Github</a
    >
  </footer>
</template>
