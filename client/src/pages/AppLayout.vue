<template>
  <div class="min-h-screen h-screen overflow-hidden flex bg-slate-50 text-slate-900 dark:bg-gray-800 dark:text-slate-100">
    <div class="flex h-full w-full bg-slate-50 dark:bg-gray-800">
      <aside
        class="bg-white dark:bg-gray-950 border-r border-slate-200 dark:border-gray-800 flex flex-col sticky top-0 h-screen transition-all duration-200"
        :class="sidebarCollapsed ? 'w-[54px]' : 'w-56'"
      >
        <div class="px-3 py-4 flex items-center justify-between">
          <router-link
            to="/"
            class="text-3xl font-semibold text-emerald-500 font-pangolin text-center hover:opacity-80 transition"
            v-show="!sidebarCollapsed"
          >
            .ScenarWall.
          </router-link>
          <button
            class="text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition rounded-lg flex items-center justify-center h-9 w-9"
            @click="toggleSidebar"
          >
            <i class="text-base" :class="sidebarCollapsed ? 'fa-solid fa-angles-right' : 'fa-solid fa-angles-left'"></i>
          </button>
        </div>

        <nav class="flex-1" :class="sidebarCollapsed ? 'px-0' : 'px-3'">
          <router-link
            to="/app/scenarios"
            class="w-full flex items-center rounded-lg text-sm font-medium text-left transition"
            :class="[
              sidebarCollapsed ? 'justify-center gap-0 px-0 py-2' : 'justify-start gap-2 px-2 pl-3 py-1',
              route.path.startsWith('/app/scenarios')
                ? 'bg-slate-800 text-emerald-300'
                : 'text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-200'
            ]"
          >
            <i class="fa-solid fa-book-open text-base text-emerald-500"></i>
            <span v-show="!sidebarCollapsed">{{ t('layout.scenarios') }}</span>
          </router-link>
          <div v-show="!sidebarCollapsed" class="mt-2 space-y-2 pl-3">
            <div v-for="scenario in scenarioNav" :key="scenario.id" class="space-y-1">
              <div class="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                <i
                  v-if="scenario.icon"
                  :class="['text-slate-400', scenario.icon]"
                ></i>
                <i v-else class="fa-regular fa-folder-open text-slate-400"></i>
                <span class="truncate">{{ scenario.title || t('layout.scenarioFallback') }}</span>
              </div>
              <div class="ml-5 space-y-1">
                <router-link
                  v-for="session in scenario.sessions"
                  :key="session.id"
                  :to="`/app/sessions/${encodeURIComponent(session.id)}/scenes`"
                  class="flex items-center gap-2 text-xs transition"
                  :class="session.id === activeSessionId
                    ? 'text-emerald-600 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-300'"
                >
                  <i class="fa-regular fa-circle text-[8px] text-slate-400"></i>
                  <span class="truncate">{{ session.title || t('layout.sessionFallback') }}</span>
                </router-link>
              </div>
            </div>
          </div>
          <div class="mt-3">
            <div
              class="px-3 text-[11px] mb-1 uppercase tracking-[0.08em] text-slate-500 dark:text-slate-200"
              v-show="!sidebarCollapsed"
            >
              {{ t('layout.library') || 'Bibliothèque' }}
            </div>
            <div :class="sidebarCollapsed ? '' : 'ml-4'">
              <router-link
                to="/app/gallery"
                class="w-full flex items-center rounded-lg text-xs font-medium text-left transition mb-1"
                :class="[
                  sidebarCollapsed ? 'justify-center gap-0 px-0 py-2' : 'justify-start gap-2 px-3 py-1',
                  route.path.startsWith('/app/gallery')
                    ? 'bg-slate-800 text-yellow-300'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:text-yellow-700 dark:hover:text-yellow-200'
                ]"
              >
                <i class="fa-regular fa-image text-base text-yellow-500"></i>
                <span v-show="!sidebarCollapsed">{{ t('layout.gallery') }}</span>
              </router-link>
              <router-link
                to="/app/audio"
                class="w-full flex items-center rounded-lg text-xs font-medium text-left transition mb-1"
                :class="[
                  sidebarCollapsed ? 'justify-center gap-0 px-0 py-2' : 'justify-start gap-2 px-3 py-1',
                  route.path.startsWith('/app/audio')
                    ? 'bg-slate-800 text-lime-300'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-lime-50 dark:hover:bg-lime-900/20 hover:text-lime-700 dark:hover:text-lime-200'
                ]"
              >
                <i class="fa-solid fa-music text-base text-lime-500"></i>
                <span v-show="!sidebarCollapsed">Audio</span>
              </router-link>
              <router-link
                to="/app/notes"
                class="w-full flex items-center rounded-lg text-xs font-medium text-left transition mb-1"
                :class="[
                  sidebarCollapsed ? 'justify-center gap-0 px-0 py-2' : 'justify-start gap-2 px-3 py-1',
                  route.path.startsWith('/app/notes')
                    ? 'bg-slate-800 text-sky-400'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-sky-900/20 hover:text-sky-700 dark:hover:text-sky-200'
                ]"
              >
                <i class="fa-solid fa-note-sticky text-base text-sky-500"></i>
                <span v-show="!sidebarCollapsed">Notes</span>
              </router-link>
            </div>
          </div>
          <div class="mt-3" v-if="isAdmin">
            <div
              class="px-3 text-[11px] mb-1 uppercase tracking-[0.08em] text-slate-500 dark:text-slate-200"
              v-show="!sidebarCollapsed"
            >
              {{ t('layout.admin') || 'Administration' }}
            </div>
            <div :class="sidebarCollapsed ? '' : 'ml-4'">
              <router-link
                to="/app/games"
                class="w-full flex items-center rounded-lg text-xs font-medium text-left transition mb-1"
                :class="[
                  sidebarCollapsed ? 'justify-center gap-0 px-0 py-2' : 'justify-start gap-2 px-3 py-1',
                  route.path.startsWith('/app/games')
                    ? 'bg-slate-800 text-amber-300'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-700 dark:hover:text-amber-200'
                ]"
              >
                <i class="fa-solid fa-dice text-base text-amber-500"></i>
                <span v-show="!sidebarCollapsed">{{ t('games.title') }}</span>
              </router-link>
              <router-link
                to="/app/users"
                class="w-full flex items-center rounded-lg text-xs font-medium text-left transition mb-1"
                :class="[
                  sidebarCollapsed ? 'justify-center gap-0 px-0 py-2' : 'justify-start gap-2 px-3 py-1',
                  route.path.startsWith('/app/users')
                    ? 'bg-slate-800 text-cyan-300'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 hover:text-cyan-700 dark:hover:text-cyan-200'
                ]"
              >
                <i class="fa-solid fa-user-gear text-base text-cyan-500"></i>
                <span v-show="!sidebarCollapsed">{{ t('users.title') }}</span>
              </router-link>
            </div>
          </div>
        </nav>

        <div class="px-3 pt-3 mb-4" v-show="!sidebarCollapsed">
          <div class="p-2 text-center shadow-sm text-sm">
            <p class="text-slate-700 dark:text-slate-300 mb-3">{{ t('donation.cta') }}</p>
            <a
              class="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 text-slate-900 font-semibold px-3 py-2 text-sm hover:bg-emerald-400 transition"
              href="https://www.buymeacoffee.com/baz1ga"
              target="_blank"
              rel="noopener"
            >
              <i class="fa-solid fa-heart"></i> <span>{{ t('donation.button') }}</span>
            </a>
          </div>
        </div>
        <div class="px-3 pb-2 mb-4" v-show="!sidebarCollapsed">
          <a
            class="inline-flex w-full items-center gap-2 rounded-lg text-center border border-slate-200 dark:border-gray-800 text-slate-700 dark:text-slate-200 font-semibold px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            href="https://tally.so/r/NpqM6N"
            target="_blank"
            rel="noopener"
          >
            <span>{{ t('feedback.cta') }}</span>
          </a>
        </div>

        <div class="flex items-center" :class="sidebarCollapsed ? 'px-1 pb-4 justify-end gap-0' : 'px-3 pb-4 justify-between gap-2'">
          <div class="relative" v-show="!sidebarCollapsed">
            <button
              class="h-10 w-10 rounded-full bg-emerald-500 text-slate-900 font-semibold flex items-center justify-center hover:bg-emerald-400 overflow-hidden border border-slate-300 dark:border-gray-700"
              @click="userMenuOpen = !userMenuOpen"
            >
              <img v-if="user?.avatarUrl" :src="user.avatarUrl" alt="Avatar" class="h-full w-full object-cover" />
              <span v-else class="text-sm font-semibold">{{ userInitial }}</span>
            </button>
            <div
              class="absolute left-[-5px] bottom-12 w-[13rem] bg-white text-slate-800 dark:bg-gray-800 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-gray-700 shadow-lg z-[9999]"
              v-show="userMenuOpen"
            >
              <div class="px-4 py-2 text-xs text-slate-500 dark:text-slate-200 border-b border-slate-200 dark:border-gray-700">
                <span>{{ t('userMenu.loggedAs') }}</span>
                <span class="font-semibold text-slate-800 dark:text-slate-100">{{ user?.displayName || '—' }}</span>
              </div>
              <div v-if="quotaMB" class="px-4 py-3 border-b border-slate-200 dark:border-gray-700 space-y-2">
                <div class="text-[11px] text-slate-500 dark:text-slate-200">
                  {{ t('userMenu.quota') }} {{ quotaDisplay }}
                </div>
                <div class="h-2 w-full rounded-full bg-slate-200 dark:bg-gray-700 overflow-hidden">
                  <div class="h-full bg-emerald-500 transition-all" :style="`width:${quotaPercent}%`"></div>
                </div>
              </div>
              <button
                class="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 inline-flex items-center gap-2"
                @click="toggleTheme"
              >
                <i :class="theme === 'dark' ? 'fa-regular fa-sun' : 'fa-solid fa-moon'"></i>
                <span>{{ theme === 'dark' ? t('landing.themeLight') : t('landing.themeDark') }}</span>
              </button>
              <div class="px-4 py-2 text-xs text-slate-500 dark:text-slate-200 border-t border-slate-200 dark:border-gray-700">
                <div class="inline-flex items-center gap-2">
                  <button
                    class="px-2 py-1 rounded border text-xs inline-flex items-center gap-2"
                    :class="locale === 'fr' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-200' : 'border-slate-300 dark:border-gray-700 text-slate-600 dark:text-slate-200'"
                    @click="switchLocale('fr')"
                  >
                    <span aria-hidden="true" class="text-lg leading-none">🇫🇷</span>
                  </button>
                  <button
                    class="px-2 py-1 rounded border text-xs inline-flex items-center gap-2"
                    :class="locale === 'en' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-200' : 'border-slate-300 dark:border-gray-700 text-slate-600 dark:text-slate-200'"
                    @click="switchLocale('en')"
                  >
                    <span aria-hidden="true" class="text-lg leading-none">🇬🇧</span>
                  </button>
                </div>
              </div>
              <a
                class="block px-4 py-2 text-sm text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
                href="https://phserres.notion.site/Roadmap-ScenarWall-2bb25b4f22b780639a41dc03438e4f0c?pvs=73"
                target="_blank"
                rel="noopener"
              >
                <span class="inline-flex items-center gap-2">
                  <i class="fa-solid fa-road"></i>
                  <span>{{ t('userMenu.roadmap') }}</span>
                </span>
              </a>
              <button
                class="w-full text-left px-4 py-2 text-sm text-rose-600 dark:text-rose-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-b-xl inline-flex items-center gap-2"
                @click="logout"
              >
                <i class="fa-solid fa-arrow-right-from-bracket"></i>
                <span>{{ t('userMenu.logout') }}</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div class="flex-1 flex flex-col">
        <main class="flex-1 p-6 overflow-y-auto">
          <div v-if="loading" class="flex items-center gap-3 text-slate-500 dark:text-slate-300">
            <div class="animate-spin h-5 w-5 rounded-full border-4 border-emerald-500 border-t-transparent"></div>
            {{ t('layout.loadingWorkspace') }}
          </div>
          <div v-else class="space-y-6">
            <router-view />
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { setLocale } from '../i18n';

const router = useRouter();
const route = useRoute();
const loading = ref(true);
const user = ref<{ displayName?: string | null; avatarUrl?: string | null; role?: string | null; tenant?: { id: string; name: string; quotaMB?: number | null } | null } | null>(null);
const { t, locale } = useI18n();
const sidebarCollapsed = ref(false);
const userMenuOpen = ref(false);
const theme = ref<'light' | 'dark'>('light');
const scenarioNav = ref<Array<{ id: string; title: string; icon?: string | null; sessions: Array<{ id: string; title: string }> }>>([]);
const activeSessionId = computed(() => (route.params.id as string | undefined) || '');
const usageBytes = ref(0);
const quotaMB = ref<number | null>(null);

const quotaPercent = computed(() => {
  if (!quotaMB.value) return 0;
  const total = quotaMB.value * 1024 * 1024;
  if (!total) return 0;
  return Math.min(100, Math.round((usageBytes.value / total) * 100));
});

const quotaDisplay = computed(() => {
  if (!quotaMB.value) return '—';
  const used = Math.round((usageBytes.value / (1024 * 1024)) * 10) / 10;
  const total = Math.round(quotaMB.value * 10) / 10;
  return `${used} / ${total} MB`;
});

const switchLocale = (next: 'fr' | 'en') => {
  setLocale(next);
};

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
};

const applyTheme = (mode: 'light' | 'dark') => {
  document.documentElement.classList.toggle('dark', mode === 'dark');
  localStorage.setItem('sw_theme', mode);
  theme.value = mode;
};

const toggleTheme = () => {
  applyTheme(theme.value === 'dark' ? 'light' : 'dark');
};

const userInitial = computed(() => {
  const name = user.value?.displayName || '';
  return name ? name.trim().charAt(0).toUpperCase() : 'MJ';
});

const isAdmin = computed(() => (user.value?.role || '').toUpperCase() === 'ADMIN');

const fetchScenarioNav = async () => {
  try {
    const res = await fetch('http://localhost:3100/api/scenarios', { credentials: 'include' });
    if (!res.ok) throw new Error('load');
    const data = await res.json();
    scenarioNav.value = Array.isArray(data)
      ? data.map((item: { id: string; title: string; icon?: string | null; sessions?: Array<{ id: string; title: string }> }) => ({
          id: item.id,
          title: item.title,
          icon: item.icon || null,
          sessions: Array.isArray(item.sessions) ? item.sessions : []
        }))
      : [];
  } catch {
    scenarioNav.value = [];
  }
};

const fetchUsage = async () => {
  try {
    const res = await fetch('http://localhost:3100/api/tenant/usage', { credentials: 'include' });
    if (!res.ok) throw new Error('usage');
    const data = await res.json();
    usageBytes.value = Number(data?.usageBytes || 0);
    quotaMB.value = typeof data?.quotaMB === 'number' ? data.quotaMB : null;
  } catch {
    usageBytes.value = 0;
  }
};

const logout = async () => {
  try {
    await fetch('http://localhost:3100/auth/logout', { method: 'POST', credentials: 'include' });
  } finally {
    await router.replace('/');
  }
};

onMounted(async () => {
  const savedTheme = localStorage.getItem('sw_theme');
  applyTheme(savedTheme === 'dark' ? 'dark' : 'light');
  try {
    const res = await fetch('http://localhost:3100/auth/me', { credentials: 'include' });
    if (!res.ok) {
      await router.replace('/');
      return;
    }
    const data = await res.json();
    user.value = data;
    quotaMB.value = typeof data?.tenant?.quotaMB === 'number' ? data.tenant.quotaMB : null;
    await fetchScenarioNav();
    await fetchUsage();
  } catch (_) {
    await router.replace('/');
    return;
  } finally {
    loading.value = false;
  }
});
</script>
