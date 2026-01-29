<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <div v-if="loading" class="justify-center max-w-4xl mx-auto rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-sm flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
      <div class="h-5 w-5 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
      <span>{{ t('tension.loading') }}</span>
    </div>

    <div v-else-if="error" class="max-w-4xl mx-auto rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-900/20 dark:text-rose-100 px-4 py-3 text-sm">
      {{ error }}
    </div>

    <section v-else class="space-y-6 max-w-7xl mx-auto">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-3">
          <span class="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-lime-50 text-amber-500 dark:bg-lime-900/30">
            <i class="fa-solid fa-bolt text-lg"></i>
          </span>
          <div>
            <h1 class="text-2xl font-semibold audio-text">{{ t('tension.title') }}</h1>
            <p class="text-sm text-slate-500 dark:text-slate-200">{{ t('tension.subtitle') }}</p>
          </div>
        </div>
      </div>

      <div class="space-y-4 max-w-4xl mx-auto">
        <div class="rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-sm space-y-4">
          <div class="flex items-center justify-between gap-3">
            <span class="text-sm font-semibold text-slate-900 dark:text-slate-100">
              <span v-if="!tensionEnabled">{{ t('tension.enable') }}</span>
              <span v-else>{{ t('tension.disable') }}</span>
            </span>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                class="sr-only peer"
                v-model="tensionEnabled"
                :aria-label="t('accessibility.tensionToggle')"
                :title="t('accessibility.tensionToggle')"
              />
              <div class="w-11 h-6 bg-slate-500 peer-focus:outline-none rounded-full peer peer-checked:bg-emerald-600 transition"></div>
              <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition peer-checked:translate-x-5"></div>
            </label>
          </div>

          <div class="space-y-2">
            <h3 class="text-sm font-semibold text-slate-900 dark:text-slate-100">{{ t('tension.textStyle') }}</h3>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <label
              v-for="font in fonts"
              :key="font.value"
              class="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-900/20"
            >
              <input type="radio" class="text-rose-600" name="tensionFont" :value="font.value" v-model="tensionFont" />
              <span :style="{ fontFamily: font.family }" class="text-base">{{ font.label }}</span>
            </label>
          </div>

          <div class="space-y-2">
            <h3 class="text-sm font-semibold text-slate-900 dark:text-slate-100">{{ t('tension.levelsTitle') }}</h3>
            <div v-for="level in levels" :key="level" class="rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100">
              <div class="flex flex-wrap items-center gap-3">
                <span class="font-semibold">{{ tensionLabels[level] || '' }}</span>
                <div class="ml-auto flex items-center gap-3 flex-wrap justify-end">
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-slate-500 dark:text-slate-200">{{ t('tension.fields.label') }}</span>
                    <input
                      type="text"
                      maxlength="4"
                      class="w-20 rounded border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-sm text-slate-900 dark:text-slate-100"
                      v-model="tensionLabels[level]"
                      :aria-label="t('accessibility.tensionLabel')"
                    />
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-slate-500 dark:text-slate-200">{{ t('tension.fields.color') }}</span>
                    <input
                      type="color"
                      class="h-9 w-12 rounded border border-slate-300 dark:border-gray-700 bg-transparent cursor-pointer"
                      v-model="tensionColors[level]"
                      :aria-label="t('accessibility.tensionColor')"
                      :title="t('accessibility.tensionColor')"
                    />
                  </div>
                  <div class="flex items-center gap-2 min-w-[180px]">
                    <span class="text-xs text-slate-500 dark:text-slate-200 whitespace-nowrap">{{ t('tension.fields.audio') }}</span>
                    <select
                      class="flex-1 rounded border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-sm text-slate-900 dark:text-slate-100"
                      v-model="tensionAudio[level]"
                      :aria-label="t('accessibility.tensionAudio')"
                      :title="t('accessibility.tensionAudio')"
                    >
                      <option :value="null">{{ t('tension.fields.audioNone') }}</option>
                      <option v-if="tensionAudio[level] && !tenantAudioNames.has(tensionAudio[level]!)" :value="tensionAudio[level]">
                        {{ tensionAudio[level] }} {{ t('tension.fields.audioMissing') }}
                      </option>
                      <option v-for="audio in tenantAudio" :key="audio.name" :value="audio.name">
                        {{ audio.name }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between gap-3">
            <div class="text-sm" :class="tensionStatus === 'error' ? 'text-rose-500' : 'text-emerald-600'">
              {{ tensionMessage }}
            </div>
            <div class="flex gap-2">
              <button
                class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-stone-400 text-sm text-stone-700 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-slate-200 hover:bg-stone-50 dark:hover:bg-stone-800/30 transition"
                @click="resetTensionDefaults"
                :disabled="tensionSaving"
                :aria-label="t('accessibility.resetTension')"
                :title="t('accessibility.resetTension')"
              >
                <i class="fa-solid fa-rotate-left"></i>
                <span>{{ t('tension.reset') }}</span>
              </button>
              <button
                class="px-4 py-2 rounded-lg bg-stone-700 border border-stone-700 text-white text-sm font-semibold hover:bg-stone-400 transition disabled:opacity-60 disabled:cursor-not-allowed"
                @click="saveSessionTension"
                :disabled="tensionSaving"
                :aria-label="t('accessibility.saveTension')"
                :title="t('accessibility.saveTension')"
              >
                <span v-if="!tensionSaving">{{ t('common.save') }}</span>
                <span v-else>{{ t('tension.saving') }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { api } from '../lib/api';

type AudioAsset = { name: string };

const { t } = useI18n();
const route = useRoute();
const sessionId = computed(() => route.params.id as string);

const levels = ['level1', 'level2', 'level3', 'level4', 'level5'] as const;
const defaultTension = {
  enabled: true,
  colors: {
    level1: '#37aa32',
    level2: '#f8d718',
    level3: '#f39100',
    level4: '#e63027',
    level5: '#3a3a39'
  },
  labels: {
    level1: '0',
    level2: '-5',
    level3: '+5',
    level4: '+10',
    level5: '+15'
  },
  font: null as string | null,
  audio: {
    level1: null,
    level2: null,
    level3: null,
    level4: null,
    level5: null
  }
};

const fonts = [
  { value: 'Audiowide', label: t('tension.fonts.audiowide'), family: "'Audiowide', sans-serif" },
  { value: 'Metal Mania', label: t('tension.fonts.metal'), family: "'Metal Mania', cursive" },
  { value: 'Rye', label: t('tension.fonts.rye'), family: "'Rye', cursive" },
  { value: 'Share Tech Mono', label: t('tension.fonts.shareTech'), family: "'Share Tech Mono', monospace" },
  { value: 'Bangers', label: t('tension.fonts.bangers'), family: "'Bangers', cursive" },
  { value: 'Great Vibes', label: t('tension.fonts.greatVibes'), family: "'Great Vibes', cursive" }
];

const loading = ref(true);
const error = ref('');
const tensionEnabled = ref(true);
const tensionFont = ref<string | null>(null);
const tensionColors = reactive({ ...defaultTension.colors });
const tensionLabels = reactive({ ...defaultTension.labels });
const tensionAudio = reactive({ ...defaultTension.audio });
const tenantAudio = ref<AudioAsset[]>([]);
const tensionMessage = ref('');
const tensionStatus = ref<'ok' | 'error'>('ok');
const tensionSaving = ref(false);

const tenantAudioNames = computed(() => new Set(tenantAudio.value.map(a => a.name)));

const loadSession = async () => {
  const res = await fetch(api(`/api/sessions/${encodeURIComponent(sessionId.value)}`), { credentials: 'include' });
  if (!res.ok) throw new Error('session');
  const data = await res.json();
  tensionEnabled.value = data.tensionEnabled ?? defaultTension.enabled;
  tensionFont.value = data.tensionFont ?? defaultTension.font;
  Object.assign(tensionColors, defaultTension.colors, data.tensionColors || {});
  Object.assign(tensionLabels, defaultTension.labels, data.tensionLabels || {});
  Object.assign(tensionAudio, defaultTension.audio, data.tensionAudio || {});
};

const loadAudio = async () => {
  const res = await fetch(api('/api/assets?type=audio'), { credentials: 'include' });
  tenantAudio.value = res.ok ? await res.json() : [];
};

const resetTensionDefaults = async () => {
  tensionEnabled.value = defaultTension.enabled;
  tensionFont.value = defaultTension.font;
  Object.assign(tensionColors, defaultTension.colors);
  Object.assign(tensionLabels, defaultTension.labels);
  Object.assign(tensionAudio, defaultTension.audio);
  await saveSessionTension();
};

const saveSessionTension = async () => {
  tensionSaving.value = true;
  tensionMessage.value = '';
  tensionStatus.value = 'ok';
  try {
    const payload = {
      tensionEnabled: tensionEnabled.value,
      tensionFont: tensionFont.value,
      tensionColors: { ...tensionColors },
      tensionLabels: { ...tensionLabels },
      tensionAudio: { ...tensionAudio }
    };
    const res = await fetch(api(`/api/sessions/${encodeURIComponent(sessionId.value)}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'save');
    tensionMessage.value = tensionEnabled.value ? t('tension.savedOn') : t('tension.savedOff');
  } catch (err: any) {
    tensionStatus.value = 'error';
    tensionMessage.value = err?.message || t('tension.saveError');
  } finally {
    tensionSaving.value = false;
  }
};

const init = async () => {
  loading.value = true;
  error.value = '';
  try {
    await Promise.all([loadSession(), loadAudio()]);
  } catch {
    error.value = t('tension.loadError');
  } finally {
    loading.value = false;
  }
};

onMounted(init);
watch(sessionId, init);
</script>
