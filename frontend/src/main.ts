/// Main entrance
import { createApp } from 'vue';

/* Plugins */
import { i18n } from '@/i18n';
import notifications from '@kyvg/vue3-notification';

/* Global stylesheets */
import './style.css';

/* Root component */
import App from './App.vue';

/* Create application */
createApp(App).use(i18n).use(notifications).mount('#app');
