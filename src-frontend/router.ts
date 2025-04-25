import { createRouter, createWebHistory } from 'vue-router';

/* Views */
import Download from '@/views/Download.vue';
import Index from '@/views/Index.vue';
import Upload from '@/views/Upload.vue';

// Export router
export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: Index,
    },
    {
      path: '/upload',
      component: Upload,
    },
    {
      path: '/download',
      component: Download,
    },
  ],
});
