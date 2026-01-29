import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import './assets/main.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { i18n } from './i18n';

const routes = [
  { path: '/', component: () => import('./pages/LandingPage.vue') },
  { path: '/t/:tenantId/player_view', component: () => import('./pages/PlayerViewPage.vue') },
  {
    path: '/app',
    component: () => import('./pages/AppLayout.vue'),
    children: [
      { path: '', component: () => import('./pages/DashboardPage.vue') },
      { path: 'scenarios', component: () => import('./pages/ScenariosPage.vue') },
      {
        path: 'sessions/:id',
        component: () => import('./pages/SessionLayout.vue'),
        children: [
          { path: '', redirect: 'scenes' },
          { path: 'scenes', component: () => import('./pages/SessionScenesPage.vue') },
          { path: 'tension', component: () => import('./pages/SessionTensionPage.vue') },
          { path: 'players', component: () => import('./pages/SessionPlayersPage.vue') },
          { path: 'pnj', component: () => import('./pages/SessionPnjPage.vue') },
          { path: 'settings', component: () => import('./pages/SessionEditPage.vue') },
          { path: 'gm', component: () => import('./pages/GmModePage.vue') }
        ]
      },
      { path: 'users', component: () => import('./pages/UsersPage.vue') },
      { path: 'games', component: () => import('./pages/GamesPage.vue') },
      { path: 'gallery', component: () => import('./pages/GalleryPage.vue') },
      { path: 'audio', component: () => import('./pages/AudioPage.vue') },
      { path: 'notes', component: () => import('./pages/NotesPage.vue') }
    ]
  },
  { path: '/login', component: () => import('./pages/LoginPage.vue') },
  { path: '/settings', component: () => import('./pages/SettingsPage.vue') }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE_PATH || '/'),
  routes
});

createApp(App)
  .use(createPinia())
  .use(router)
  .use(i18n)
  .mount('#app');
