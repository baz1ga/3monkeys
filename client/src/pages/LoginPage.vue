<template>
  <main class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 relative">
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
    </div>
    <div class="bg-white dark:bg-slate-950 rounded-2xl shadow-lg p-8 w-full max-w-sm text-center space-y-4">
      <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ t('auth.loginTitle') }}</h1>
      <p class="text-slate-600 dark:text-slate-300">{{ t('auth.loginSubtitle') }}</p>
      <a
        class="inline-flex items-center justify-center w-full px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500"
        :href="discordLoginUrl"
      >
        {{ t('auth.loginDiscord') }}
      </a>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { setLocale } from '../i18n';
import { api } from '../lib/api';

const discordLoginUrl = api('/auth/discord/login');
const router = useRouter();
const { t, locale } = useI18n();

const switchLocale = (next: 'fr' | 'en') => {
  setLocale(next);
};

onMounted(async () => {
  try {
    const res = await fetch(api('/auth/me'), { credentials: 'include' });
    if (res.ok) {
      await router.replace('/app');
    }
  } catch (_) {
    // stay on login if API is unreachable
  }
});
</script>
