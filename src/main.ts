import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import './index.css';

const app = createApp(App);
app.use(router);

// La sesión se restaura dentro del primer guard del router (beforeEach),
// que espera `initAuth()` antes de resolver la ruta inicial.
const mountPoint = document.getElementById('root') || document.getElementById('app') || document.body;
app.mount(mountPoint);
