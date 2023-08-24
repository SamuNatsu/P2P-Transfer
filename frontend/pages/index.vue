<script lang="ts" setup>
/* Types */
enum Mode {
  Receive,
  Send
}

/* Inject */
const route = useRoute();
const { t, locale } = useI18n();

/* Seo */
useSeoMeta({
  title: t('seo.title'),
  description: t('seo.description'),
  ogTitle: t('seo.title'),
  ogDescription: t('seo.description'),
  ogType: 'website',
  ogImage: '/favicon.svg'
});
useHeadSafe({
  htmlAttrs: {
    lang: locale.value
  },
  link: [
    {
      rel: 'icon',
      type: 'image/svg+xml',
      href: '/favicon.svg'
    }
  ]
});

/* Reactive */
const mode: Ref<null | Mode> = ref(null);

/* Life cycle */
onMounted((): void => {
  const queryKeys: string[] = Object.keys(route.query);
  mode.value = queryKeys.length === 0 ? Mode.Send : Mode.Receive;
});
</script>

<template>
  <AppReceiver v-if="mode === Mode.Receive"/>
  <AppSender v-else-if="mode === Mode.Send"/>
</template>
