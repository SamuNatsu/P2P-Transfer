<script lang="ts" setup>
/* Server SEO */
useServerSeoMeta({
  title: 'P2P Transfer',
  description: 'A P2P Transfering Web App',
  ogTitle: 'P2P Transer',
  ogDescription: 'A P2P Transfering Web App',
  ogType: 'website',
  ogImage: '/favicon.svg'
});
useServerHeadSafe({
  link: [
    {
      rel: 'icon',
      type: 'image/svg+xml',
      href: '/favicon.svg'
    }
  ]
});

const lp = useLocalePath();
</script>

<template>
  <NuxtPage/>
  <footer class="absolute bottom-4 flex font-smiley gap-4 items-center justify-center w-full">
    <NuxtLinkLocale to="/">
      <span class="transition-colors hover:text-blue-500">Home</span>
    </NuxtLinkLocale>
    <NuxtLinkLocale to="/about">
      <span class="transition-colors hover:text-blue-500">About</span>
    </NuxtLinkLocale>
    <a class="transition-colors hover:text-blue-500" href="https://github.com/SamuNatsu/P2P-Transfer" target="_blank">Github</a>
  </footer>
</template>
