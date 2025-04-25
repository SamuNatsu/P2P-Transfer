import { createApp } from 'vue';

// Plugins
import { router } from '@/router';

// Root stylesheets
import '@/index.css';

// Root component
import App from '@/App.vue';

// Create application
createApp(App).use(router).mount('#root');
