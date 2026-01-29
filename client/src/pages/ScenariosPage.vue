<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <template v-if="pageLoading">
      <div class="justify-center max-w-4xl mx-auto rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-sm flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
        <div class="h-5 w-5 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
        <span>{{ t('scenarios.loadingPage') }}</span>
      </div>
    </template>

    <section v-else class="space-y-6">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <span class="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20">
              <i class="fa-solid fa-book-open text-xl"></i>
            </span>
            <div>
              <h1 class="text-2xl font-semibold text-emerald-500">{{ t('scenarios.title') }}</h1>
              <p class="text-sm text-slate-500 dark:text-slate-200">{{ t('scenarios.subtitle') }}</p>
            </div>
          </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="openCreateModal"
            class="inline-flex items-center gap-2 rounded-lg bg-emerald-500 text-slate-900 font-semibold px-4 py-2 text-sm shadow-sm hover:bg-emerald-400 transition"
          >
            <i class="fa-solid fa-plus"></i> {{ t('scenarios.new') }}
          </button>
        </div>
      </div>

      <div class="rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 shadow-sm space-y-4">
        <template v-if="loading">
          <div class="justify-center flex items-center gap-3 text-sm text-slate-500">
            <div class="h-5 w-5 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
            <span>{{ t('scenarios.loadingList') }}</span>
          </div>
        </template>

        <template v-else-if="scenarios.length === 0">
          <div class="border border-dashed border-slate-300 dark:border-gray-700 rounded-xl p-6 text-center text-sm text-slate-600 dark:text-slate-200 space-y-3">
            <div class="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30">
              <i class="fa-solid fa-wand-magic-sparkles"></i>
            </div>
            <div>{{ t('scenarios.empty') }}</div>
          </div>
        </template>

        <div v-else class="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3">
          <div
            v-for="scenario in scenarios"
            :key="scenario.id"
            class="rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 shadow-sm flex flex-col gap-3 hover:shadow-md transition"
          >
            <div class="space-y-2 flex-1 block">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-1.5 min-w-0">
                  <span class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 shrink-0">
                    <i class="text-lg" :class="scenario.icon || defaultScenarioIcon"></i>
                  </span>
                  <div class="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {{ scenario.title || t('common.untitled') }}
                  </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <button
                    class="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition"
                    @click="openEditModal(scenario)"
                  >
                    <i class="fa-solid fa-pen"></i>
                  </button>
                  <button
                    class="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-rose-200 dark:border-rose-900 bg-white dark:bg-gray-950 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition"
                    @click="openDeleteModal(scenario)"
                  >
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
              <div class="space-y-2">
                <div
                  v-for="sess in scenario.sessions"
                  :key="sess.id"
                  class="rounded-lg border border-slate-200 dark:border-gray-700 px-3 py-2 text-sm hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition"
                >
                  <div class="flex items-center justify-between gap-2">
                    <router-link
                      class="inline-flex items-center gap-1.5 min-w-0 text-slate-800 dark:text-slate-100"
                      :to="`/app/sessions/${sess.id}/scenes`"
                    >
                      <i class="text-emerald-500" :class="sess.icon || defaultSessionIcon"></i>
                      <span class="font-semibold truncate">{{ sess.title || t('common.untitled') }}</span>
                    </router-link>
                    <router-link
                      class="h-7 w-7 inline-flex items-center justify-center rounded-lg border border-indigo-300 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                      :to="`/app/sessions/${sess.id}/gm`"
                      :title="t('sessionNav.gm')"
                      :aria-label="t('sessionNav.gm')"
                    >
                      <i class="fa-solid fa-play"></i>
                    </router-link>
                  </div>
                </div>
                <div v-if="scenario.sessions.length === 0" class="text-xs text-slate-400">
                  {{ t('sessions.noSessions') }}
                </div>
                <button
                  type="button"
                  class="w-full text-center rounded-lg border border-dashed border-emerald-400 text-emerald-600 px-3 py-2 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition inline-flex items-center justify-center gap-2"
                  @click="openSessionCreateModal(scenario.id)"
                >
                  <i class="fa-solid fa-circle-plus"></i> <span>{{ t('scenarios.newSession') }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <template v-if="confirmModal.open">
      <div class="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"></div>
        <div class="relative bg-white dark:bg-gray-950 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-gray-800">
          <div class="px-5 py-4 border-b border-slate-200 dark:border-gray-800 flex items-start gap-3">
            <div class="h-9 w-9 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200 flex items-center justify-center">
              <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div class="space-y-1">
              <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">{{ t('scenarios.confirm.title') }}</h3>
              <p class="text-sm text-slate-600 dark:text-slate-200">{{ confirmModal.message }}</p>
            </div>
          </div>
          <div class="px-5 py-4 flex items-center justify-end gap-3">
            <button
              class="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              @click="closeConfirm"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              class="px-4 py-2 text-sm rounded-lg bg-rose-500 text-white font-semibold hover:bg-rose-400 transition"
              @click="confirmDelete"
            >
              {{ t('common.delete') }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <template v-if="createModal.open">
      <div class="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"></div>
        <div class="relative bg-white dark:bg-gray-950 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-gray-800 p-5 space-y-4">
          <div class="space-y-1">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">{{ t('scenarios.create.title') }}</h3>
          </div>
          <div class="space-y-2">
            <label class="space-y-1 block">
              <input
                type="text"
                class="w-full rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                v-model="createModal.title"
                :placeholder="t('scenarios.create.placeholder')"
              />
            </label>
            <div class="space-y-3">
              <div class="flex items-center justify-between gap-3">
                <span class="text-sm font-semibold text-slate-900 dark:text-slate-100">{{ t('scenarios.create.iconLabel') }}</span>
                <div class="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
                  <i class="text-lg" :class="createModal.icon || defaultScenarioIcon"></i>
                  <span>{{ t('scenarios.create.iconPreview') }}</span>
                </div>
              </div>
              <input
                type="search"
                class="w-full rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                :placeholder="t('scenarios.create.iconSearch')"
                v-model="createModal.iconSearch"
              />
              <div class="grid grid-cols-8 gap-1 sm:grid-cols-8 max-h-48 overflow-y-auto pr-1">
                <button
                  v-for="option in filteredIcons(createModal.iconSearch)"
                  :key="option.value"
                  type="button"
                  class="rounded-2xl bg-white dark:bg-gray-950 px-2 py-3 flex flex-col items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-100 transition dark:hover:text-emerald-500"
                  :class="createModal.icon === option.value ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : ''"
                  @click="createModal.icon = option.value"
                >
                  <i class="text-xl" :class="option.value"></i>
                </button>
                <div
                  v-if="filteredIcons(createModal.iconSearch).length === 0"
                  class="col-span-full rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs text-slate-500 dark:border-gray-700 dark:bg-gray-900/60 dark:text-slate-400"
                >
                  {{ t('scenarios.create.iconNone') }}
                </div>
              </div>
            </div>
            <div
              v-if="createModal.error"
              class="rounded-lg border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-900/20 dark:text-rose-100 px-3 py-2 text-sm"
            >
              {{ createModal.error }}
            </div>
          </div>
          <div class="flex items-center justify-end gap-2">
            <button
              class="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              @click="closeCreateModal"
              :disabled="createModal.saving"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              class="px-4 py-2 text-sm rounded-lg bg-emerald-500 text-slate-900 font-semibold hover:bg-emerald-400 transition inline-flex items-center gap-2"
              @click="submitCreate"
              :disabled="createModal.saving"
            >
              {{ createModal.saving ? t('common.saving') : t('common.save') }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <template v-if="sessionCreateModal.open">
      <div class="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"></div>
        <div class="relative bg-white dark:bg-gray-950 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-gray-800 p-5 space-y-4">
          <div class="space-y-1">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">{{ t('sessions.create.title') }}</h3>
          </div>
          <div class="space-y-2">
            <label class="space-y-1 block">
              <input
                type="text"
                class="w-full rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                v-model="sessionCreateModal.title"
                :placeholder="t('sessions.create.placeholder')"
              />
            </label>
            <input type="hidden" v-model="sessionCreateModal.scenarioId" />
            <div class="space-y-3">
              <div class="flex items-center justify-between gap-3">
                <span class="text-sm font-semibold text-slate-900 dark:text-slate-100">{{ t('sessions.create.iconLabel') }}</span>
                <div class="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
                  <i class="text-lg" :class="sessionCreateModal.icon || defaultSessionIcon"></i>
                  <span>{{ t('sessions.create.iconPreview') }}</span>
                </div>
              </div>
              <input
                type="search"
                class="w-full rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                :placeholder="t('sessions.create.iconSearch')"
                v-model="sessionCreateModal.iconSearch"
              />
              <div class="grid grid-cols-8 gap-1 sm:grid-cols-8 max-h-48 overflow-y-auto pr-1">
                <button
                  v-for="option in filteredIcons(sessionCreateModal.iconSearch)"
                  :key="option.value"
                  type="button"
                  class="rounded-2xl bg-white dark:bg-gray-950 px-2 py-3 flex flex-col items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-100 transition dark:hover:text-emerald-500"
                  :class="sessionCreateModal.icon === option.value ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : ''"
                  @click="sessionCreateModal.icon = option.value"
                >
                  <i class="text-xl" :class="option.value"></i>
                </button>
                <div
                  v-if="filteredIcons(sessionCreateModal.iconSearch).length === 0"
                  class="col-span-full rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs text-slate-500 dark:border-gray-700 dark:bg-gray-900/60 dark:text-slate-400"
                >
                  {{ t('sessions.create.iconNone') }}
                </div>
              </div>
            </div>
            <div
              v-if="sessionCreateModal.error"
              class="rounded-lg border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-900/20 dark:text-rose-100 px-3 py-2 text-sm"
            >
              {{ sessionCreateModal.error }}
            </div>
          </div>
          <div class="flex items-center justify-end gap-2">
            <button
              class="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              @click="closeSessionCreateModal"
              :disabled="sessionCreateModal.saving"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              class="px-4 py-2 text-sm rounded-lg bg-emerald-500 text-slate-900 font-semibold hover:bg-emerald-400 transition inline-flex items-center gap-2"
              @click="submitSessionCreate"
              :disabled="sessionCreateModal.saving"
            >
              {{ sessionCreateModal.saving ? t('common.saving') : t('common.save') }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <template v-if="sessionEditModal.open">
      <div class="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"></div>
        <div class="relative bg-white dark:bg-gray-950 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-gray-800 p-5 space-y-4">
          <div class="space-y-1">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">{{ t('sessions.edit.title') }}</h3>
          </div>
          <div class="space-y-2">
            <label class="space-y-1 block">
              <input
                type="text"
                class="w-full rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                v-model="sessionEditModal.title"
                :placeholder="t('sessions.edit.fields.titlePlaceholder')"
              />
            </label>
            <input type="hidden" v-model="sessionEditModal.scenarioId" />
            <div class="space-y-3">
              <div class="flex items-center justify-between gap-3">
                <span class="text-sm font-semibold text-slate-900 dark:text-slate-100">{{ t('sessions.edit.fields.iconLabel') }}</span>
                <div class="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
                  <i class="text-lg" :class="sessionEditModal.icon || defaultSessionIcon"></i>
                  <span>{{ t('sessions.edit.fields.preview') }}</span>
                </div>
              </div>
              <input
                type="search"
                class="w-full rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                :placeholder="t('sessions.edit.fields.iconSearch')"
                v-model="sessionEditModal.iconSearch"
              />
              <div class="grid grid-cols-8 gap-1 sm:grid-cols-8 max-h-48 overflow-y-auto pr-1">
                <button
                  v-for="option in filteredIcons(sessionEditModal.iconSearch)"
                  :key="option.value"
                  type="button"
                  class="rounded-2xl bg-white dark:bg-gray-950 px-2 py-3 flex flex-col items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-100 transition dark:hover:text-emerald-500"
                  :class="sessionEditModal.icon === option.value ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : ''"
                  @click="sessionEditModal.icon = option.value"
                >
                  <i class="text-xl" :class="option.value"></i>
                </button>
                <div
                  v-if="filteredIcons(sessionEditModal.iconSearch).length === 0"
                  class="col-span-full rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs text-slate-500 dark:border-gray-700 dark:bg-gray-900/60 dark:text-slate-400"
                >
                  {{ t('sessions.edit.fields.noIcon') }}
                </div>
              </div>
            </div>
            <div
              v-if="sessionEditModal.error"
              class="rounded-lg border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-900/20 dark:text-rose-100 px-3 py-2 text-sm"
            >
              {{ sessionEditModal.error }}
            </div>
          </div>
          <div class="flex items-center justify-end gap-2">
            <button
              class="px-4 py-2 text-sm rounded-lg border border-rose-300 dark:border-rose-900 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition"
              @click="openSessionDeleteConfirm"
              :disabled="sessionEditModal.saving"
            >
              {{ t('sessions.edit.actions.delete') }}
            </button>
            <button
              class="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              @click="closeSessionEditModal"
              :disabled="sessionEditModal.saving"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              class="px-4 py-2 text-sm rounded-lg bg-emerald-500 text-slate-900 font-semibold hover:bg-emerald-400 transition inline-flex items-center gap-2"
              @click="submitSessionEdit"
              :disabled="sessionEditModal.saving"
            >
              {{ sessionEditModal.saving ? t('common.saving') : t('common.save') }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <template v-if="sessionConfirmModal.open">
      <div class="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"></div>
        <div class="relative bg-white dark:bg-gray-950 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-gray-800">
          <div class="px-5 py-4 border-b border-slate-200 dark:border-gray-800 flex items-start gap-3">
            <div class="h-9 w-9 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200 flex items-center justify-center">
              <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div class="space-y-1">
              <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">{{ t('sessions.confirm.title') }}</h3>
              <p class="text-sm text-slate-600 dark:text-slate-200">{{ sessionConfirmModal.message }}</p>
            </div>
          </div>
          <div class="px-5 py-4 flex items-center justify-end gap-3">
            <button
              class="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              @click="closeSessionDeleteConfirm"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              class="px-4 py-2 text-sm rounded-lg bg-rose-500 text-white font-semibold hover:bg-rose-400 transition"
              @click="confirmSessionDelete"
            >
              {{ t('common.delete') }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <template v-if="editModal.open">
      <div class="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"></div>
        <div class="relative bg-white dark:bg-gray-950 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-gray-800 p-5 space-y-4">
          <div class="space-y-1">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">{{ t('scenarios.edit.title') }}</h3>
          </div>
          <div class="space-y-2">
            <label class="space-y-1 block">
              <input
                type="text"
                class="w-full rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                v-model="editModal.title"
                :placeholder="t('scenarios.edit.placeholder')"
              />
            </label>
            <div class="space-y-3">
              <div class="flex items-center justify-between gap-3">
                <span class="text-sm font-semibold text-slate-900 dark:text-slate-100">{{ t('scenarios.create.iconLabel') }}</span>
                <div class="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
                  <i class="text-lg" :class="editModal.icon || defaultScenarioIcon"></i>
                  <span>{{ t('scenarios.create.iconPreview') }}</span>
                </div>
              </div>
              <input
                type="search"
                class="w-full rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                :placeholder="t('scenarios.create.iconSearch')"
                v-model="editModal.iconSearch"
              />
              <div class="grid grid-cols-8 gap-1 sm:grid-cols-8 max-h-48 overflow-y-auto pr-1">
                <button
                  v-for="option in filteredIcons(editModal.iconSearch)"
                  :key="option.value"
                  type="button"
                  class="rounded-2xl bg-white dark:bg-gray-950 px-2 py-3 flex flex-col items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-100 transition dark:hover:text-emerald-500"
                  :class="editModal.icon === option.value ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : ''"
                  @click="editModal.icon = option.value"
                >
                  <i class="text-xl" :class="option.value"></i>
                </button>
                <div
                  v-if="filteredIcons(editModal.iconSearch).length === 0"
                  class="col-span-full rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs text-slate-500 dark:border-gray-700 dark:bg-gray-900/60 dark:text-slate-400"
                >
                  {{ t('scenarios.create.iconNone') }}
                </div>
              </div>
            </div>
            <div
              v-if="editModal.error"
              class="rounded-lg border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-900/20 dark:text-rose-100 px-3 py-2 text-sm"
            >
              {{ editModal.error }}
            </div>
          </div>
          <div class="flex items-center justify-end gap-2">
            <button
              class="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              @click="closeEditModal"
              :disabled="editModal.saving"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              class="px-4 py-2 text-sm rounded-lg bg-emerald-500 text-slate-900 font-semibold hover:bg-emerald-400 transition inline-flex items-center gap-2"
              @click="submitEdit"
              :disabled="editModal.saving"
            >
              {{ editModal.saving ? t('common.saving') : t('common.save') }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { DEFAULT_SCENARIO_ICON, DEFAULT_SESSION_ICON, filterIcons } from '../lib/iconPicker';
import { api } from '../lib/api';

type ScenarioSession = {
  id: string;
  title: string;
  icon?: string | null;
};

type ScenarioItem = {
  id: string;
  title: string;
  icon?: string | null;
  sessions: ScenarioSession[];
};

const { t } = useI18n();
const loading = ref(true);
const pageLoading = ref(true);
const scenarios = ref<ScenarioItem[]>([]);
const defaultScenarioIcon = DEFAULT_SCENARIO_ICON;
const defaultSessionIcon = DEFAULT_SESSION_ICON;

const createModal = reactive({
  open: false,
  title: '',
  icon: DEFAULT_SCENARIO_ICON,
  iconSearch: '',
  saving: false,
  error: ''
});

const editModal = reactive({
  open: false,
  id: '',
  title: '',
  icon: DEFAULT_SCENARIO_ICON,
  iconSearch: '',
  saving: false,
  error: ''
});

const confirmModal = reactive({
  open: false,
  id: '',
  message: ''
});

const sessionCreateModal = reactive({
  open: false,
  title: '',
  icon: DEFAULT_SESSION_ICON,
  iconSearch: '',
  scenarioId: '',
  saving: false,
  error: ''
});

const sessionEditModal = reactive({
  open: false,
  id: '',
  title: '',
  icon: DEFAULT_SESSION_ICON,
  iconSearch: '',
  scenarioId: '',
  saving: false,
  error: ''
});

const sessionConfirmModal = reactive({
  open: false,
  id: '',
  message: ''
});

const filteredIcons = (query: string) => filterIcons(query);

const fetchScenarios = async () => {
  loading.value = true;
  try {
    const res = await fetch(api('/api/scenarios'), { credentials: 'include' });
    if (!res.ok) throw new Error('load');
    const data = await res.json();
    scenarios.value = Array.isArray(data)
      ? data.map((item: ScenarioItem) => ({
          ...item,
          sessions: Array.isArray(item.sessions) ? item.sessions : []
        }))
      : [];
  } catch (_) {
    scenarios.value = [];
  } finally {
    loading.value = false;
  }
};

const openCreateModal = () => {
  createModal.open = true;
  createModal.title = '';
  createModal.icon = DEFAULT_SCENARIO_ICON;
  createModal.iconSearch = '';
  createModal.error = '';
};

const closeCreateModal = () => {
  createModal.open = false;
};

const submitCreate = async () => {
  if (!createModal.title.trim()) {
    createModal.error = t('scenarios.errors.save');
    return;
  }
  createModal.saving = true;
  createModal.error = '';
  try {
    const res = await fetch(api('/api/scenarios'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title: createModal.title.trim(), icon: createModal.icon })
    });
    if (!res.ok) throw new Error('save');
    closeCreateModal();
    await fetchScenarios();
  } catch (_) {
    createModal.error = t('scenarios.errors.save');
  } finally {
    createModal.saving = false;
  }
};

const openEditModal = (scenario: ScenarioItem) => {
  editModal.open = true;
  editModal.id = scenario.id;
  editModal.title = scenario.title;
  editModal.icon = scenario.icon || DEFAULT_SCENARIO_ICON;
  editModal.iconSearch = '';
  editModal.error = '';
};

const closeEditModal = () => {
  editModal.open = false;
};

const submitEdit = async () => {
  if (!editModal.id) return;
  editModal.saving = true;
  editModal.error = '';
  try {
    const res = await fetch(api(`/api/scenarios/${encodeURIComponent(editModal.id)}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title: editModal.title.trim(), icon: editModal.icon })
    });
    if (!res.ok) throw new Error('save');
    closeEditModal();
    await fetchScenarios();
  } catch (_) {
    editModal.error = t('scenarios.errors.save');
  } finally {
    editModal.saving = false;
  }
};

const openDeleteModal = (scenario: ScenarioItem) => {
  confirmModal.open = true;
  confirmModal.id = scenario.id;
  const name = scenario.title || t('common.untitled');
  confirmModal.message = t('scenarios.confirm.messageWithName', { name });
};

const closeConfirm = () => {
  confirmModal.open = false;
};

const confirmDelete = async () => {
  if (!confirmModal.id) return;
  try {
    const res = await fetch(api(`/api/scenarios/${encodeURIComponent(confirmModal.id)}`), {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!res.ok) throw new Error('delete');
    closeConfirm();
    await fetchScenarios();
  } catch (_) {
    confirmModal.message = t('scenarios.errors.delete');
  }
};

const openSessionCreateModal = (scenarioId = '') => {
  sessionCreateModal.open = true;
  sessionCreateModal.title = '';
  sessionCreateModal.icon = DEFAULT_SESSION_ICON;
  sessionCreateModal.iconSearch = '';
  sessionCreateModal.scenarioId = scenarioId;
  sessionCreateModal.error = '';
};

const closeSessionCreateModal = () => {
  sessionCreateModal.open = false;
};

const submitSessionCreate = async () => {
  if (!sessionCreateModal.title.trim() || !sessionCreateModal.scenarioId) {
    sessionCreateModal.error = t('sessions.errors.save');
    return;
  }
  sessionCreateModal.saving = true;
  sessionCreateModal.error = '';
  try {
    const res = await fetch(api('/api/sessions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        title: sessionCreateModal.title.trim(),
        icon: sessionCreateModal.icon,
        scenarioId: sessionCreateModal.scenarioId || null
      })
    });
    if (!res.ok) throw new Error('save');
    await res.json().catch(() => null);
    closeSessionCreateModal();
    await fetchScenarios();
  } catch (_) {
    sessionCreateModal.error = t('sessions.errors.save');
  } finally {
    sessionCreateModal.saving = false;
  }
};

const openSessionEditModal = (session: ScenarioSession, scenarioId: string) => {
  sessionEditModal.open = true;
  sessionEditModal.id = session.id;
  sessionEditModal.title = session.title || '';
  sessionEditModal.icon = session.icon || DEFAULT_SESSION_ICON;
  sessionEditModal.iconSearch = '';
  sessionEditModal.scenarioId = scenarioId || '';
  sessionEditModal.error = '';
};

const closeSessionEditModal = () => {
  sessionEditModal.open = false;
};

const submitSessionEdit = async () => {
  if (!sessionEditModal.title.trim() || !sessionEditModal.scenarioId) {
    sessionEditModal.error = t('sessions.edit.saveError');
    return;
  }
  sessionEditModal.saving = true;
  sessionEditModal.error = '';
  try {
    const res = await fetch(api(`/api/sessions/${encodeURIComponent(sessionEditModal.id)}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        title: sessionEditModal.title.trim(),
        icon: sessionEditModal.icon,
        scenarioId: sessionEditModal.scenarioId || null
      })
    });
    if (!res.ok) throw new Error('save');
    await res.json().catch(() => null);
    closeSessionEditModal();
    await fetchScenarios();
  } catch (_) {
    sessionEditModal.error = t('sessions.edit.saveError');
  } finally {
    sessionEditModal.saving = false;
  }
};

const openSessionDeleteConfirm = () => {
  sessionConfirmModal.open = true;
  sessionConfirmModal.id = sessionEditModal.id;
  sessionConfirmModal.message = t('sessions.confirm.message');
};

const closeSessionDeleteConfirm = () => {
  sessionConfirmModal.open = false;
  sessionConfirmModal.id = '';
  sessionConfirmModal.message = '';
};

const confirmSessionDelete = async () => {
  if (!sessionConfirmModal.id) return;
  try {
    await fetch(api(`/api/sessions/${encodeURIComponent(sessionConfirmModal.id)}`), {
      method: 'DELETE',
      credentials: 'include'
    });
    closeSessionDeleteConfirm();
    closeSessionEditModal();
    await fetchScenarios();
  } catch (_) {
    sessionEditModal.error = t('sessions.edit.deleteError');
  }
};

onMounted(async () => {
  pageLoading.value = true;
  await fetchScenarios();
  pageLoading.value = false;
});
</script>
