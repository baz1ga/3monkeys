<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <div v-if="loading" class="justify-center max-w-4xl mx-auto rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-sm flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
      <div class="h-5 w-5 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
      <span>{{ t('games.buttons.refreshing', 'Rafraîchissement...') }}</span>
    </div>

    <div v-else-if="error" class="max-w-4xl mx-auto rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-900/20 dark:text-rose-100 px-4 py-3 text-sm">
      {{ error }}
    </div>

    <section v-else class="space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-3">
          <span class="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/30">
            <i class="fa-solid fa-dice text-lg"></i>
          </span>
          <div>
            <h1 class="text-2xl font-semibold games-text">{{ t('games.title', 'Parties jouées') }}</h1>
            <p class="text-sm text-slate-500 dark:text-slate-200">{{ t('games.subtitle', 'Suivez et filtrez vos runs par tenant et session.') }}</p>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button
            class="inline-flex items-center gap-2 h-10 rounded-lg border border-amber-400 text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-900 px-3 text-sm hover:bg-amber-50 dark:hover:bg-amber-900/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="loading"
            @click="fetchStates"
            :title="loading ? t('games.buttons.refreshing', 'Rafraîchissement...') : t('games.buttons.refresh', 'Refresh runs')"
            :aria-label="loading ? t('games.buttons.refreshing', 'Refreshing...') : t('games.buttons.refresh', 'Refresh runs')"
          >
            <i class="fa-solid fa-rotate" :class="loading ? 'animate-spin' : ''"></i>
            <span>{{ loading ? t('games.buttons.refreshing', 'Rafraîchissement...') : t('games.buttons.refresh', 'Refresh runs') }}</span>
          </button>
          <label class="inline-flex items-center gap-2 h-10 text-sm text-slate-700 dark:text-slate-200 border border-amber-400 dark:border-amber-500 rounded-lg px-3 bg-white dark:bg-gray-900 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition">
            <input type="checkbox" class="rounded text-amber-500 border-slate-300 dark:border-gray-600" v-model="hideShortRuns">
            <span>{{ t('games.hideShort', 'Masquer < 5m') }}</span>
          </label>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-center gap-3">
        <input
          type="text"
          v-model="searchTerm"
          :placeholder="t('games.searchPlaceholder', 'Rechercher un tenant...')"
          :aria-label="t('games.aria.search', 'Search a tenant')"
          class="rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--games-accent)] focus:border-[var(--games-accent)] w-full sm:w-80 text-center"
        >
      </div>

      <div class="rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm overflow-hidden max-w-4xl mx-auto">
        <div class="relative">
          <div v-if="loading" class="absolute inset-0 bg-white/70 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center z-10">
            <div class="inline-flex items-center gap-2 text-amber-600">
              <span class="h-6 w-6 rounded-full border-2 border-amber-500 border-t-transparent animate-spin"></span>
              <span>{{ t('games.buttons.refreshing', 'Rafraîchissement...') }}</span>
            </div>
          </div>
          <table class="min-w-full text-sm">
            <thead class="bg-slate-100 dark:bg-gray-700 text-slate-800 dark:text-slate-50">
              <tr>
                <th class="px-4 py-2 text-left cursor-pointer" @click="setGamesSort('tenant')">
                  <div class="inline-flex items-center gap-2">
                    <span>{{ t('games.columns.tenant', 'Tenant') }}</span>
                    <i :class="sortIcon('tenant')" class="text-xs games-text"></i>
                  </div>
                </th>
                <th class="px-4 py-2 text-left cursor-pointer" @click="setGamesSort('session')">
                  <div class="inline-flex items-center gap-2">
                    <span>{{ t('games.columns.session', 'Session') }}</span>
                    <i :class="sortIcon('session')" class="text-xs games-text"></i>
                  </div>
                </th>
                <th class="px-4 py-2 text-left cursor-pointer" @click="setGamesSort('date')">
                  <div class="inline-flex items-center gap-2">
                    <span>{{ t('games.columns.date', 'Date') }}</span>
                    <i :class="sortIcon('date')" class="text-xs games-text"></i>
                  </div>
                </th>
                <th class="px-4 py-2 text-left cursor-pointer" @click="setGamesSort('duration')">
                  <div class="inline-flex items-center gap-2">
                    <span>{{ t('games.columns.duration', 'Durée') }}</span>
                    <i :class="sortIcon('duration')" class="text-xs games-text"></i>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="flatRuns.length === 0">
                <td colspan="4" class="px-4 py-3 text-center text-slate-500 dark:text-slate-200">
                  {{ t('games.noRuns', 'Aucune partie jouée') }}
                </td>
              </tr>
              <tr v-for="run in flatRuns" :key="`${run.tenantId}-${run.sessionId}-${run.updatedAt || run.createdAt}`" class="border-t border-slate-200 dark:border-gray-800">
                <td class="px-4 py-2">
                  <div class="inline-flex items-center gap-2">
                    <span class="font-mono text-xs">{{ run.tenantId }}</span>
                  </div>
                </td>
                <td class="px-4 py-2 font-mono text-xs">{{ run.sessionId }}</td>
                <td class="px-4 py-2">{{ formatDate(run.updatedAt || run.createdAt) }}</td>
                <td class="px-4 py-2 font-semibold">{{ formatDuration(run) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { api } from '../lib/api';

type RunState = {
  tenantId: string;
  sessionId: string;
  front?: string;
  gm?: string;
  lastFrontPing?: number | null;
  lastGmPing?: number | null;
  createdAt?: number | null;
  updatedAt?: number | null;
};

type SessionRuns = {
  sessionId: string;
  runs: RunState[];
};

type TenantRuns = {
  tenantId: string;
  sessions: SessionRuns[];
};

const { t } = useI18n();

const loading = ref(false);
const error = ref('');
const states = ref<TenantRuns[]>([]);
const searchTerm = ref('');
const hideShortRuns = ref(true);
const gamesSort = ref<{ key: 'tenant' | 'session' | 'date' | 'duration'; dir: 'asc' | 'desc' }>({
  key: 'duration',
  dir: 'desc'
});

const fetchStates = async () => {
  loading.value = true;
  error.value = '';
  try {
    const res = await fetch(api('/api/admin/run-states'), { credentials: 'include' });
    if (!res.ok) throw new Error('states');
    const data = await res.json();
    states.value = normalizeGroups(data);
  } catch {
    error.value = t('common.error', 'Erreur');
    states.value = [];
  } finally {
    loading.value = false;
  }
};

const normalizeGroups = (data: any): TenantRuns[] => {
  if (!Array.isArray(data)) return [];
  if (data.length && Array.isArray(data[0]?.sessions)) return data;
  const tmap = new Map<string, TenantRuns>();
  data.forEach((item: any) => {
    if (!item?.tenantId || !item?.sessionId) return;
    if (!tmap.has(item.tenantId)) tmap.set(item.tenantId, { tenantId: item.tenantId, sessions: [] });
    const tenant = tmap.get(item.tenantId)!;
    let session = tenant.sessions.find(s => s.sessionId === item.sessionId);
    if (!session) {
      session = { sessionId: item.sessionId, runs: [] };
      tenant.sessions.push(session);
    }
    if (Array.isArray(item.runs)) {
      session.runs.push(...item.runs);
    } else {
      const { tenantId, sessionId, ...rest } = item;
      session.runs.push(rest);
    }
  });
  return Array.from(tmap.values());
};

const durationMs = (state: RunState) => {
  const started = Number(state.createdAt || 0);
  const updated = Number(state.updatedAt || 0);
  if (!started || !updated || updated < started) return 0;
  return updated - started;
};

const filterRuns = (runs: RunState[]) => {
  if (!hideShortRuns.value) return runs;
  return runs.filter(r => durationMs(r) >= 300000);
};

const flatRuns = computed(() => {
  const flat: RunState[] = [];
  states.value.forEach(t => {
    t.sessions.forEach(s => {
      filterRuns(s.runs || []).forEach(r => {
        flat.push({ tenantId: t.tenantId, sessionId: s.sessionId, ...r });
      });
    });
  });

  const query = searchTerm.value.trim().toLowerCase();
  const filtered = query ? flat.filter(r => (r.tenantId || '').toLowerCase().includes(query)) : flat;

  const key = gamesSort.value.key;
  const dir = gamesSort.value.dir === 'asc' ? 1 : -1;
  const getVal = (r: RunState) => {
    if (key === 'tenant') return r.tenantId || '';
    if (key === 'session') return r.sessionId || '';
    if (key === 'date') return Number(r.updatedAt || r.createdAt || 0);
    if (key === 'duration') return durationMs(r);
    return '';
  };
  return filtered.sort((a, b) => {
    const va = getVal(a);
    const vb = getVal(b);
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
    return String(va).localeCompare(String(vb)) * dir;
  });
});

const setGamesSort = (key: 'tenant' | 'session' | 'date' | 'duration') => {
  if (gamesSort.value.key === key) {
    gamesSort.value.dir = gamesSort.value.dir === 'asc' ? 'desc' : 'asc';
  } else {
    gamesSort.value.key = key;
    gamesSort.value.dir = key === 'tenant' || key === 'session' ? 'asc' : 'desc';
  }
};

const sortIcon = (key: string) => {
  if (gamesSort.value.key !== key) return 'fa-solid fa-sort text-slate-400';
  return gamesSort.value.dir === 'asc' ? 'fa-solid fa-sort-up text-emerald-500' : 'fa-solid fa-sort-down text-emerald-500';
};

const formatDuration = (state: RunState) => {
  const diffMs = durationMs(state);
  if (!diffMs) return '—';
  const hours = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(mins)}`;
};

const formatDate = (value?: number | null) => {
  const ts = Number(value || 0);
  if (!ts) return '—';
  return new Date(ts).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
};

onMounted(fetchStates);
</script>

<style scoped>
:global(:root) {
  --games-accent: #f59e0b;
  --games-accent-strong: #d97706;
}
.games-text {
  color: var(--games-accent);
}
</style>
