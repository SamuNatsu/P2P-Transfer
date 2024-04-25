/// Router module
import { Router, createRouter, createWebHashHistory } from 'vue-router';

// Views
import About from '@/views/About.vue';

// Export router
export const router: Router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: About
    }
  ]
});
