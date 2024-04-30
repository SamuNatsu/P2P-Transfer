<script lang="ts" setup>
// Components
import { RouterLink } from 'vue-router';
</script>

<template>
  <nav class="flex font-bold gap-4 items-center mt-4 text-lg">
    <RouterLink to="/">{{ $t('footer.home') }}</RouterLink>
    <RouterLink to="/about">{{ $t('footer.about') }}</RouterLink>
    <a
      href="https://github.com/SamuNatsu/P2P-Transfer"
      rel="noopener noreferer"
      target="_blank"
      >Github</a
    >
  </nav>
</template>
