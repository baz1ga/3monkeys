<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <div v-if="loading" class="justify-center max-w-4xl mx-auto rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-sm flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
      <div class="h-5 w-5 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
      <span>{{ t('scenes.loading') }}</span>
    </div>

    <div v-else-if="error" class="max-w-4xl mx-auto rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-900/20 dark:text-rose-100 px-4 py-3 text-sm">
      {{ error }}
    </div>

    <section v-else class="space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-3">
          <span class="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-lime-50 text-sky-500 dark:bg-lime-900/30">
            <i class="fa-solid fa-people-group text-lg"></i>
          </span>
          <div>
            <h1 class="text-2xl font-semibold text-emerald-500">{{ t('scenes.header.title') }}</h1>
            <p class="text-sm text-slate-500 dark:text-slate-200">{{ t('scenes.header.subtitle') }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="inline-flex items-center gap-2 h-10 rounded-lg border border-emerald-400 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 px-3 py-1.5 text-xs transition"
            @click="currentScene && duplicateScene(currentScene)"
            :disabled="!currentScene"
          >
            <i class="fa-regular fa-clone"></i> <span>{{ t('scenes.actions.duplicate') }}</span>
          </button>
          <button
            class="inline-flex items-center gap-2 h-10 rounded-lg bg-emerald-500 text-slate-900 font-semibold px-4 text-sm shadow-sm hover:bg-emerald-400 transition"
            @click="openSceneModal"
          >
            <i class="fa-solid fa-plus"></i> <span>{{ t('scenes.actions.add') }}</span>
          </button>
        </div>
      </div>

      <div v-if="scenes.length > 1" class="rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 shadow-sm">
        <div class="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <div
            v-for="(scene, index) in scenes"
            :key="scene.id"
            class="relative w-full min-h-[80px] rounded-lg border px-2 py-2 text-sm transition flex flex-col gap-2 overflow-hidden cursor-pointer"
            :class="scene.id === currentScene?.id
              ? 'border-emerald-400 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-100 shadow-md ring-1 ring-emerald-300/60'
              : 'border-slate-200 dark:border-gray-700 hover:border-emerald-300 hover:bg-emerald-50/40 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/20 text-slate-700 dark:text-slate-200'"
            @click="setCurrentScene(scene.id)"
          >
            <div class="min-h-[48px]">
              <div class="flex min-w-0 gap-2 items-start">
                <div class="px-2 py-0.5 rounded-bl-lg bg-emerald-500 text-white text-[11px] font-semibold shadow-sm pointer-events-none leading-none absolute top-0 right-0">
                  #<span>{{ scene.order || index + 1 }}</span>
                </div>
                <div class="flex-1 pr-9">
                  <div class="w-full text-left font-semibold leading-tight whitespace-normal">
                    <span class="block">{{ scene.title || t('scenes.fallback') }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="absolute bottom-2 right-2 flex items-center gap-1">
              <button class="h-6 w-6 inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-gray-700 text-slate-500 hover:text-emerald-600 hover:border-emerald-400 transition disabled:opacity-40 disabled:cursor-not-allowed"
                      @click.stop="moveScene(index, -1)" :disabled="index === 0">
                <i class="fa-solid fa-chevron-left"></i>
              </button>
              <button class="h-6 w-6 inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-gray-700 text-slate-500 hover:text-emerald-600 hover:border-emerald-400 transition disabled:opacity-40 disabled:cursor-not-allowed"
                      @click.stop="moveScene(index, 1)" :disabled="index === scenes.length - 1">
                <i class="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </div>
          <button
            class="h-[80px] min-h-[80px] w-full inline-flex flex-col items-center justify-center rounded-lg border border-dashed border-emerald-400 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition text-sm font-semibold"
            @click="openSceneModal"
          >
            <i class="fa-solid fa-plus text-lg"></i>
            <span class="truncate">{{ t('scenes.actions.add') }}</span>
          </button>
        </div>
      </div>

      <div v-if="currentScene" class="rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 shadow-sm space-y-4">
        <div class="flex items-center gap-3 flex-wrap border-b border-slate-200 dark:border-gray-800 pb-3">
          <div class="flex items-center gap-2">
            <h3 class="text-lg font-semibold text-emerald-600">{{ currentScene.title || t('scenes.fallback') }}</h3>
            <button class="inline-flex items-center justify-center text-sm text-slate-600 dark:text-slate-200 hover:text-slate-400 transition" @click="openSceneEditModal">
              <i class="fa-solid fa-pen"></i>
            </button>
          </div>
          <div class="flex-1 flex items-center justify-center">
            <div class="grid grid-cols-3 text-sm w-full max-w-xl">
              <button class="w-full px-4 py-3 -mb-[2px] border-b-4 font-medium transition text-center"
                      :class="activeTab === 'images' ? 'border-yellow-600 text-yellow-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-200'"
                      @click="activeTab = 'images'">
                <span class="inline-flex items-center gap-2">
                  <i class="fa-regular fa-image"></i>
                  <span>{{ t('scenes.tabs.images') }}</span>
                </span>
              </button>
              <button class="w-full px-4 py-3 -mb-[2px] border-b-4 font-medium transition text-center"
                      :class="activeTab === 'audio' ? 'border-lime-600 text-lime-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-200'"
                      @click="activeTab = 'audio'">
                <span class="inline-flex items-center gap-2">
                  <i class="fa-solid fa-music"></i>
                  <span>{{ t('scenes.tabs.audio') }}</span>
                </span>
              </button>
              <button class="w-full px-4 py-3 -mb-[2px] border-b-4 font-medium transition text-center"
                      :class="activeTab === 'notes' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-200'"
                      @click="activeTab = 'notes'">
                <span class="inline-flex items-center gap-2">
                  <i class="fa-solid fa-note-sticky"></i>
                  <span>{{ t('scenes.tabs.notes') }}</span>
                </span>
              </button>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button class="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-rose-200 dark:border-rose-900 bg-white dark:bg-gray-950 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition"
                    @click="openDeleteConfirm">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>

        <div v-if="activeTab === 'images'" class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-yellow-600">{{ t('scenes.images.title') }}</h3>
            <div class="flex items-center gap-2">
              <button class="inline-flex h-[34px] items-center gap-2 rounded-lg border border-yellow-600 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 px-3 py-1.5 text-xs transition"
                      @click="uploadModalOpen = true">
                <i class="fa-solid fa-upload"></i> <span>{{ t('scenes.images.upload') }}</span>
              </button>
            </div>
          </div>

          <div
            class="grid gap-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 pb-3"
            @dragover.prevent
            @drop.prevent="tenantDragIndex !== null && handleTenantDrop()"
          >
            <div v-if="sceneImages.length === 0" class="col-span-full border text-center border-slate-300 dark:border-gray-800 rounded-xl p-4 border-dashed text-sm text-slate-600 dark:text-slate-200">
              {{ t('scenes.images.empty') }}
            </div>
            <div
              v-for="(img, index) in sceneImages"
              :key="img.name + index"
              class="relative rounded-lg border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden aspect-square group shadow-sm"
              draggable="true"
              @dragstart="startImageDrag(index)"
              @dragover.prevent="overImageDrag(index)"
              @drop.prevent="dropImage(index)"
              :class="imageDragOver === index ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-900' : ''"
            >
              <div class="absolute inset-0">
                <img
                  v-if="findAsset(img.name)"
                  :src="assetUrl(findAsset(img.name)?.thumbUrl || findAsset(img.name)?.url)"
                  class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  :alt="t('scenes.images.title')"
                />
                <div v-else class="h-full w-full flex items-center justify-center text-xs text-slate-500">
                  {{ t('scenes.images.empty') }}
                </div>
              </div>
              <div class="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition"></div>
              <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2 text-slate-200 text-[11px] font-semibold truncate">
                {{ findAsset(img.name)?.name || img.name }}
              </div>
              <div class="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                <button class="h-8 w-8 flex items-center justify-center rounded-full bg-white/90 text-yellow-600 shadow"
                        @click.stop="removeSceneImage(index)">
                  <i class="fa-solid fa-arrow-down"></i>
                </button>
              </div>
              <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-[11px] font-semibold text-white pointer-events-none">
                {{ t('scenes.images.dragHint', 'Glisser pour déplacer') }}
              </div>
            </div>
          </div>

          <div class="space-y-3 pt-4 border-t border-dashed border-yellow-600">
            <div class="flex items-center justify-between pb-2">
              <h3 class="text-sm font-semibold text-yellow-600">{{ t('scenes.images.library') }}</h3>
              <router-link
                to="/app/gallery"
                class="inline-flex h-[34px] items-center gap-2 rounded-lg border border-yellow-600 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 px-3 py-1.5 text-xs transition"
              >
                <i class="fa-regular fa-image"></i><span>{{ t('scenes.images.openGallery', 'Ouvrir la galerie') }}</span>
              </router-link>
            </div>
            <div v-if="visibleImageAssets.length === 0" class="text-sm max-w-4xl mx-auto text-center text-slate-600 dark:text-slate-200 border border-dashed border-slate-300 dark:border-gray-800 rounded-lg p-4">
              {{ t('scenes.images.empty') }}
            </div>
            <div class="grid gap-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7" v-else>
              <div
                v-for="(asset, idx) in visibleImageAssets"
                :key="asset.id"
                class="relative rounded-lg border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden shadow-sm aspect-square group cursor-pointer"
                draggable="true"
                @dragstart="handleTenantDragStart(idx)"
                @click="addImageToScene(asset)"
              >
                <img :src="assetUrl(asset.thumbUrl || asset.url)" class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105" />
                <div class="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition"></div>
                <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2 text-slate-200 text-[11px] font-semibold truncate">
                  {{ asset.name }}
                </div>
                <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-[11px] font-semibold text-white pointer-events-none">
                  {{ t('scenes.images.associateHint', 'Cliquer pour associer') }}
                </div>
                <div class="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button class="h-8 w-8 flex items-center justify-center rounded-full bg-white/90 text-yellow-600 shadow"
                          @click.stop="openZoom(asset)">
                    <i class="fa-solid fa-magnifying-glass"></i>
                  </button>
                  <button class="h-8 w-8 flex items-center justify-center rounded-full bg-white/90 text-yellow-600 shadow"
                          @click.stop="addImageToScene(asset)">
                    <i class="fa-solid fa-arrow-up"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="activeTab === 'audio'" class="space-y-6 max-w-5xl mx-auto">
          <div class="flex items-center justify-between pb-2 mt-2">
            <h3 class="text-sm font-semibold text-lime-600">{{ t('scenes.audio.title') }}</h3>
            <div class="flex items-center gap-2">
              <label>
                <input type="file" class="hidden" multiple accept="audio/*" @change="uploadSceneAudio" />
                <span class="inline-flex h-[34px] items-center gap-2 rounded-lg border border-lime-600 text-lime-600 hover:bg-lime-50 dark:hover:bg-lime-900/20 px-3 py-1.5 text-xs transition">
                  <i class="fa-solid fa-upload"></i> <span>{{ t('scenes.audio.add') }}</span>
                </span>
              </label>
            </div>
          </div>
          <div class="space-y-3" @dragover.prevent @drop.prevent="tenantAudioDragIndex !== null && handleTenantAudioDrop()">
            <div v-if="sceneAudio.length === 0" class="text-sm max-w-4xl mx-auto text-center text-slate-600 dark:text-slate-200 border border-dashed border-slate-300 dark:border-gray-800 rounded-lg p-4">
              {{ t('scenes.audio.empty') }}
            </div>
            <div class="space-y-2 max-w-5xl mx-auto" v-else>
              <div
                v-for="(sound, idx) in sceneAudio"
                :key="sound.name + idx"
                class="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-3 transition cursor-grab"
                draggable="true"
                @dragstart="startSceneAudioDrag(idx)"
                @dragover.prevent="overSceneAudioDrag(idx)"
                @dragend="endSceneAudioDrag"
                @drop.prevent="dropSceneAudio(idx)"
                :class="[
                  sceneAudioDragOver === idx && sceneAudioDragIndex !== null ? 'ring-2 ring-lime-400 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-900 shadow-lg' : '',
                  sceneAudioDragIndex === idx ? 'opacity-80 scale-[0.99]' : ''
                ]"
              >
                <button
                  class="h-8 w-8 inline-flex items-center justify-center rounded-lg border bg-white/90 dark:bg-gray-800/90 text-slate-500 dark:text-white hover:text-lime-600 border border-slate-200 dark:border-gray-700 cursor-grab select-none"
                  :class="sceneAudioDragIndex === idx ? 'cursor-grabbing text-lime-600' : ''"
                  draggable="true"
                  @dragstart.stop="startSceneAudioDrag(idx)"
                  @dragend.stop="endSceneAudioDrag"
                >
                  <i class="fa-solid fa-grip-vertical text-sm"></i>
                </button>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-semibold truncate">{{ findAudio(sound.name)?.name || sound.name }}</div>
                </div>
                <audio :src="assetUrl(findAudio(sound.name)?.url)" controls class="w-80 h-10" v-if="findAudio(sound.name)?.url"></audio>
                <button class="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-rose-200 dark:border-rose-900 bg-white dark:bg-gray-950 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition"
                        @click.stop="removeSceneAudio(idx)">
                  <i class="fa-solid fa-arrow-down"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="space-y-3 pt-4 border-t border-dashed border-lime-600">
            <div class="flex items-center justify-between pb-2">
              <h3 class="text-sm font-semibold text-lime-600">{{ t('scenes.audio.library') }}</h3>
              <router-link
                to="/app/audio"
                class="inline-flex h-[34px] items-center gap-2 rounded-lg border border-lime-600 text-lime-600 hover:bg-lime-50 dark:hover:bg-lime-900/20 px-3 py-1.5 text-xs transition"
              >
                <i class="fa-solid fa-music text-base"></i>
                <span>{{ t('scenes.audio.open') }}</span>
              </router-link>
            </div>
            <div v-if="visibleAudioAssets.length === 0" class="text-sm max-w-4xl mx-auto text-center text-slate-600 dark:text-slate-200 border border-dashed border-slate-300 dark:border-gray-800 rounded-lg p-4">
              {{ t('scenes.audio.empty') }}
            </div>
            <div class="flex flex-col gap-2 max-w-5xl mx-auto" v-else>
              <div
                v-for="(audio, idx) in visibleAudioAssets"
                :key="audio.id"
                class="group flex items-center gap-3 rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-3 shadow-sm"
                draggable="true"
                @dragstart="handleTenantAudioDragStart(idx)"
              >
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-semibold truncate">{{ audio.name }}</div>
                </div>
                <audio :src="assetUrl(audio.url)" controls class="w-80 h-10"></audio>
                <button class="h-9 w-9 inline-flex items-center justify-center rounded-lg bg-white dark:bg-gray-800 border border-lime-500 text-lime-600 hover:bg-lime-50 dark:hover:bg-lime-900/20 transition"
                        @click.stop="addAudioToScene(audio)">
                  <i class="fa-solid fa-arrow-up"></i>
                </button>
              </div>
              <div class="text-xs max-w-5xl mx-auto" :class="audioUploadStatus === 'error' ? 'text-rose-500' : 'text-emerald-600'">
                {{ audioUploadMessage }}
              </div>
            </div>
          </div>
        </div>

        <div v-else class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-sky-600">{{ t('scenes.notes.title') }}</h3>
            <button class="inline-flex h-[34px] items-center gap-2 rounded-lg border border-sky-600 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 px-3 py-1.5 text-xs transition"
                    @click="saveNotes">
              <i class="fa-solid fa-floppy-disk"></i> <span>{{ t('scenes.notes.save') }}</span>
            </button>
          </div>
          <textarea
            v-model="notesBuffer"
            class="w-full min-h-[260px] rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            :placeholder="t('scenes.notes.placeholder')"
          ></textarea>
        </div>
      </div>
    </section>

    <UploadModal v-model="uploadModalOpen" :allow-multiple="true" context="gallery" :on-files-selected="handleUploadFiles" />

    <div class="fixed inset-0 z-50 flex items-center justify-center px-4" v-show="zoomModal.open" @keydown.escape.window="closeZoom">
      <div class="fixed inset-0 bg-black/70" @click="closeZoom"></div>
      <div class="relative max-w-5xl w-full">
        <img :src="zoomModal.url" :alt="zoomModal.name" class="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl" />
      </div>
    </div>

    <div class="fixed inset-0 z-50 flex items-center justify-center px-4" v-show="sceneModal.open">
      <div class="fixed inset-0 bg-slate-900/60" @click="closeSceneModal"></div>
      <div class="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-2xl space-y-4">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">{{ t('scenes.create.title') }}</h3>
        <input
          v-model="sceneModal.title"
          type="text"
          class="w-full rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
          :placeholder="t('scenes.create.placeholder')"
        />
        <div v-if="sceneModal.error" class="text-sm text-rose-600">{{ sceneModal.error }}</div>
        <div class="flex justify-end gap-2">
          <button class="px-4 py-2 rounded-lg border border-slate-200 dark:border-gray-700 text-sm" @click="closeSceneModal">
            {{ t('common.cancel') }}
          </button>
          <button class="px-4 py-2 rounded-lg bg-emerald-500 text-slate-900 text-sm font-semibold" @click="submitScene">
            {{ t('common.save') }}
          </button>
        </div>
      </div>
    </div>

    <div class="fixed inset-0 z-50 flex items-center justify-center px-4" v-show="sceneEditModal.open">
      <div class="fixed inset-0 bg-slate-900/60" @click="closeSceneEditModal"></div>
      <div class="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-2xl space-y-4">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">{{ t('scenes.edit.title') }}</h3>
        <input
          v-model="sceneEditModal.title"
          type="text"
          class="w-full rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
          :placeholder="t('scenes.edit.placeholder')"
        />
        <div v-if="sceneEditModal.error" class="text-sm text-rose-600">{{ sceneEditModal.error }}</div>
        <div class="flex justify-end gap-2">
          <button class="px-4 py-2 rounded-lg border border-slate-200 dark:border-gray-700 text-sm" @click="closeSceneEditModal">
            {{ t('common.cancel') }}
          </button>
          <button class="px-4 py-2 rounded-lg bg-emerald-500 text-slate-900 text-sm font-semibold" @click="submitSceneEdit">
            {{ t('common.save') }}
          </button>
        </div>
      </div>
    </div>

    <div class="fixed inset-0 z-50 flex items-center justify-center px-4" v-show="confirmOpen">
      <div class="fixed inset-0 bg-slate-900/60" @click="closeDeleteConfirm"></div>
      <div class="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-2xl space-y-4">
        <div class="flex items-start gap-3">
          <div class="h-10 w-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div class="space-y-1">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">{{ t('scenes.delete.title') }}</h3>
            <p class="text-sm text-slate-600 dark:text-slate-300">{{ t('scenes.delete.message') }}</p>
          </div>
        </div>
        <div class="flex justify-end gap-2">
          <button class="px-4 py-2 rounded-lg border border-slate-200 dark:border-gray-700 text-sm" @click="closeDeleteConfirm">
            {{ t('common.cancel') }}
          </button>
          <button class="px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold" @click="deleteScene">
            {{ t('common.delete') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import UploadModal from '../components/modals/UploadModal.vue';

type Asset = { id: string; name: string; url: string; thumbUrl?: string | null; hidden?: boolean };
type SceneAsset = { name: string; order?: number };
type Scene = {
  id: string;
  title: string;
  order: number;
  images?: SceneAsset[] | null;
  audio?: SceneAsset[] | null;
  notes?: string | null;
};

const { t } = useI18n();
const route = useRoute();
const sessionId = computed(() => route.params.id as string);

const loading = ref(true);
const error = ref('');
const session = ref<{ id: string; title: string } | null>(null);
const scenes = ref<Scene[]>([]);
const currentSceneId = ref('');
const activeTab = ref<'images' | 'audio' | 'notes'>('images');
const notesBuffer = ref('');
const noteLoading = ref(false);

const imageAssets = ref<Asset[]>([]);
const audioAssets = ref<Asset[]>([]);
const uploadModalOpen = ref(false);
const zoomModal = ref<{ open: boolean; url: string; name: string }>({ open: false, url: '', name: '' });

const sceneModal = ref({ open: false, title: '', error: '' });
const sceneEditModal = ref({ open: false, title: '', error: '' });
const confirmOpen = ref(false);

const currentScene = computed(() => scenes.value.find(s => s.id === currentSceneId.value) || scenes.value[scenes.value.length - 1] || null);
const sceneImages = computed(() => normalizeAssets(currentScene.value?.images));
const sceneAudio = computed(() => normalizeAssets(currentScene.value?.audio));
const visibleImageAssets = computed(() => imageAssets.value.filter(asset => !asset.hidden));
const visibleAudioAssets = computed(() => audioAssets.value.filter(asset => !asset.hidden));
const imageDragIndex = ref<number | null>(null);
const imageDragOver = ref<number | null>(null);
const tenantDragIndex = ref<number | null>(null);
const sceneAudioDragIndex = ref<number | null>(null);
const sceneAudioDragOver = ref<number | null>(null);
const tenantAudioDragIndex = ref<number | null>(null);
const audioUploadMessage = ref('');
const audioUploadStatus = ref<'ok' | 'error'>('ok');

const assetUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `http://localhost:3100${url}`;
};

const normalizeAssets = (value?: SceneAsset[] | null) => {
  if (!Array.isArray(value)) return [];
  return value.map((item, idx) => ({ name: item.name, order: item.order ?? idx + 1 }));
};

const findAsset = (name: string) => imageAssets.value.find(a => a.url === name || a.name === name || a.url.includes(name));
const findAudio = (name: string) => audioAssets.value.find(a => a.url.includes(name) || a.name === name);

const fetchSession = async () => {
  const res = await fetch(`http://localhost:3100/api/sessions/${encodeURIComponent(sessionId.value)}`, { credentials: 'include' });
  if (!res.ok) throw new Error('session');
  session.value = await res.json();
};

const fetchScenes = async () => {
  const res = await fetch(`http://localhost:3100/api/scenes?sessionId=${encodeURIComponent(sessionId.value)}`, { credentials: 'include' });
  if (!res.ok) throw new Error('scenes');
  const list = await res.json();
  scenes.value = Array.isArray(list) ? list : [];
  const requestedScene = route.query.scene as string | undefined;
  if (requestedScene && scenes.value.some(scene => scene.id === requestedScene)) {
    currentSceneId.value = requestedScene;
  }
  if (!currentSceneId.value && scenes.value.length) {
    currentSceneId.value = scenes.value[scenes.value.length - 1].id;
  }
  if (currentScene.value) {
    await loadNoteForScene(currentScene.value);
  }
};

const fetchAssets = async () => {
  const [imagesRes, audioRes] = await Promise.all([
    fetch('http://localhost:3100/api/assets?type=image', { credentials: 'include' }),
    fetch('http://localhost:3100/api/assets?type=audio', { credentials: 'include' })
  ]);
  imageAssets.value = imagesRes.ok ? await imagesRes.json() : [];
  audioAssets.value = audioRes.ok ? await audioRes.json() : [];
};

const setCurrentScene = (id: string) => {
  currentSceneId.value = id;
  activeTab.value = 'images';
  loadNoteForScene(currentScene.value);
};

const loadNoteForScene = async (scene: Scene | null) => {
  noteLoading.value = true;
  try {
    if (!scene?.notes) {
      notesBuffer.value = '';
      return;
    }
    const res = await fetch(`http://localhost:3100/api/notes/${encodeURIComponent(scene.notes)}`, { credentials: 'include' });
    if (!res.ok) {
      notesBuffer.value = scene.notes || '';
      return;
    }
    const data = await res.json();
    notesBuffer.value = data?.content ?? '';
  } catch {
    notesBuffer.value = scene?.notes || '';
  } finally {
    noteLoading.value = false;
  }
};

const startImageDrag = (index: number) => {
  imageDragIndex.value = index;
};

const overImageDrag = (index: number) => {
  if (imageDragIndex.value === null || imageDragIndex.value === index) return;
  imageDragOver.value = index;
};

const dropImage = async (index: number) => {
  if (imageDragIndex.value === null) return;
  const list = normalizeAssets(currentScene.value?.images);
  if (index === imageDragIndex.value) {
    imageDragIndex.value = null;
    imageDragOver.value = null;
    return;
  }
  const [item] = list.splice(imageDragIndex.value, 1);
  list.splice(index, 0, item);
  imageDragIndex.value = null;
  imageDragOver.value = null;
  await updateSceneAssets({ images: list.map((it, idx) => ({ ...it, order: idx + 1 })) });
};

const handleTenantDragStart = (index: number) => {
  tenantDragIndex.value = index;
};

const handleTenantDrop = async () => {
  if (tenantDragIndex.value === null) return;
  const asset = visibleImageAssets.value[tenantDragIndex.value];
  tenantDragIndex.value = null;
  if (asset) {
    await addImageToScene(asset);
  }
};

const startSceneAudioDrag = (index: number) => {
  sceneAudioDragIndex.value = index;
};

const overSceneAudioDrag = (index: number) => {
  if (sceneAudioDragIndex.value === null || sceneAudioDragIndex.value === index) return;
  sceneAudioDragOver.value = index;
};

const endSceneAudioDrag = () => {
  sceneAudioDragIndex.value = null;
  sceneAudioDragOver.value = null;
};

const dropSceneAudio = async (index: number) => {
  if (sceneAudioDragIndex.value === null) return;
  const list = normalizeAssets(currentScene.value?.audio);
  const [item] = list.splice(sceneAudioDragIndex.value, 1);
  list.splice(index, 0, item);
  sceneAudioDragIndex.value = null;
  sceneAudioDragOver.value = null;
  await updateSceneAssets({ audio: list.map((it, idx) => ({ ...it, order: idx + 1 })) });
};

const handleTenantAudioDragStart = (index: number) => {
  tenantAudioDragIndex.value = index;
};

const handleTenantAudioDrop = async () => {
  if (tenantAudioDragIndex.value === null) return;
  const asset = visibleAudioAssets.value[tenantAudioDragIndex.value];
  tenantAudioDragIndex.value = null;
  if (asset) {
    await addAudioToScene(asset);
  }
};

const openZoom = (asset: Asset) => {
  zoomModal.value = {
    open: true,
    url: assetUrl(asset.url),
    name: asset.name
  };
};

const closeZoom = () => {
  zoomModal.value = { open: false, url: '', name: '' };
};

const openSceneModal = () => {
  sceneModal.value = { open: true, title: '', error: '' };
};

const closeSceneModal = () => {
  sceneModal.value.open = false;
};

const submitScene = async () => {
  if (!sceneModal.value.title.trim()) {
    sceneModal.value.error = t('scenes.errors.titleRequired');
    return;
  }
  const res = await fetch('http://localhost:3100/api/scenes', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: sceneModal.value.title.trim(), sessionId: sessionId.value })
  });
  if (!res.ok) {
    sceneModal.value.error = t('scenes.errors.create');
    return;
  }
  const created = await res.json();
  await fetchScenes();
  closeSceneModal();
  if (created?.id) setCurrentScene(created.id);
};

const openSceneEditModal = () => {
  if (!currentScene.value) return;
  sceneEditModal.value = { open: true, title: currentScene.value.title || '', error: '' };
};

const closeSceneEditModal = () => {
  sceneEditModal.value.open = false;
};

const submitSceneEdit = async () => {
  if (!currentScene.value) return;
  if (!sceneEditModal.value.title.trim()) {
    sceneEditModal.value.error = t('scenes.errors.titleRequired');
    return;
  }
  const res = await fetch(`http://localhost:3100/api/scenes/${encodeURIComponent(currentScene.value.id)}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: sceneEditModal.value.title.trim() })
  });
  if (!res.ok) {
    sceneEditModal.value.error = t('scenes.errors.update');
    return;
  }
  await fetchScenes();
  closeSceneEditModal();
};

const openDeleteConfirm = () => {
  confirmOpen.value = true;
};

const closeDeleteConfirm = () => {
  confirmOpen.value = false;
};

const deleteScene = async () => {
  if (!currentScene.value) return;
  await fetch(`http://localhost:3100/api/scenes/${encodeURIComponent(currentScene.value.id)}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  closeDeleteConfirm();
  await fetchScenes();
  if (scenes.value.length) setCurrentScene(scenes.value[scenes.value.length - 1].id);
};

const duplicateScene = async (scene: Scene) => {
  const res = await fetch('http://localhost:3100/api/scenes', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: `${scene.title || t('scenes.fallback')} (${t('scenes.actions.copySuffix')})`,
      sessionId: sessionId.value,
      images: normalizeAssets(scene.images),
      audio: normalizeAssets(scene.audio),
      notes: scene.notes || null
    })
  });
  if (!res.ok) return;
  const created = await res.json();
  await fetchScenes();
  if (created?.id) setCurrentScene(created.id);
};

const moveScene = async (index: number, dir: number) => {
  const target = index + dir;
  if (target < 0 || target >= scenes.value.length) return;
  const arr = [...scenes.value];
  const [item] = arr.splice(index, 1);
  arr.splice(target, 0, item);
  scenes.value = arr.map((scene, i) => ({ ...scene, order: i + 1 }));
  currentSceneId.value = item.id;
  await Promise.all(
    scenes.value.map(scene =>
      fetch(`http://localhost:3100/api/scenes/${encodeURIComponent(scene.id)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: scene.order })
      })
    )
  );
};

const updateSceneAssets = async (payload: Partial<Pick<Scene, 'images' | 'audio' | 'notes'>>) => {
  if (!currentScene.value) return;
  await fetch(`http://localhost:3100/api/scenes/${encodeURIComponent(currentScene.value.id)}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  await fetchScenes();
};

const addImageToScene = async (asset: Asset) => {
  const list = normalizeAssets(currentScene.value?.images);
  list.push({ name: asset.url, order: list.length + 1 });
  await updateSceneAssets({ images: list });
};

const removeSceneImage = async (index: number) => {
  const list = normalizeAssets(currentScene.value?.images);
  list.splice(index, 1);
  await updateSceneAssets({ images: list.map((item, idx) => ({ ...item, order: idx + 1 })) });
};

const moveSceneImage = async (index: number, dir: number) => {
  const list = normalizeAssets(currentScene.value?.images);
  const target = index + dir;
  if (target < 0 || target >= list.length) return;
  const [item] = list.splice(index, 1);
  list.splice(target, 0, item);
  await updateSceneAssets({ images: list.map((it, idx) => ({ ...it, order: idx + 1 })) });
};

const addAudioToScene = async (asset: Asset) => {
  const list = normalizeAssets(currentScene.value?.audio);
  if (list.find(item => item.name === asset.url || item.name === asset.name)) return;
  list.push({ name: asset.url, order: list.length + 1 });
  await updateSceneAssets({ audio: list });
};

const removeSceneAudio = async (index: number) => {
  const list = normalizeAssets(currentScene.value?.audio);
  list.splice(index, 1);
  await updateSceneAssets({ audio: list.map((item, idx) => ({ ...item, order: idx + 1 })) });
};

const moveSceneAudio = async (index: number, dir: number) => {
  const list = normalizeAssets(currentScene.value?.audio);
  const target = index + dir;
  if (target < 0 || target >= list.length) return;
  const [item] = list.splice(index, 1);
  list.splice(target, 0, item);
  await updateSceneAssets({ audio: list.map((it, idx) => ({ ...it, order: idx + 1 })) });
};

const uploadSceneAudio = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files || []);
  if (!files.length) return;
  audioUploadMessage.value = '';
  audioUploadStatus.value = 'ok';
  try {
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('http://localhost:3100/api/assets/audio/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      if (!res.ok) throw new Error('upload');
    }
    await fetchAssets();
    audioUploadMessage.value = t('scenes.audio.uploadSuccess');
  } catch {
    audioUploadStatus.value = 'error';
    audioUploadMessage.value = t('scenes.audio.uploadError');
  } finally {
    input.value = '';
  }
};

const saveNotes = async () => {
  if (!currentScene.value) return;
  const content = notesBuffer.value ?? '';
  const existingNoteId = currentScene.value.notes || '';
  try {
    if (existingNoteId) {
      const updateRes = await fetch(`http://localhost:3100/api/notes/${encodeURIComponent(existingNoteId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content })
      });
      if (updateRes.ok) {
        return;
      }
    }
    if (!content.trim()) {
      await updateSceneAssets({ notes: null });
      notesBuffer.value = '';
      return;
    }
    const createRes = await fetch('http://localhost:3100/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title: currentScene.value.title || t('scenes.fallback'), content })
    });
    if (!createRes.ok) throw new Error('note');
    const created = await createRes.json();
    await updateSceneAssets({ notes: created?.id || null });
  } catch {
    // noop
  }
};

const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('http://localhost:3100/api/assets/upload', {
    method: 'POST',
    credentials: 'include',
    body: formData
  });
  if (!res.ok) throw new Error('upload');
  return res.json().catch(() => null);
};

const handleUploadFiles = async (files: File[]) => {
  if (!files.length) return false;
  try {
    const uploaded = [];
    for (const file of files) {
      const asset = await uploadFile(file);
      if (asset?.url) uploaded.push(asset);
    }
    await fetchAssets();
    if (uploaded.length) {
      for (const asset of uploaded) {
        await addImageToScene(asset);
      }
    }
    return true;
  } catch {
    return false;
  }
};

onMounted(async () => {
  loading.value = true;
  try {
    await Promise.all([fetchSession(), fetchScenes(), fetchAssets()]);
    if (currentScene.value) {
      await loadNoteForScene(currentScene.value);
    }
  } catch {
    error.value = t('scenes.errors.load');
  } finally {
    loading.value = false;
  }
});

watch(sessionId, async () => {
  loading.value = true;
  error.value = '';
  currentSceneId.value = '';
  activeTab.value = 'images';
  notesBuffer.value = '';
  try {
    await Promise.all([fetchSession(), fetchScenes()]);
    if (currentScene.value) {
      await loadNoteForScene(currentScene.value);
    }
  } catch {
    error.value = t('scenes.errors.load');
  } finally {
    loading.value = false;
  }
});
</script>
