<script lang="ts" setup>
/* Inject */
const route = useRoute();
const { locale } = useI18n();
</script>

<template>
  <Html :lang="locale">
    <Head>
      <Title>{{ $t(route.meta.title as string) }}</Title>
      <Meta
        :content="$t(route.meta.description as string)"
        name="description"/>
      <Meta
        :content="$t(route.meta.title as string)"
        property="og:title"/>
      <Meta
        :content="$t(route.meta.description as string)"
        property="og:description"/>
      <Meta content="website" property="og:type"/>
      <Meta content="/favicon.svg" property="og:image"/>
      <Link href="/favicon.svg" rel="icon" type="image/svg+xml"/>
    </Head>
    <Body class="bg-gray-50">
      <ClientOnly>
        <notifications position="top center"/>
        <BlockLayer v-if="isInternalBrowser()"/>
      </ClientOnly>
      <slot></slot>
      <AppFooter/>
    </Body>
  </Html>
</template>
