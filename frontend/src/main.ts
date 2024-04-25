/// Main entry
import { createApp } from 'vue';

// Plugins
import { i18n } from '@/i18n';

// Global stylesheets
import '@/css/fonts.css';
import '@/css/style.css';

// Root component
import App from '@/App.vue';

// Create application
createApp(App).use(i18n).mount('#app');
