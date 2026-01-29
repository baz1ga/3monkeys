<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <template v-if="loading">
      <div class="justify-center max-w-4xl mx-auto rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-sm flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
        <div class="h-5 w-5 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
        <span>{{ t('users.loading') }}</span>
      </div>
    </template>

    <section v-else class="space-y-6">
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <span class="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30">
            <i class="fa-solid fa-user-gear text-lg"></i>
          </span>
          <div>
            <h1 class="text-2xl font-semibold inline-flex items-center gap-2 text-cyan-500">
              {{ t('users.title') }}
            </h1>
            <p class="text-sm text-slate-500 dark:text-slate-200">{{ t('users.subtitle') }}</p>
          </div>
        </div>
      </div>

      <div class="flex flex-col lg:flex-row gap-4 max-w-4xl mx-auto">
        <div class="flex-1 rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-3 space-y-2 shadow-sm">
          <div class="flex flex-wrap items-center gap-3">
            <div class="flex items-center gap-2">
              <div class="font-semibold whitespace-nowrap">{{ t('users.globalQuota.label') }}</div>
              <div class="text-sm" :class="globalQuotaStatus === 'error' ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-300'">
                {{ globalQuotaMessage }}
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-3 ml-auto">
              <div class="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  step="1"
                  class="w-32 sm:w-40 rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                  v-model.number="globalQuotaValue"
                />
                <button
                  class="rounded-lg px-3 py-2 text-sm font-semibold text-white bg-cyan-500 hover:brightness-110 transition"
                  @click="saveGlobalQuota"
                >
                  {{ t('users.globalQuota.updateButton') }}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="lg:w-64 rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-3 shadow-sm flex items-center justify-between">
          <div class="font-semibold text-slate-900 dark:text-slate-100">{{ t('users.totalUsage') }}</div>
          <div class="text-sm text-slate-700 dark:text-slate-200">{{ totalUsageText }}</div>
        </div>
      </div>

      <div class="max-w-6xl mx-auto overflow-x-auto rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
        <table class="min-w-full text-sm">
          <thead class="bg-slate-100 text-slate-800 dark:bg-gray-700 dark:text-slate-50">
            <tr>
              <th class="px-4 py-2 text-left cursor-pointer" @click="setSort('name')">
                <div class="inline-flex items-center gap-2">
                  <span>{{ t('users.table.name') }}</span>
                  <i :class="sortIcon('name')" class="text-xs text-cyan-500"></i>
                </div>
              </th>
              <th class="px-4 py-2 text-left">{{ t('users.table.tenant') }}</th>
              <th class="px-4 py-2 text-left cursor-pointer" @click="setSort('scenarios')">
                <div class="inline-flex items-center gap-2">
                  <span>{{ t('users.table.scenarios') }}</span>
                  <i :class="sortIcon('scenarios')" class="text-xs text-cyan-500"></i>
                </div>
              </th>
              <th class="px-4 py-2 text-left cursor-pointer" @click="setSort('notes')">
                <div class="inline-flex items-center gap-2">
                  <span>{{ t('users.table.notes') }}</span>
                  <i :class="sortIcon('notes')" class="text-xs text-cyan-500"></i>
                </div>
              </th>
              <th class="px-4 py-2 text-left cursor-pointer" @click="setSort('images')">
                <div class="inline-flex items-center gap-2">
                  <span>{{ t('users.table.images') }}</span>
                  <i :class="sortIcon('images')" class="text-xs text-cyan-500"></i>
                </div>
              </th>
              <th class="px-4 py-2 text-left cursor-pointer" @click="setSort('audios')">
                <div class="inline-flex items-center gap-2">
                  <span>{{ t('users.table.audio') }}</span>
                  <i :class="sortIcon('audios')" class="text-xs text-cyan-500"></i>
                </div>
              </th>
              <th class="px-4 py-2 text-left cursor-pointer" @click="setSort('usage')">
                <div class="inline-flex items-center gap-2">
                  <span>{{ t('users.table.usage') }}</span>
                  <i :class="sortIcon('usage')" class="text-xs text-cyan-500"></i>
                </div>
              </th>
              <th class="px-4 py-2 text-left cursor-pointer" @click="setSort('lastLogin')">
                <div class="inline-flex items-center gap-2">
                  <span>{{ t('users.table.lastLogin') }}</span>
                  <i :class="sortIcon('lastLogin')" class="text-xs text-cyan-500"></i>
                </div>
              </th>
              <th class="px-4 py-2 text-left">{{ t('users.table.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="sortedUsers.length === 0">
              <td colspan="9" class="px-4 py-3 text-center text-slate-500">{{ t('users.table.empty') }}</td>
            </tr>
            <tr v-for="u in sortedUsers" :key="u.id" class="border-t border-slate-200 dark:border-gray-800">
              <td class="px-4 py-2">
                <div class="flex items-center gap-2">
                  <i v-if="u.role === 'ADMIN'" class="fa-solid fa-crown text-amber-400"></i>
                  <span>{{ u.displayName || u.email }}</span>
                </div>
              </td>
              <td class="px-4 py-2">
                <span>{{ u.tenantName || '—' }}</span>
              </td>
              <td class="px-4 py-2">{{ u.scenarioCount || 0 }}</td>
              <td class="px-4 py-2">{{ u.noteCount || 0 }}</td>
              <td class="px-4 py-2">{{ u.imageCount || 0 }}</td>
              <td class="px-4 py-2">{{ u.audioCount || 0 }}</td>
              <td class="px-4 py-2">
                <div class="w-36 sm:w-44 h-2 rounded-full bg-slate-800 overflow-hidden" :title="usageTitle(u)">
                  <div class="h-full" :style="`width:${usagePercent(u)}%; background: #0ea5e9;`"></div>
                </div>
                <div class="text-xs text-slate-400">{{ usageText(u) }}</div>
              </td>
              <td class="px-4 py-2">{{ formatDate(u.lastLogin) }}</td>
              <td class="px-4 py-2">
                <div class="flex items-center gap-2">
                  <button
                    class="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-cyan-300 text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 transition"
                    @click="openQuotaModal(u)"
                    :title="t('users.buttons.editQuota')"
                  >
                    <i class="fa-solid fa-chart-pie"></i>
                  </button>
                  <button
                    v-if="u.role !== 'ADMIN'"
                    class="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition"
                    @click="openDeleteModal(u)"
                    :title="t('users.buttons.delete')"
                  >
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="quotaModal.open" class="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/60" @click="closeQuotaModal"></div>
      <div class="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-800 shadow-2xl p-6 space-y-4">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-full text-white flex items-center justify-center text-xl bg-cyan-500">
            <i class="fa-solid fa-chart-pie"></i>
          </div>
          <div class="text-lg font-semibold text-slate-900 dark:text-slate-100">{{ t('users.tenantQuota.title') }}</div>
        </div>
        <p class="text-sm text-slate-600 dark:text-slate-300">
          {{ t('users.tenantQuota.desc') }}
          <span class="font-semibold">{{ quotaModal.user?.displayName || quotaModal.user?.email }}</span>.
          {{ t('users.tenantQuota.clear') }}
        </p>
        <div class="space-y-2">
          <label class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-200 font-semibold">{{ t('users.tenantQuota.label') }}</label>
          <input
            type="number"
            min="0"
            step="0.1"
            class="w-full rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            style="--tw-ring-color: #0ea5e9;"
            v-model="quotaModal.value"
            :placeholder="t('users.tenantQuota.placeholder')"
          />
          <p v-if="quotaModal.error" class="text-xs text-rose-500">{{ quotaModal.error }}</p>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button class="px-4 py-2 rounded-lg border border-slate-300 dark:border-gray-700 text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800" @click="closeQuotaModal">
            {{ t('common.cancel') }}
          </button>
          <button class="px-4 py-2 rounded-lg text-white font-semibold bg-cyan-500 hover:brightness-110 transition" @click="saveTenantQuota">
            {{ t('common.save') }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="confirmModal.open" class="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/60" @click="closeConfirm"></div>
      <div class="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-800 shadow-2xl p-6 space-y-4">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xl">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div class="text-lg font-semibold text-slate-900 dark:text-slate-100">{{ t('users.confirm.title') }}</div>
        </div>
        <p class="text-sm text-slate-600 dark:text-slate-300">{{ confirmModal.message }}</p>
        <div class="flex justify-end gap-2 pt-2">
          <button class="px-4 py-2 rounded-lg border border-slate-300 dark:border-gray-700 text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800" @click="closeConfirm">
            {{ t('common.cancel') }}
          </button>
          <button class="px-4 py-2 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-500" @click="confirmDelete">
            {{ t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

type UserRow = {
  id: string;
  email: string;
  displayName?: string | null;
  role: string;
  tenantId?: string | null;
  tenantName?: string | null;
  scenarioCount?: number;
  noteCount?: number;
  imageCount?: number;
  audioCount?: number;
  usageBytes?: number;
  quotaMB?: number | null;
  quotaOverride?: boolean;
  defaultQuotaMB?: number | null;
  lastLogin?: string | null;
};

const { t, locale } = useI18n();
const loading = ref(true);
const users = ref<UserRow[]>([]);
const globalQuotaValue = ref<number | ''>('');
const globalQuotaMessage = ref('');
const globalQuotaStatus = ref<'ok' | 'error'>('ok');
const quotaModal = ref<{ open: boolean; user: UserRow | null; value: string; error: string }>({
  open: false,
  user: null,
  value: '',
  error: ''
});
const confirmModal = ref<{ open: boolean; user: UserRow | null; message: string }>({
  open: false,
  user: null,
  message: ''
});
const sortKey = ref<'name' | 'scenarios' | 'notes' | 'images' | 'audios' | 'usage' | 'lastLogin'>('name');
const sortDir = ref<'asc' | 'desc'>('asc');

const setSort = (key: typeof sortKey.value) => {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortDir.value = 'asc';
  }
};

const sortIcon = (key: typeof sortKey.value) => {
  if (sortKey.value !== key) return 'fa-solid fa-sort text-slate-400';
  return sortDir.value === 'asc' ? 'fa-solid fa-sort-up text-cyan-500' : 'fa-solid fa-sort-down text-cyan-500';
};

const usageMB = (u: UserRow) => (u.usageBytes || 0) / 1024 / 1024;
const effectiveQuota = (u: UserRow) => u.quotaMB ?? u.defaultQuotaMB ?? 0;
const usageText = (u: UserRow) => {
  const used = usageMB(u);
  const quota = effectiveQuota(u);
  return quota ? `${used.toFixed(2)} / ${quota} Mo` : `${used.toFixed(2)} Mo (${t('users.usage.undefined')})`;
};
const usageTitle = (u: UserRow) => usageText(u);
const usagePercent = (u: UserRow) => {
  const mb = usageMB(u);
  const quota = effectiveQuota(u);
  if (!quota) return 0;
  return Math.min(100, (mb / quota) * 100);
};

const totalUsageText = computed(() => {
  const total = users.value.reduce((sum, u) => sum + usageMB(u), 0);
  return `${total.toFixed(2)} Mo`;
});

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  return date.toLocaleString(locale.value === 'en' ? 'en-US' : 'fr-FR');
};

const sortedUsers = computed(() => {
  const dir = sortDir.value === 'asc' ? 1 : -1;
  return [...users.value].sort((a, b) => {
    const get = (u: UserRow) => {
      switch (sortKey.value) {
        case 'name':
          return (u.displayName || u.email || '').toLowerCase();
        case 'scenarios':
          return u.scenarioCount || 0;
        case 'notes':
          return u.noteCount || 0;
        case 'images':
          return u.imageCount || 0;
        case 'audios':
          return u.audioCount || 0;
        case 'usage':
          return u.usageBytes || 0;
        case 'lastLogin':
          return u.lastLogin ? new Date(u.lastLogin).getTime() : 0;
        default:
          return 0;
      }
    };
    const va = get(a);
    const vb = get(b);
    if (va < vb) return -1 * dir;
    if (va > vb) return 1 * dir;
    return 0;
  });
});

const saveGlobalQuota = async () => {
  const value = Number(globalQuotaValue.value);
  if (!value || value <= 0) {
    globalQuotaMessage.value = t('users.globalQuota.invalid');
    globalQuotaStatus.value = 'error';
    return;
  }
  try {
    const res = await fetch('http://localhost:3100/api/admin/global-quota', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ defaultQuotaMB: value })
    });
    if (!res.ok) throw new Error();
    globalQuotaMessage.value = t('users.globalQuota.success');
    globalQuotaStatus.value = 'ok';
  } catch {
    globalQuotaMessage.value = t('users.globalQuota.updateError');
    globalQuotaStatus.value = 'error';
  }
};

const openQuotaModal = (u: UserRow) => {
  quotaModal.value = {
    open: true,
    user: u,
    value: u.quotaOverride ? String(u.quotaMB) : '',
    error: ''
  };
};

const closeQuotaModal = () => {
  quotaModal.value = { open: false, user: null, value: '', error: '' };
};

const saveTenantQuota = async () => {
  const user = quotaModal.value.user;
  if (!user?.tenantId) return;
  const trimmed = String(quotaModal.value.value ?? '').trim();
  let payload: number | null = null;
  if (trimmed !== '') {
    const num = Number(trimmed);
    if (!num || num <= 0) {
      quotaModal.value.error = t('users.tenantQuota.invalid');
      return;
    }
    payload = num;
  }
  try {
    const res = await fetch('http://localhost:3100/api/admin/tenant-quota', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ tenantId: user.tenantId, quotaMB: payload })
    });
    if (!res.ok) throw new Error();
    closeQuotaModal();
    const usersRes = await fetch('http://localhost:3100/api/admin/users', { credentials: 'include' });
    if (usersRes.ok) users.value = await usersRes.json();
  } catch {
    quotaModal.value.error = t('users.tenantQuota.updateError');
  }
};

const openDeleteModal = (u: UserRow) => {
  confirmModal.value = {
    open: true,
    user: u,
    message: t('users.confirm.deleteUser', { name: u.displayName || u.email })
  };
};

const closeConfirm = () => {
  confirmModal.value = { open: false, user: null, message: '' };
};

const confirmDelete = async () => {
  const user = confirmModal.value.user;
  if (!user) return;
  try {
    const res = await fetch(`http://localhost:3100/api/admin/user/${encodeURIComponent(user.id)}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!res.ok) throw new Error();
    closeConfirm();
    const usersRes = await fetch('http://localhost:3100/api/admin/users', { credentials: 'include' });
    if (usersRes.ok) users.value = await usersRes.json();
  } catch {
    confirmModal.value.message = t('users.confirm.error');
  }
};

onMounted(async () => {
  loading.value = true;
  try {
    const [usersRes, quotaRes] = await Promise.all([
      fetch('http://localhost:3100/api/admin/users', { credentials: 'include' }),
      fetch('http://localhost:3100/api/admin/global-quota', { credentials: 'include' })
    ]);
    if (!usersRes.ok) throw new Error('users');
    users.value = await usersRes.json();
    if (quotaRes.ok) {
      const data = await quotaRes.json();
      globalQuotaValue.value = data.defaultQuotaMB ?? '';
    }
  } catch (_) {
    users.value = [];
  } finally {
    loading.value = false;
  }
});
</script>
