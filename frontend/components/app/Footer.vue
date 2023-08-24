<template>
  <footer
    class="absolute bottom-2 flex font-smiley gap-4 items-center justify-center w-full">
    <NuxtLinkLocale to="/">
      <span class="transition-colors hover:text-blue-500">
        {{ $t('ui.home') }}
      </span>
    </NuxtLinkLocale>
    <NuxtLinkLocale to="/about">
      <span class="transition-colors hover:text-blue-500">
        {{ $t('ui.about') }}
      </span>
    </NuxtLinkLocale>
    <a
      class="transition-colors hover:text-blue-500"
      href="https://github.com/SamuNatsu/P2P-Transfer" 
      target="_blank">
      Github
    </a>
  </footer>
</template>
