<template>
  <div class="m-[-23px] flex flex-col lg:flex-row lg:gap-0 gap-6 overflow-hidden">
    <aside class="min-h-[100vh] bg-white dark:bg-gray-950  lg:w-64 shrink-0 lg:border-r border-slate-200 dark:border-gray-800">
      <div class="space-y-3 text-sm py-4 px-5">
        <div class="flex items-center gap-2">
          <span class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300">
            <i class="text-lg" :class="session?.icon || defaultSessionIcon"></i>
          </span>
          <div class="flex-1 flex items-center text-base font-semibold text-emerald-700 dark:text-emerald-300">
            <span class="truncate">{{ session?.title || t('sessionNav.sessionFallback') }}</span>
          </div>
        </div>

        <div class="space-y-2">
          <router-link
            :to="`/app/sessions/${sessionId}/scenes`"
            class="flex items-center justify-between pl-2 py-2 transition hover:border-emerald-400 hover:bg-emerald-50/60 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/20"
            :class="route.path.includes('/scenes') ? 'bg-emerald-50/60 dark:bg-emerald-900/20' : ''"
          >
            <span
              class="inline-flex items-center gap-2 font-semibold"
              :class="route.path.includes('/scenes') ? 'text-emerald-700 dark:text-emerald-100' : 'text-slate-700 dark:text-slate-200'"
            >
              <i class="fa-solid fa-clapperboard text-emerald-500"></i>
              <span>{{ t('sessionNav.scenes') }}</span>
            </span>
          </router-link>
          <router-link
            :to="`/app/sessions/${sessionId}/tension`"
            class="flex items-center justify-between pl-2 py-2 transition hover:border-emerald-400 hover:bg-emerald-50/60 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/20"
            :class="route.path.includes('/tension') ? 'bg-emerald-50/60 dark:bg-emerald-900/20' : ''"
          >
            <span
              class="inline-flex items-center gap-2 font-semibold"
              :class="route.path.includes('/tension') ? 'text-emerald-700 dark:text-emerald-100' : 'text-slate-700 dark:text-slate-200'"
            >
              <i class="fa-solid fa-bolt text-emerald-500"></i>
              <span>{{ t('sessionNav.tension') }}</span>
            </span>
          </router-link>
          <router-link
            :to="`/app/sessions/${sessionId}/players`"
            class="flex items-center justify-between pl-2 py-2 transition hover:border-emerald-400 hover:bg-emerald-50/60 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/20"
            :class="route.path.includes('/players') ? 'bg-emerald-50/60 dark:bg-emerald-900/20' : ''"
          >
            <span
              class="inline-flex items-center gap-2 font-semibold"
              :class="route.path.includes('/players') ? 'text-emerald-700 dark:text-emerald-100' : 'text-slate-700 dark:text-slate-200'"
            >
              <i class="fa-solid fa-people-group text-emerald-500"></i>
              <span>{{ t('sessionNav.players') }}</span>
            </span>
          </router-link>
          <router-link
            :to="`/app/sessions/${sessionId}/pnj`"
            class="flex items-center justify-between pl-2 py-2 transition hover:border-emerald-400 hover:bg-emerald-50/60 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/20"
            :class="route.path.includes('/pnj') ? 'bg-emerald-50/60 dark:bg-emerald-900/20' : ''"
          >
            <span
              class="inline-flex items-center gap-2 font-semibold"
              :class="route.path.includes('/pnj') ? 'text-emerald-700 dark:text-emerald-100' : 'text-slate-700 dark:text-slate-200'"
            >
              <i class="fa-solid fa-user-ninja text-emerald-500"></i>
              <span>{{ t('sessionNav.pnj') }}</span>
            </span>
          </router-link>
          <router-link
            :to="`/app/sessions/${sessionId}/settings`"
            class="flex items-center justify-between pl-2 py-2 transition hover:border-emerald-400 hover:bg-emerald-50/60 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/20"
            :class="route.path.includes('/settings') ? 'bg-emerald-50/60 dark:bg-emerald-900/20' : ''"
          >
            <span
              class="inline-flex items-center gap-2 font-semibold"
              :class="route.path.includes('/settings') ? 'text-emerald-700 dark:text-emerald-100' : 'text-slate-700 dark:text-slate-200'"
            >
              <i class="fa-solid fa-pen-to-square text-emerald-500"></i>
              <span>{{ t('sessionNav.settings') }}</span>
            </span>
          </router-link>
        </div>

        <div class="pt-2">
          <router-link
            :to="`/app/sessions/${sessionId}/gm`"
            class="w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg border border-indigo-300 text-indigo-700 dark:text-indigo-200 bg-white dark:bg-gray-900 text-sm font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition px-3"
          >
            <i class="fa-solid fa-hat-wizard"></i>
            <span>{{ t('sessionNav.gm') }}</span>
          </router-link>
        </div>
      </div>
    </aside>

    <section class="flex-1 px-6 py-4 ">
      <router-view />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '../lib/api';
import { useI18n } from 'vue-i18n';
import { DEFAULT_SESSION_ICON } from '../lib/iconPicker';

const { t } = useI18n();
const route = useRoute();
const sessionId = computed(() => route.params.id as string);
const defaultSessionIcon = DEFAULT_SESSION_ICON;
const session = ref<{ id: string; title: string; icon?: string | null } | null>(null);

const fetchSession = async () => {
  try {
    const res = await fetch(api(`/api/sessions/${encodeURIComponent(sessionId.value)}`), { credentials: 'include' });
    if (!res.ok) return;
    session.value = await res.json();
  } catch {
    session.value = null;
  }
};

onMounted(fetchSession);
watch(sessionId, () => {
  session.value = null;
  fetchSession();
});
</script>
