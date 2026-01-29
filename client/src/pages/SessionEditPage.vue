<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <div v-if="loading" class="justify-center max-w-4xl mx-auto rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-sm flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
      <div class="h-5 w-5 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
      <span>{{ t('sessions.edit.loading') }}</span>
    </div>

    <div v-else-if="error" class="max-w-4xl mx-auto rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-900/20 dark:text-rose-100 px-4 py-3 text-sm">
      {{ error }}
    </div>

    <section v-else class="space-y-6">
      <div class="flex items-center gap-3">
        <span class="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-lime-50 text-lime-700 dark:bg-lime-900/30">
          <i class="fa-solid fa-pen-to-square text-lg"></i>
        </span>
        <div>
          <h1 class="text-2xl font-semibold text-lime-600">{{ t('sessions.edit.title') }}</h1>
          <p class="text-sm text-slate-500 dark:text-slate-200">{{ t('sessions.edit.subtitle') }}</p>
        </div>
      </div>

      <div class="space-y-4 max-w-4xl mx-auto">
        <div class="rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-sm space-y-4">
          <div class="space-y-3">
            <label class="space-y-1 block">
              <span class="text-sm font-semibold text-slate-900 dark:text-slate-100">{{ t('sessions.edit.fields.titleLabel') }}</span>
              <input
                type="text"
                class="w-full rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                v-model="form.title"
                :placeholder="t('sessions.edit.fields.titlePlaceholder')"
              />
            </label>
            <div class="space-y-3">
              <div class="flex items-center justify-between gap-3">
                <span class="text-sm font-semibold text-slate-900 dark:text-slate-100">{{ t('sessions.edit.fields.iconLabel') }}</span>
                <div class="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
                  <i class="text-lg" :class="form.icon || defaultSessionIcon"></i>
                  <span>{{ t('sessions.edit.fields.preview') }}</span>
                </div>
              </div>
              <input
                type="search"
                class="w-full rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                :placeholder="t('sessions.edit.fields.iconSearch')"
                v-model="form.iconSearch"
              />
              <div class="grid grid-cols-8 gap-1 sm:grid-cols-8 max-h-48 overflow-y-auto pr-1">
                <button
                  v-for="option in filteredIcons(form.iconSearch)"
                  :key="option.value"
                  type="button"
                  class="rounded-2xl bg-white dark:bg-gray-950 px-2 py-3 flex flex-col items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-100 transition dark:hover:text-emerald-500"
                  :class="form.icon === option.value ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : ''"
                  @click="form.icon = option.value"
                >
                  <i class="text-xl" :class="option.value"></i>
                </button>
                <div
                  v-if="filteredIcons(form.iconSearch).length === 0"
                  class="col-span-full rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs text-slate-500 dark:border-gray-700 dark:bg-gray-900/60 dark:text-slate-400"
                >
                  {{ t('sessions.edit.fields.noIcon') }}
                </div>
              </div>
            </div>
          </div>
          <div class="flex flex-wrap justify-end gap-2">
            <button
              class="px-4 py-2 rounded-lg border border-rose-300 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm font-semibold hover:bg-rose-50 dark:hover:bg-rose-900/20 transition"
              @click="openDeleteConfirm"
              :disabled="saving"
            >
              <i class="fa-solid fa-trash"></i> {{ t('sessions.edit.actions.delete') }}
            </button>
            <button
              class="px-4 py-2 rounded-lg bg-emerald-500 text-slate-900 text-sm font-semibold hover:bg-emerald-400 transition inline-flex items-center gap-2"
              @click="saveSession"
              :disabled="saving"
            >
              <span v-if="!saving">{{ t('common.save') }}</span>
              <span v-else class="flex items-center gap-2">
                <span class="h-4 w-4 rounded-full border-2 border-emerald-800 border-t-transparent animate-spin"></span>
                <span>{{ t('common.saving') }}</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <div class="fixed inset-0 z-50 flex items-center justify-center px-4" v-show="confirmOpen" @keydown.escape.window="closeConfirm">
      <div class="fixed inset-0 bg-slate-900/60" @click="closeConfirm"></div>
      <div class="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-2xl space-y-4">
        <div class="flex items-start gap-3">
          <div class="h-10 w-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div class="space-y-1">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">{{ t('sessions.edit.confirm.title') }}</h3>
            <p class="text-sm text-slate-600 dark:text-slate-300">
              {{ t('sessions.edit.confirm.message') }}
            </p>
          </div>
        </div>
        <div class="flex justify-end gap-2">
          <button class="px-4 py-2 rounded-lg border border-slate-200 dark:border-gray-700 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition" @click="closeConfirm">
            {{ t('common.cancel') }}
          </button>
          <button class="px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-500 transition" @click="deleteSession">
            {{ t('common.delete') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { DEFAULT_SESSION_ICON, filterIcons } from '../lib/iconPicker';
import { api } from '../lib/api';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const loading = ref(true);
const saving = ref(false);
const error = ref('');
const confirmOpen = ref(false);
const defaultSessionIcon = DEFAULT_SESSION_ICON;

const form = ref({
  title: '',
  icon: DEFAULT_SESSION_ICON,
  iconSearch: ''
});

const sessionId = computed(() => route.params.id as string);

const filteredIcons = (query: string) => filterIcons(query);

const fetchSession = async () => {
  loading.value = true;
  error.value = '';
  try {
    const res = await fetch(api(`/api/sessions/${encodeURIComponent(sessionId.value)}`), { credentials: 'include' });
    if (!res.ok) throw new Error('Not found');
    const data = await res.json();
    form.value.title = data.title || '';
    form.value.icon = data.icon || DEFAULT_SESSION_ICON;
  } catch {
    error.value = t('sessions.edit.error');
  } finally {
    loading.value = false;
  }
};

const saveSession = async () => {
  if (!form.value.title.trim()) return;
  saving.value = true;
  try {
    const res = await fetch(api(`/api/sessions/${encodeURIComponent(sessionId.value)}`), {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: form.value.title.trim(), icon: form.value.icon })
    });
    if (!res.ok) throw new Error('save');
    await res.json().catch(() => null);
  } catch {
    error.value = t('sessions.edit.saveError');
  } finally {
    saving.value = false;
  }
};

const openDeleteConfirm = () => {
  confirmOpen.value = true;
};

const closeConfirm = () => {
  confirmOpen.value = false;
};

const deleteSession = async () => {
  try {
    await fetch(api(`/api/sessions/${encodeURIComponent(sessionId.value)}`), {
      method: 'DELETE',
      credentials: 'include'
    });
    router.push('/app/scenarios');
  } catch {
    error.value = t('sessions.edit.deleteError');
  }
};

onMounted(() => {
  fetchSession();
});
</script>
