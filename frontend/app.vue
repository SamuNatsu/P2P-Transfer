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
</script>

<template>
  <NuxtPage />
</template>
