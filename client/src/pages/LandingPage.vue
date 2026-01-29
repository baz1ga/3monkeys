<template>
  <div class="min-h-screen flex items-center justify-center" data-theme>
    <div class="absolute top-4 right-4 flex items-center gap-2">
      <div class="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1 text-xs font-semibold">
        <button
          class="px-2 py-1 rounded-full transition"
          :class="locale === 'fr' ? 'bg-emerald-500 text-slate-900' : 'text-slate-500 dark:text-slate-300'"
          @click="switchLocale('fr')"
        >
          FR
        </button>
        <button
          class="px-2 py-1 rounded-full transition"
          :class="locale === 'en' ? 'bg-emerald-500 text-slate-900' : 'text-slate-500 dark:text-slate-300'"
          @click="switchLocale('en')"
        >
          EN
        </button>
      </div>
      <button
        class="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
        @click="toggleTheme"
      >
        <i :class="iconClass"></i>
        <span>{{ label }}</span>
      </button>
    </div>

    <div class="w-full max-w-5xl mx-auto px-4 space-y-6">
      <div class="grid md:grid-cols-[1.1fr_0.9fr] gap-6 items-stretch">
        <section
          class="rounded-2xl border border-slate-200 dark:border-gray-800 bg-gradient-to-br from-emerald-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 shadow-xl p-8 space-y-4 text-slate-800 dark:text-slate-100"
        >
          <h2 class="text-2xl font-bold">
            <span class="text-emerald-500 font-pangolin">.ScenarWall.</span> {{ t('landing.pitchTitle') }}
          </h2>
          <p class="text-base leading-relaxed text-slate-700 dark:text-slate-300">
            {{ t('landing.pitchText') }}
            <span class="italic">{{ t('landing.pitchQuote') }}</span>
          </p>
          <div class="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-200">
            <div
              class="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-300"
            >
              <i class="fa-solid fa-image"></i>
            </div>
            <span>{{ t('landing.featureGallery') }}</span>
          </div>
          <div class="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-200">
            <div
              class="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-300"
            >
              <i class="fa-solid fa-music"></i>
            </div>
            <span>{{ t('landing.featureAudio') }}</span>
          </div>
          <div class="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-200">
            <div
              class="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-300"
            >
              <i class="fa-solid fa-wave-square"></i>
            </div>
            <span>{{ t('landing.featureTension') }}</span>
          </div>
        </section>

        <section class="rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-xl p-8 space-y-6">
          <div class="text-center space-y-2">
            <img src="/assets/logo-scenarwall.png" alt="ScenarWall" class="h-20 w-auto mx-auto" />
            <div class="text-5xl font-semibold text-emerald-500 font-pangolin text-center mx-auto">.ScenarWall.</div>
            <h1 class="text-2xl font-bold">{{ t('landing.loginTitle') }}</h1>
          </div>

          <div class="space-y-4">
            <a
              :href="discordLoginUrl"
              class="w-full inline-flex justify-center items-center gap-2 rounded-lg border border-indigo-500 bg-indigo-600 text-white font-semibold py-2 hover:bg-indigo-500"
            >
              <i class="fa-brands fa-discord"></i> {{ t('landing.loginDiscord') }}
            </a>
          </div>
        </section>
      </div>

      <div class="border-t border-slate-200 dark:border-gray-800 pt-4">
        <footer class="sw-legal-footer mt-6 text-center text-xs leading-6 text-slate-500 dark:text-slate-200 space-y-1">
          <div class="text-base font-semibold text-emerald-500 font-pangolin">{{ t('landing.footerTitle') }}</div>
          <div class="author uppercase tracking-[0.06em] font-semibold text-slate-700 dark:text-slate-300">
            @Baz1ga & @MattBD<i class="fa-brands fa-discord"></i> Discord)
          </div>
          <div class="links inline-flex flex-wrap gap-3 items-center justify-center">
            <a
              class="text-emerald-500 hover:text-emerald-400 transition"
              href="https://phserres.notion.site/Mentions-l-gales-2b625b4f22b780e4852aeeb762578222?pvs=74"
              target="_blank"
              rel="noopener"
            >
              {{ t('landing.legal') }}
            </a>
            <a
              class="text-emerald-500 hover:text-emerald-400 transition"
              href="https://phserres.notion.site/Politique-de-confidentialit-2b625b4f22b780a6b2dce2997443e591?pvs=73"
              target="_blank"
              rel="noopener"
            >
              {{ t('landing.privacy') }}
            </a>
            <a
              class="text-emerald-500 hover:text-emerald-400 transition"
              href="https://phserres.notion.site/Conditions-G-n-rales-d-Utilisation-2b825b4f22b780d68ef6c926efa35af8"
              target="_blank"
              rel="noopener"
            >
              {{ t('landing.terms') }}
            </a>
          </div>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { setLocale } from '../i18n';
import { api } from '../lib/api';

const discordLoginUrl = api('/auth/discord/login');
const theme = ref<'light' | 'dark'>('light');
const isDark = computed(() => theme.value === 'dark');
const router = useRouter();
const { t, locale } = useI18n();

const switchLocale = (next: 'fr' | 'en') => {
  setLocale(next);
};

const iconClass = computed(() => (isDark.value ? 'fa-regular fa-sun' : 'fa-solid fa-moon'));
const label = computed(() => (isDark.value ? t('landing.themeLight') : t('landing.themeDark')));

const applyTheme = (mode: 'light' | 'dark') => {
  document.documentElement.classList.toggle('dark', mode === 'dark');
  localStorage.setItem('sw_theme', mode);
  theme.value = mode;
};

const toggleTheme = () => {
  applyTheme(isDark.value ? 'light' : 'dark');
};

onMounted(() => {
  const saved = localStorage.getItem('sw_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme((saved as 'light' | 'dark') || (prefersDark ? 'dark' : 'light'));
});

onMounted(async () => {
  try {
    const res = await fetch(api('/auth/me'), { credentials: 'include' });
    if (res.ok) {
      await router.replace('/app');
    }
  } catch (_) {
    // stay on landing if API is unreachable
  }
});
</script>
