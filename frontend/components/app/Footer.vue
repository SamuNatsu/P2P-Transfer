<script lang="ts" setup>
/* Inject */
const localePath = useLocalePath();
</script>

<template>
  <footer
    class="bottom-2 fixed flex font-smiley gap-4 items-center justify-center w-full">
    <NuxtLink
      class="transition-colors hover:text-blue-500"
      :to="localePath('/')">
        {{ $t('ui.home') }}
    </NuxtLink>
    <NuxtLink
      class="transition-colors hover:text-blue-500"
      target="_blank"
      :to="localePath('/about')">
      {{ $t('ui.about') }}
    </NuxtLink>
    <NuxtLink
      class="transition-colors hover:text-blue-500"
      target="_blank"
      to="https://github.com/SamuNatsu/P2P-Transfer">
      Github
    </NuxtLink>
    <LangSwitch/>
  </footer>
</template>
