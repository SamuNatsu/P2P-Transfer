/// Vue3 notification for nuxt3 wrapper
import Notification from '@kyvg/vue3-notification';

export default defineNuxtPlugin((nuxtApp): void => {
  nuxtApp.vueApp.use(Notification);
});
