import { createRouter, createWebHistory } from 'vue-router';

/* Views */
import Index from '@/views/Index.vue';
import Receive from '@/views/Receive.vue';
import Send from '@/views/Send.vue';

// Export router
export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: Index,
    },
    {
      path: '/send',
      component: Send,
    },
    {
      path: '/receive',
      component: Receive,
    },
  ],
});
