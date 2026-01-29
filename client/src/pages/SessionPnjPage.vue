<template>
  <div class="rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-sm">
    <div class="flex items-center gap-3">
      <span class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20">
        <i class="fa-solid fa-user-ninja text-lg"></i>
      </span>
      <div>
        <h2 class="text-lg font-semibold text-emerald-600">{{ t('sessionNav.pnj') }}</h2>
        <p class="text-sm text-slate-500 dark:text-slate-200">{{ t('sessionNav.comingSoon') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>
