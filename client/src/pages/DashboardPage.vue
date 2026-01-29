<template>
  <section class="max-w-5xl mx-auto space-y-8">
    <header class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
      <h1 class="text-2xl font-semibold">{{ t('dashboard.docTitle') }}</h1>
      <p class="text-slate-600 dark:text-slate-300">{{ t('dashboard.docSubtitle') }}</p>
    </header>

    <section class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm space-y-4">
      <h2 class="text-lg font-semibold">{{ t('dashboard.sectionStart') }}</h2>
      <ol class="grid gap-3 text-sm text-slate-600 dark:text-slate-200 list-decimal pl-4">
        <li>{{ t('dashboard.howBase') }}</li>
        <li>{{ t('dashboard.howScenes') }}</li>
        <li>{{ t('dashboard.howPlayers') }}</li>
        <li>{{ t('dashboard.howAmbience') }}</li>
        <li>{{ t('dashboard.howTension') }}</li>
      </ol>
      <div>
        <router-link
          to="/app/scenarios"
          class="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-500"
        >
          <i class="fa-solid fa-scroll"></i>
          <span>{{ t('dashboard.ctaScenario') }}</span>
        </router-link>
      </div>
    </section>

    <section class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm space-y-4">
      <h2 class="text-lg font-semibold">{{ t('dashboard.sectionFeatures') }}</h2>
      <div class="grid md:grid-cols-2 gap-3 text-sm text-slate-600 dark:text-slate-200">
        <div class="flex items-start gap-2">
          <i class="fa-solid fa-scroll text-emerald-600 mt-0.5"></i>
          <span>{{ t('dashboard.featureScenarios') }}</span>
        </div>
        <div class="flex items-start gap-2">
          <i class="fa-solid fa-clapperboard text-indigo-500 mt-0.5"></i>
          <span>{{ t('dashboard.featureScenes') }}</span>
        </div>
        <div class="flex items-start gap-2">
          <i class="fa-solid fa-users text-sky-500 mt-0.5"></i>
          <span>{{ t('dashboard.featurePlayerView') }}</span>
        </div>
        <div class="flex items-start gap-2">
          <i class="fa-solid fa-image text-emerald-500 mt-0.5"></i>
          <span>{{ t('dashboard.featureGallery') }}</span>
        </div>
        <div class="flex items-start gap-2">
          <i class="fa-solid fa-music text-indigo-500 mt-0.5"></i>
          <span>{{ t('dashboard.featureAudio') }}</span>
        </div>
        <div class="flex items-start gap-2">
          <i class="fa-solid fa-wave-square text-amber-500 mt-0.5"></i>
          <span>{{ t('dashboard.featureTension') }}</span>
        </div>
      </div>
    </section>

    <section class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm space-y-4">
      <h2 class="text-lg font-semibold">{{ t('dashboard.sectionTips') }}</h2>
      <ul class="grid gap-2 text-sm text-slate-600 dark:text-slate-200">
        <li>{{ t('dashboard.tipScenes') }}</li>
        <li>{{ t('dashboard.tipGm') }}</li>
        <li>{{ t('dashboard.tipPlayers') }}</li>
      </ul>
    </section>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>
