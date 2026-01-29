<template>
  <div class="gm-mode-root">
    <div class="max-w-6xl mx-auto space-y-4">
      <div class="fixed bottom-6 right-6 z-60" v-show="!scenarDeckOpen">
        <button class="inline-flex items-center gap-2 rounded-full bg-indigo-500 text-white px-4 py-2 shadow-lg hover:bg-indigo-400 transition"
                @click="scenarDeckOpen = true">
          <i class="fa-solid fa-th-large"></i>
          <span>{{ t('gm.scenarDeck', 'ScenarDeck') }}</span>
        </button>
      </div>

      <div v-show="scenarDeckOpen" class="fixed inset-0 z-50 flex items-end justify-end px-4 pb-6 pointer-events-none">
        <div class="relative bg-white dark:bg-gray-950 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-2xl w-full max-w-xs p-5 space-y-4 z-10 pointer-events-auto">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-300">
              <i class="fa-solid fa-th-large"></i>
              <span>{{ t('gm.scenarDeck', 'ScenarDeck') }}</span>
            </h3>
            <button class="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    @click="scenarDeckOpen = false"
                    :aria-label="t('gm.closeScenarDeck', 'Close ScenarDeck')"
                    :title="t('gm.closeScenarDeck', 'Close ScenarDeck')">
              <i class="fa-solid fa-minus"></i>
            </button>
          </div>
          <div class="grid grid-cols-3 grid-rows-3 gap-x-3 gap-y-3 justify-items-center">
            <button class="h-[72px] w-[72px] inline-flex flex-col items-center justify-center gap-1 rounded-lg border bg-white dark:bg-gray-800 text-sm font-semibold transition"
                    @click="toggleTimer"
                    :disabled="!frontOnline"
                    :class="[
                      timerRunning ? 'border-red-600 bg-red-50 text-red-700 hover:bg-red-100' : 'border-slate-300 dark:border-gray-700 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800',
                      (!frontOnline && !timerRunning) ? 'opacity-50 cursor-not-allowed' : ''
                    ]">
              <i :class="timerRunning ? 'fa-solid fa-stopwatch text-red-700 text-xl' : 'fa-solid fa-stopwatch text-xl text-indigo-600'"></i>
              <span class="text-[12px]">{{ timerRunning ? t('gm.timer.stop', 'Stop') : t('gm.timer.start', 'Timer') }}</span>
            </button>
            <button class="h-[72px] w-[72px] inline-flex flex-col items-center justify-center gap-1 rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-lg font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    :style="tensionButtonStyle(1)"
                    @click="changeTension(1)"
                    :disabled="!tensionEnabled"
                    :class="!tensionEnabled ? 'opacity-50 cursor-not-allowed' : ''">
              <span class="text-[18px] font-extrabold">{{ tensionButtonLabel(1) }}</span>
            </button>
            <button class="h-[72px] w-[72px] inline-flex flex-col items-center justify-center gap-1 rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    @click="resetTimer">
              <i class="fa-solid fa-stopwatch-20 text-xl"></i>
              <span class="text-[12px]">{{ t('gm.timer.reset', 'Reset') }}</span>
            </button>
            <button class="h-[72px] w-[72px] inline-flex flex-col items-center justify-center gap-1 rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    @click="prevSlide"
                    :disabled="slideshowImages.length === 0">
              <i class="fa-solid fa-chevron-left text-xl"></i>
              <span class="text-[12px]">{{ t('gm.slide.prev', 'Slide -') }}</span>
            </button>
            <button class="h-[72px] w-[72px] inline-flex flex-col items-center justify-center gap-1 rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-lg font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    :style="tensionButtonStyle(-1)"
                    @click="changeTension(-1)"
                    :disabled="!tensionEnabled"
                    :class="!tensionEnabled ? 'opacity-50 cursor-not-allowed' : ''">
              <span class="text-[18px] font-extrabold">{{ tensionButtonLabel(-1) }}</span>
            </button>
            <button class="h-[72px] w-[72px] inline-flex flex-col items-center justify-center gap-1 rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    @click="nextSlide"
                    :disabled="slideshowImages.length === 0 && !hasNextScene">
              <i class="fa-solid fa-chevron-right text-xl"></i>
              <span class="text-[12px]">{{ t('gm.slide.next', 'Slide +') }}</span>
            </button>
            <button class="h-[72px] w-[72px] inline-flex flex-col items-center justify-center gap-1 rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    @click="playOrResetHourglass"
                    :disabled="!frontOnline"
                    :class="!frontOnline ? 'opacity-50 cursor-not-allowed' : ''">
              <i class="fa-solid fa-hourglass-half text-indigo-500"></i>
              <span class="text-[12px] text-indigo-500">{{ hourglassButtonLabel() }}</span>
            </button>
            <button class="h-[72px] w-[72px] inline-flex flex-col items-center justify-center gap-1 rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    @click="openHourglassModal"
                    :disabled="hourglassRunning || hourglassVisible"
                    :class="(hourglassRunning || hourglassVisible) ? 'opacity-50 cursor-not-allowed' : ''">
              <i class="fa-solid fa-hourglass-start text-indigo-500"></i>
              <span class="text-[12px] text-indigo-500">{{ hourglassDisplay() }}</span>
            </button>
            <button class="h-[72px] w-[72px] inline-flex flex-col items-center justify-center gap-1 rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    @click="toggleHourglassVisibility"
                    :disabled="!frontOnline"
                    :class="!frontOnline ? 'opacity-50 cursor-not-allowed' : ''">
              <i class="fa-solid text-indigo-500" :class="hourglassVisible ? 'fa-hourglass-half' : 'fa-hourglass'"></i>
              <span class="text-[12px] text-indigo-500">{{ hourglassVisible ? t('gm.hourglass.toggleHide', 'Masquer') : t('gm.hourglass.toggleShow', 'Afficher') }}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between gap-3 mt-1">
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100 inline-flex items-center gap-2">
          <router-link v-if="scenarioTitle" to="/app/scenarios" class="text-indigo-500 hover:text-indigo-400 font-semibold">
            {{ scenarioTitle }}
          </router-link>
          <span v-if="scenarioTitle" class="text-slate-400">›</span>
          <span>{{ currentSession?.title || selectedSessionId || t('gm.header.sessionFallback', 'Session') }}</span>
        </h1>
        <div class="flex items-center gap-3">
          <div class="inline-flex items-center gap-3 px-4 py-2 rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-base font-mono font-semibold shadow-sm"
               :class="timerRunning ? 'text-indigo-600' : 'text-slate-700 dark:text-slate-100'">
            <i :class="timerRunning ? 'fa-solid fa-stopwatch text-red-500 text-lg' : 'fa-solid fa-stopwatch text-indigo-500 text-lg'"></i>
            <span class="tracking-tight">{{ timerDisplay }}</span>
          </div>
          <div class="flex items-center gap-2" v-show="selectedSessionId">
            <button class="inline-flex items-center gap-2 rounded-lg border font-semibold px-4 py-2 text-sm transition"
                    :class="frontOnline || !slideshowImages.length ? 'border-slate-300 bg-slate-100 text-slate-400 cursor-not-allowed' : 'border-indigo-500 bg-indigo-500 text-white hover:bg-indigo-400 dark:bg-gray-800 dark:border-indigo-500 dark:text-indigo-100 dark:hover:bg-slate-800'"
                    @click="openFront"
                    :disabled="frontOnline || !slideshowImages.length">
              <i class="fa-solid fa-film"></i>
              <span>{{ t('gm.header.present', 'Présenter') }}</span>
            </button>
            <span class="inline-flex items-center" :title="frontOnline ? t('gm.front.online','Joueurs connectés') : t('gm.front.offline','Joueurs déconnectés')">
              <span class="h-2.5 w-2.5 rounded-full" :class="frontOnline ? 'bg-rose-500' : 'bg-emerald-500'"></span>
            </span>
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 shadow-sm space-y-3 w-full" v-show="scenes.length !== 1">
        <div class="flex items-center gap-2">
          <i class="fa-solid fa-clapperboard text-indigo-500"></i>
          <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 leading-none mt-1">{{ t('gm.scenes.title', 'Scènes') }}</h3>
        </div>
        <p v-if="scenes.length === 0" class="text-sm text-slate-500 dark:text-slate-200">{{ t('gm.scenes.empty', 'Aucune scène') }}</p>
        <div class="flex flex-wrap gap-3 w-full" v-show="scenes.length <= 5">
          <div v-for="(scene, index) in scenes" :key="scene.id" class="flex items-center gap-2">
            <div class="relative w-[185px] min-h-[80px] max-h-[80px] rounded-lg border px-2 py-2 text-sm transition flex flex-col gap-2 overflow-hidden cursor-pointer"
                 :class="scene.id === selectedSceneId
                   ? 'border-indigo-400 bg-indigo-50 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-100 shadow-md ring-1 ring-indigo-300/60'
                   : 'border-slate-200 dark:border-gray-700 hover:border-indigo-300 hover:bg-indigo-50/40 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/20 text-slate-700 dark:text-slate-200'"
                 role="button"
                 tabindex="0"
                 @click="selectScene(scene.id)"
                 @keydown.enter.prevent="selectScene(scene.id)"
                 @keydown.space.prevent="selectScene(scene.id)">
              <div class="min-h-[48px]">
                <div class="flex min-w-0 gap-2 items-start">
                  <div class="px-2 py-0.5 rounded-bl-lg bg-slate-900/80 text-white text-[11px] font-semibold shadow-sm pointer-events-none leading-none absolute top-0 right-0">#{{ scene.order || index + 1 }}</div>
                  <div class="flex-1 pr-9">
                    <div class="w-full text-left font-semibold leading-tight whitespace-normal">
                      <span class="block">{{ scene.title || t('gm.scenes.untitled', 'Scène') }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="index < scenes.length - 1" class="text-slate-400 dark:text-slate-600 px-1 shrink-0">
              <i class="fa-solid fa-angles-right text-xl"></i>
            </div>
          </div>
        </div>

        <div class="w-full" v-show="scenes.length > 5">
          <div class="flex items-center gap-2 w-full">
            <button class="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-gray-700 text-slate-500 hover:text-indigo-600 hover:border-indigo-400 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    :disabled="sceneCarouselIndex === 0"
                    @click="carouselPrev">
              <i class="fa-solid fa-chevron-left"></i>
            </button>
            <div class="overflow-hidden flex-1 w-full">
              <div class="flex items-center gap-3 w-full"
                   :style="`transform: translateX(-${sceneCarouselIndex * 25}%); transition: transform 200ms ease;`">
                <div v-for="(scene, index) in scenes" :key="scene.id" class="flex items-center gap-2 shrink-0 basis-1/5 min-w-[200px]">
                  <div class="relative w-[185px] min-h-[80px] max-h-[80px] rounded-lg border px-2 py-2 text-sm transition flex flex-col gap-2 overflow-hidden cursor-pointer"
                       :class="scene.id === selectedSceneId
                         ? 'border-indigo-400 bg-indigo-50 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-100 shadow-md ring-1 ring-indigo-300/60'
                         : 'border-slate-200 dark:border-gray-700 hover:border-indigo-300 hover:bg-indigo-50/40 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/20 text-slate-700 dark:text-slate-200'"
                       role="button"
                       tabindex="0"
                       @click="selectScene(scene.id)"
                       @keydown.enter.prevent="selectScene(scene.id)"
                       @keydown.space.prevent="selectScene(scene.id)">
                    <div class="min-h-[48px]">
                      <div class="flex min-w-0 gap-2 items-start">
                        <div class="px-2 py-0.5 rounded-bl-lg bg-slate-900/80 text-white text-[11px] font-semibold shadow-sm pointer-events-none leading-none absolute top-0 right-0">#{{ scene.order || index + 1 }}</div>
                        <div class="flex-1 pr-9">
                          <div class="w-full text-left font-semibold leading-tight whitespace-normal">
                            <span class="block">{{ scene.title || t('gm.scenes.untitled', 'Scène') }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-if="index < scenes.length - 1" class="text-slate-400 dark:text-slate-600 px-1 shrink-0">
                    <i class="fa-solid fa-angles-right text-xl"></i>
                  </div>
                </div>
              </div>
            </div>
            <button class="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-gray-700 text-slate-500 hover:text-indigo-600 hover:border-indigo-400 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    :disabled="sceneCarouselIndex >= Math.max(0, scenes.length - 5)"
                    @click="carouselNext">
              <i class="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="grid gap-4">
        <section class="space-y-4">
          <div class="grid gap-4 md:grid-cols-[1fr_500px]">
            <div class="rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-3 shadow-sm space-y-3 notes-editor">
              <h2 class="text-xl font-semibold inline-flex items-center gap-2 pl-2">
                <i class="fa-solid fa-note-sticky text-indigo-500"></i>
                <span>{{ t('gm.notes.title', 'Notes de la scène') }}</span>
              </h2>
              <textarea :placeholder="t('gm.notes.placeholder', 'Vos notes pour cette scène...')" class="w-full" v-model="notesBuffer"></textarea>
            </div>
            <div>
              <div v-if="tensionEnabled" class="rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-2 shadow-sm transition h-[62px] flex items-center"
                   :style="selectedTension ? `background:${tensionLevels.find(l=>l.key===selectedTension)?.color || ''}22; border-color:${tensionLevels.find(l=>l.key===selectedTension)?.color || ''}` : ''">
                <div class="flex flex-wrap items-center gap-3">
                  <h3 class="text-lg font-semibold inline-flex items-center gap-2">
                    <i class="fa-solid fa-bolt text-indigo-500"></i>
                    <span>{{ t('gm.tension.title', 'Tension') }}</span>
                  </h3>
                  <div class="flex flex-wrap items-center gap-2">
                    <div v-for="level in tensionLevels" :key="level.key"
                         class="inline-flex items-center gap-3 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap cursor-pointer transition"
                         :style="`background:${level.color}; border:1px solid ${level.color}; color:${level.textColor};`"
                         :class="selectedTension === level.key ? 'ring-2 ring-offset-1 ring-indigo-400 dark:ring-indigo-500/80 shadow-md scale-[1.03]' : ''"
                         @click="playTension(level.key)">
                      <span>{{ level.label }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-3 rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 shadow-sm space-y-2 h-[195px] overflow-hidden">
                <div class="flex items-center justify-between gap-2">
                  <h3 class="text-lg font-semibold inline-flex items-center gap-2">
                    <i class="fa-solid fa-image text-indigo-500"></i>
                    <span>{{ t('gm.slideshow.title', 'Diaporama') }}</span>
                  </h3>
                </div>
                <p v-if="slideshowLoading" class="text-sm text-slate-500 dark:text-slate-200">{{ t('gm.slideshow.loading', 'Chargement des images...') }}</p>
                <p v-else-if="slideshowError" class="text-sm text-rose-500">{{ slideshowError }}</p>
                <p v-else-if="slideshowImages.length === 0 && !hasNextScene" class="text-sm text-slate-500 dark:text-slate-200">{{ t('gm.slideshow.empty', 'Aucune image disponible.') }}</p>
                <div v-else-if="slideshowImages.length === 0 && hasNextScene" class="grid grid-cols-3 gap-3 items-center h-[120px]">
                  <div></div>
                  <div class="flex flex-col justify-center">
                    <div class="relative rounded-lg border border-indigo-400 dark:border-indigo-500 overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-700 text-white cursor-pointer max-h-[80px] min-h-[80px] w-[185px] px-3"
                         @click="nextSlide"
                         :title="t('gm.slideshow.nextScene', 'Passer à la scène suivante')">
                      <div class="h-full w-full flex flex-col items-center justify-center text-center leading-tight font-semibold">
                        <div class="text-[17px] pt-[23px]">{{ t('gm.slideshow.nextScene', 'Passer à la scène suivante') }}</div>
                      </div>
                    </div>
                  </div>
                  <div></div>
                </div>
                <div v-else class="grid grid-cols-3 gap-3 items-center h-[120px]">
                  <div class="flex flex-col justify-center">
                    <div v-if="prevSlideObj" class="relative rounded-lg border border-slate-200 dark:border-gray-800 overflow-hidden bg-slate-100 dark:bg-slate-800 opacity-80 cursor-pointer max-h-[90px]"
                         @click="prevSlide"
                         :title="t('gm.slideshow.prevImage', 'Aller à l\'image précédente')">
                      <img class="w-full h-full object-cover" :src="prevSlideObj.displayUrl || prevSlideObj.url" :alt="prevSlideObj.name || t('gm.slideshow.prevAlt', 'Image précédente')">
                      <div v-if="prevSlideObj.order" class="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-white/80 text-[11px] font-semibold text-slate-700 shadow-sm">#{{ prevSlideObj.order }}</div>
                    </div>
                  </div>
                  <div class="flex flex-col justify-center transform scale-[1.03]">
                    <div v-if="currentSlide" class="relative rounded-lg border-2 border-indigo-400 dark:border-indigo-500 overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-lg max-h-[120px]">
                      <img class="w-full h-full object-cover" :src="currentSlide.displayUrl || currentSlide.url" :alt="currentSlide.name || t('gm.slideshow.currentAlt', 'Image actuelle')">
                      <div v-if="currentSlide.order" class="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-white/80 text-[11px] font-semibold text-slate-700 shadow-sm">#{{ currentSlide.order }}</div>
                    </div>
                  </div>
                  <div class="flex flex-col justify-center">
                    <div v-if="nextSlideObj" class="relative rounded-lg border border-slate-200 dark:border-gray-800 overflow-hidden bg-slate-100 dark:bg-slate-800 opacity-80 cursor-pointer max-h-[90px]"
                         @click="nextSlide"
                         :title="t('gm.slideshow.nextImage', 'Aller à l\'image suivante')">
                      <img class="w-full h-full object-cover" :src="nextSlideObj.displayUrl || nextSlideObj.url" :alt="nextSlideObj.name || t('gm.slideshow.nextAlt', 'Image suivante')">
                      <div v-if="nextSlideObj.order" class="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-white/80 text-[11px] font-semibold text-slate-700 shadow-sm">#{{ nextSlideObj.order }}</div>
                    </div>
                    <div v-else-if="hasNextScene" class="relative rounded-lg border border-indigo-400 dark:border-indigo-500 overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-700 text-white opacity-90 cursor-pointer max-h-[80px] min-h-[80px] w-[185px] px-3"
                         @click="nextSlide"
                         :title="t('gm.slideshow.nextScene', 'Passer à la scène suivante')">
                      <div class="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-white/90 text-[11px] font-semibold text-indigo-700 shadow-sm">#{{ (slideshowImages.length || 0) + 1 }}</div>
                      <div class="h-full w-full flex flex-col items-center justify-center text-center leading-tight font-semibold">
                        <div class="text-[17px] pt-[23px]">{{ t('gm.slideshow.nextScene', 'Passer à la scène suivante') }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-3 rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 pt-4 pb-2 shadow-sm h-[325px]">
                <h3 class="text-lg font-semibold mb-1 inline-flex items-center gap-2">
                  <i class="fa-solid fa-music text-indigo-500"></i>
                  <span>{{ t('gm.playlist.title', 'Playlist') }}</span>
                </h3>
                <p v-if="playlistLoading" class="text-sm text-slate-500 dark:text-slate-200">{{ t('gm.playlist.loading', 'Chargement...') }}</p>
                <p v-else-if="playlistError" class="text-sm text-rose-500">{{ playlistError }}</p>
                <p v-else-if="playlist.length === 0" class="text-sm text-slate-500 dark:text-slate-200">{{ t('gm.playlist.empty', 'Aucun fichier audio.') }}</p>
                <div v-else class="space-y-1.5 overflow-y-auto pr-1" style="max-height: 260px;">
                  <div v-for="audio in playlist" :key="audio.name" class="bg-white dark:bg-gray-800 flex items-center gap-2">
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate" :title="audio.name">{{ audio.name }}</div>
                    </div>
                    <audio class="w-full sm:w-80 h-10" controls :src="audio.url"></audio>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div v-show="hourglassModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div class="bg-white dark:bg-gray-950 rounded-xl shadow-2xl border border-slate-200 dark:border-gray-800 w-full max-w-sm p-5 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold inline-flex items-center gap-2">
              <i class="fa-solid fa-hourglass-half text-indigo-500"></i>
              <span>{{ t('gm.hourglass.modalTitle', 'Durée du sablier') }}</span>
            </h3>
            <button class="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    @click="closeHourglassModal"
                    :aria-label="t('gm.closeModal', 'Close modal')"
                    :title="t('gm.closeModal', 'Close modal')">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="space-y-2">
            <div class="flex flex-wrap gap-2">
              <button class="px-3 py-1.5 rounded-lg border border-indigo-500 text-indigo-600 dark:text-indigo-300 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                      @click="hourglassDurationTemp = 30">30s</button>
              <button class="px-3 py-1.5 rounded-lg border border-indigo-500 text-indigo-600 dark:text-indigo-300 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                      @click="hourglassDurationTemp = 60">1min</button>
              <button class="px-3 py-1.5 rounded-lg border border-indigo-500 text-indigo-600 dark:text-indigo-300 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                      @click="hourglassDurationTemp = 180">3min</button>
              <button class="px-3 py-1.5 rounded-lg border border-indigo-500 text-indigo-600 dark:text-indigo-300 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                      @click="hourglassDurationTemp = 300">5min</button>
            </div>
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-200">{{ t('gm.hourglass.sliderLabel', 'Durée (curseur, max 30min)') }}</label>
            <input type="range" min="30" max="1800" step="5" v-model.number="hourglassDurationTemp" class="w-full">
            <div class="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
              <span>{{ t('gm.hourglass.minLabel', '30s') }}</span>
              <span>{{ Math.floor(hourglassDurationTemp / 60) }}m {{ Math.round(hourglassDurationTemp % 60) }}s</span>
              <span>{{ t('gm.hourglass.maxLabel', '30min') }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2 pt-1">
            <label class="relative inline-flex items-center cursor-pointer select-none">
              <input type="checkbox" class="sr-only peer" v-model="hourglassShowTimer" @change="sendHourglass('showTimer', { show: hourglassVisible ? !!hourglassShowTimer : false })">
              <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full dark:bg-slate-700 peer-checked:bg-indigo-500 transition relative">
                <div class="absolute top-[3px] left-[3px] h-4 w-4 bg-white rounded-full shadow-sm transition"
                     :style="hourglassShowTimer ? 'transform: translateX(20px);' : 'transform: translateX(0);'"></div>
              </div>
              <span class="ml-3 text-sm font-medium text-slate-700 dark:text-slate-200">{{ t('gm.hourglass.showTimerLabel', 'Afficher la durée') }}</span>
            </label>
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button class="px-4 py-2 rounded-lg border border-slate-300 dark:border-gray-700 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    @click="closeHourglassModal">{{ t('gm.common.cancel', 'Annuler') }}</button>
            <button class="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-400"
                    @click="applyHourglassDuration">{{ t('gm.common.confirm', 'Valider') }}</button>
          </div>
        </div>
      </div>

      <div v-if="showLeaveModal" class="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" @click="cancelLeave"></div>
        <div class="relative bg-white dark:bg-gray-950 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-2xl w-full max-w-md p-5 space-y-4 z-10">
          <div class="flex items-start gap-3">
            <div class="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200 flex items-center justify-center">
              <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div class="space-y-1">
              <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">{{ t('gm.leave.title', 'Quitter le mode Game Master ?') }}</h2>
              <p class="text-sm text-slate-600 dark:text-slate-200">{{ t('gm.leave.body', 'Vous allez retourner sur la page de la session.') }}</p>
            </div>
          </div>
          <div class="flex items-center justify-end gap-2">
            <button class="px-4 py-2 rounded-lg border border-slate-200 dark:border-gray-700 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    @click="cancelLeave">{{ t('gm.leave.cancel', 'Annuler') }}</button>
            <button class="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-400 transition"
                    @click="proceedLeave">{{ t('gm.leave.proceed', 'Continuer') }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import '../assets/gm_mode.css';
import { api, toAssetUrl, wsBase } from '../lib/api';

type Session = { id: string; title: string; scenarioId?: string | null; scenario?: { title?: string | null } | null; tenantId: string; tensionLabels?: Record<string, string>; tensionColors?: Record<string, string>; tensionAudio?: Record<string, string | null>; tensionEnabled?: boolean; tensionFont?: string | null };
type SceneAsset = { name: string; order?: number };
type Scene = { id: string; title: string; order?: number; images?: SceneAsset[]; audio?: SceneAsset[]; sessionId?: string | null };
type Asset = { id: string; name: string; url: string; thumbUrl?: string | null };

type Slide = { name: string; url: string; displayUrl?: string; order?: number };

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const sessions = ref<Session[]>([]);
const scenes = ref<Scene[]>([]);
const selectedSessionId = ref((route.params.id as string) || '');
const selectedSceneId = ref('');
const tenantId = ref('');
const scenarioTitle = ref('');
const sceneCarouselIndex = ref(0);
const scenarDeckOpen = ref(true);

const tenantImages = ref<Asset[]>([]);
const tenantAudio = ref<Asset[]>([]);

const slideshowImages = ref<Slide[]>([]);
const slideshowIndex = ref(0);
const slideshowLoading = ref(false);
const slideshowError = ref('');
const hasNextScene = ref(false);

const playlist = ref<Asset[]>([]);
const playlistLoading = ref(false);
const playlistError = ref('');

const tensionEnabled = ref(true);
const tensionLevels = ref<{ key: string; label: string; color: string; textColor: string }[]>([]);
const tensionAudio = ref<Record<string, string | null>>({});
const selectedTension = ref('');

const timerRunning = ref(false);
const timerElapsedMs = ref(0);
const timerStartedAt = ref<number | null>(null);
const timerTick = ref(0);
let timerInterval: ReturnType<typeof setInterval> | null = null;

const hourglassDuration = ref(60);
const hourglassDurationTemp = ref(60);
const hourglassRunning = ref(false);
const hourglassRemainingMs = ref(0);
const hourglassStartedAt = ref<number | null>(null);
let hourglassInterval: ReturnType<typeof setInterval> | null = null;
const hourglassVisible = ref(false);
const hourglassShowTimer = ref(false);
const hourglassModalOpen = ref(false);

const notesBuffer = ref('');
let notesSaveTimer: ReturnType<typeof setTimeout> | null = null;

const frontOnline = ref(false);
let socket: WebSocket | null = null;
let presenceTimer: ReturnType<typeof setInterval> | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let allowReconnect = true;

const showLeaveModal = ref(false);
const leaveTarget = ref('');

const currentSession = computed(() => sessions.value.find(s => s.id === selectedSessionId.value) || null);
const currentScene = computed(() => scenes.value.find(s => s.id === selectedSceneId.value) || null);
const currentSlide = computed(() => (slideshowImages.value.length ? slideshowImages.value[slideshowIndex.value] : null));
const prevSlideObj = computed(() => (slideshowIndex.value > 0 ? slideshowImages.value[slideshowIndex.value - 1] : null));
const nextSlideObj = computed(() => (slideshowIndex.value < slideshowImages.value.length - 1 ? slideshowImages.value[slideshowIndex.value + 1] : null));

const timerDisplay = computed(() => {
  void timerTick.value;
  const elapsed = timerRunning.value && timerStartedAt.value
    ? timerElapsedMs.value + (Date.now() - timerStartedAt.value)
    : timerElapsedMs.value;
  const sec = Math.max(0, Math.floor(elapsed / 1000));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
});

const ensureSelectedSession = () => {
  if (!selectedSessionId.value && sessions.value.length) {
    selectedSessionId.value = sessions.value[0].id;
  }
  const active = sessions.value.find(s => s.id === selectedSessionId.value) || sessions.value[0] || null;
  tenantId.value = active?.tenantId || '';
};

const fetchSessions = async () => {
  const res = await fetch(api('/api/sessions'), { credentials: 'include' });
  sessions.value = res.ok ? await res.json() : [];
  ensureSelectedSession();
};

const fetchScenes = async (sessionId: string) => {
  const res = await fetch(api(`/api/scenes?sessionId=${encodeURIComponent(sessionId)}`), { credentials: 'include' });
  const list = res.ok ? await res.json() : [];
  scenes.value = Array.isArray(list) ? list.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)) : [];
  if (scenes.value.length) {
    await selectScene(scenes.value[0].id);
  } else {
    selectedSceneId.value = '';
    slideshowImages.value = [];
    playlist.value = [];
    notesBuffer.value = '';
  }
};

const fetchAssets = async () => {
  const res = await fetch(api('/api/assets?type=image'), { credentials: 'include' });
  tenantImages.value = res.ok ? await res.json() : [];
  const resAudio = await fetch(api('/api/assets?type=audio'), { credentials: 'include' });
  tenantAudio.value = resAudio.ok ? await resAudio.json() : [];
};

const loadNotes = async () => {
  if (!selectedSceneId.value) {
    notesBuffer.value = '';
    return;
  }
  const res = await fetch(api(`/api/scenes/${encodeURIComponent(selectedSceneId.value)}/note`), { credentials: 'include' });
  const data = res.ok ? await res.json() : {};
  notesBuffer.value = data?.content || '';
};

const saveNotes = async () => {
  if (!selectedSceneId.value) return;
  await fetch(api(`/api/scenes/${encodeURIComponent(selectedSceneId.value)}/note`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ content: notesBuffer.value })
  });
};

const queueNotesSave = () => {
  if (notesSaveTimer) clearTimeout(notesSaveTimer);
  notesSaveTimer = setTimeout(saveNotes, 700);
};

watch(notesBuffer, () => queueNotesSave());

const assetSrc = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return toAssetUrl(url);
};

const findImageAsset = (ref: string) => {
  return tenantImages.value.find(asset =>
    asset.name === ref ||
    asset.url === ref ||
    asset.thumbUrl === ref ||
    asset.url.includes(ref)
  ) || null;
};

const findAudioAsset = (ref: string) => {
  return tenantAudio.value.find(asset =>
    asset.name === ref ||
    asset.url === ref ||
    asset.url.includes(ref)
  ) || null;
};

const buildSlideshowFromScene = () => {
  if (!currentScene.value) {
    slideshowImages.value = [];
    slideshowIndex.value = 0;
    hasNextScene.value = false;
    return;
  }
  const mapped = (currentScene.value.images || []).map((item, idx) => {
    const name = typeof item === 'string' ? item : item?.name;
    if (!name) return null;
    const asset = findImageAsset(name);
    const rawUrl = asset?.thumbUrl || asset?.url || (name.startsWith('/') || name.startsWith('http') ? name : '');
    const url = assetSrc(rawUrl);
    if (!url) return null;
    return {
      name: asset?.name || name,
      url,
      displayUrl: url,
      order: typeof item?.order === 'number' ? item.order : idx + 1
    };
  }).filter(Boolean) as Slide[];

  const currentIdx = scenes.value.findIndex(sc => sc.id === selectedSceneId.value);
  hasNextScene.value = currentIdx !== -1 && currentIdx < scenes.value.length - 1;

  slideshowImages.value = mapped.sort((a, b) => (a.order || 0) - (b.order || 0));
  slideshowIndex.value = mapped.length ? 0 : 0;
  if (mapped.length) {
    setSlide(0);
  } else {
    sendSlideshow(0);
  }
};

const buildPlaylistFromScene = () => {
  if (!currentScene.value) {
    playlist.value = [];
    return;
  }
  const mapped = (currentScene.value.audio || [])
    .map((item, idx) => {
      const name = typeof item === 'string' ? item : item?.name;
      if (!name) return null;
      const ref = findAudioAsset(name);
      const rawUrl = ref?.url || (name.startsWith('/') || name.startsWith('http') ? name : '');
      if (!rawUrl) return null;
      const order = typeof item?.order === 'number' ? item.order : idx + 1;
      return {
        ...(ref || { id: name, name }),
        url: assetSrc(rawUrl),
        order
      } as Asset & { order?: number };
    })
    .filter(Boolean) as (Asset & { order?: number })[];
  playlist.value = mapped.sort((a, b) => (a.order || 0) - (b.order || 0)) as Asset[];
};

const loadSlideshow = async () => {
  slideshowLoading.value = true;
  slideshowError.value = '';
  try {
    if (!tenantImages.value.length) {
      await fetchAssets();
    }
    buildSlideshowFromScene();
  } catch (e: any) {
    slideshowImages.value = [];
    slideshowError.value = e?.message || t('gm.slideshow.error', 'Slideshow error');
  } finally {
    slideshowLoading.value = false;
  }
};

const loadPlaylist = async () => {
  playlistLoading.value = true;
  playlistError.value = '';
  try {
    if (!tenantAudio.value.length) {
      await fetchAssets();
    }
    buildPlaylistFromScene();
  } catch (e: any) {
    playlist.value = [];
    playlistError.value = e?.message || t('gm.playlist.error', 'Playlist error');
  } finally {
    playlistLoading.value = false;
  }
};

const ensureSceneVisible = (sceneId: string) => {
  if (!scenes.value.length) return;
  const idx = scenes.value.findIndex(sc => sc.id === sceneId);
  if (idx === -1) return;
  const maxStart = Math.max(0, scenes.value.length - 5);
  const target = Math.min(Math.max(idx - 2, 0), maxStart);
  sceneCarouselIndex.value = target;
};

const selectScene = async (sceneId: string) => {
  selectedSceneId.value = sceneId;
  ensureSceneVisible(sceneId);
  await loadNotes();
  await loadSlideshow();
  await loadPlaylist();
};

const setSlide = (index: number) => {
  if (!slideshowImages.value.length) return;
  const len = slideshowImages.value.length;
  const safeIndex = Math.min(Math.max(index, 0), len - 1);
  slideshowIndex.value = safeIndex;
  sendSlideshow(safeIndex);
};

const prevSlide = () => {
  if (slideshowIndex.value > 0) {
    setSlide(slideshowIndex.value - 1);
  }
};

const nextSlide = () => {
  if (!slideshowImages.value.length) {
    if (hasNextScene.value) {
      const currentIdx = scenes.value.findIndex(sc => sc.id === selectedSceneId.value);
      const nextScene = currentIdx >= 0 && currentIdx < scenes.value.length - 1 ? scenes.value[currentIdx + 1] : null;
      if (nextScene) selectScene(nextScene.id);
    }
    return;
  }
  const nextIdx = slideshowIndex.value + 1;
  if (nextIdx < slideshowImages.value.length) {
    setSlide(nextIdx);
  } else if (hasNextScene.value) {
    const currentIdx = scenes.value.findIndex(sc => sc.id === selectedSceneId.value);
    const nextScene = currentIdx >= 0 && currentIdx < scenes.value.length - 1 ? scenes.value[currentIdx + 1] : null;
    if (nextScene) selectScene(nextScene.id);
  }
};

const loadTensionConfig = async () => {
  if (!selectedSessionId.value) return;
  const res = await fetch(api(`/api/sessions/${encodeURIComponent(selectedSessionId.value)}`), { credentials: 'include' });
  if (!res.ok) return;
  const data = await res.json();
  const labels = data?.tensionLabels || {};
  const colors = data?.tensionColors || {};
  tensionAudio.value = data?.tensionAudio || {};
  const levels = ['level1', 'level2', 'level3', 'level4', 'level5'];
  const defaults = ['#37aa32', '#f8d718', '#f39100', '#e63027', '#3a3a39'];
  tensionEnabled.value = data?.tensionEnabled !== false;
  tensionLevels.value = levels.map((key, idx) => {
    const label = (labels[key] || `L${idx + 1}`).toString();
    const color = (colors[key] || defaults[idx]).toString();
    const clean = color.replace('#', '');
    const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean.padEnd(6, '0');
    const num = parseInt(full, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    const textColor = yiq > 186 ? '#0f172a' : '#ffffff';
    return { key, label, color, textColor };
  });
};

const sendTensionConfig = () => {
  if (!socket || socket.readyState !== WebSocket.OPEN || !selectedSessionId.value) return;
  socket.send(JSON.stringify({
    type: 'tension:config',
    sessionId: selectedSessionId.value,
    config: {
      tensionEnabled: tensionEnabled.value,
      tensionFont: currentSession.value?.tensionFont || 'Audiowide',
      tensionColors: Object.fromEntries(tensionLevels.value.map(l => [l.key, l.color])),
      tensionLabels: Object.fromEntries(tensionLevels.value.map(l => [l.key, l.label])),
      tensionAudio: tensionAudio.value
    }
  }));
};

const tensionTargetLevel = (delta: number) => {
  if (!tensionLevels.value.length) return null;
  const currentIdx = tensionLevels.value.findIndex(l => l.key === selectedTension.value);
  const baseIdx = currentIdx === -1 ? 0 : currentIdx;
  const nextIdx = Math.min(tensionLevels.value.length - 1, Math.max(0, baseIdx + delta));
  return tensionLevels.value[nextIdx] || null;
};

const tensionButtonStyle = (delta: number) => {
  const lvl = tensionTargetLevel(delta);
  if (!lvl) return '';
  return `background:${lvl.color}DD; border-color:${lvl.color}; color:${lvl.textColor};`;
};

const tensionButtonLabel = (delta: number) => {
  const lvl = tensionTargetLevel(delta);
  return lvl ? lvl.label : '';
};

const changeTension = (delta: number) => {
  const target = tensionTargetLevel(delta);
  if (target) playTension(target.key);
};

const playTension = async (levelKey: string) => {
  selectedTension.value = levelKey;
  if (selectedSessionId.value) {
    await fetch(api(`/api/sessions/${encodeURIComponent(selectedSessionId.value)}/gm-state`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ tensionLevel: levelKey })
    });
  }
  if (socket && socket.readyState === WebSocket.OPEN && selectedSessionId.value) {
    socket.send(JSON.stringify({ type: 'tension:update', level: levelKey, sessionId: selectedSessionId.value }));
  }
  const trackName = tensionAudio.value[levelKey];
  if (!trackName) return;
  const track = tenantAudio.value.find(a => a.name === trackName);
  if (!track) return;
  try {
    const player = new Audio(track.url);
    await player.play();
  } catch {
    // ignore
  }
};

const loadTimer = async () => {
  if (!selectedSessionId.value) return;
  const res = await fetch(api(`/api/sessions/${encodeURIComponent(selectedSessionId.value)}/gm-state`), { credentials: 'include' });
  const data = res.ok ? await res.json() : {};
  if (typeof data?.tensionLevel === 'string') {
    selectedTension.value = data.tensionLevel;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'tension:update', level: data.tensionLevel, sessionId: selectedSessionId.value, silent: true }));
    }
  }
  const timer = data?.timer || {};
  timerRunning.value = !!timer.running;
  timerElapsedMs.value = typeof timer.elapsedMs === 'number' ? timer.elapsedMs : 0;
  timerStartedAt.value = timer.startedAt ? new Date(timer.startedAt).getTime() : null;
  if (data?.hourglass) {
    const d = Number(data.hourglass.durationSeconds);
    if (Number.isFinite(d) && d > 0) {
      hourglassDuration.value = d;
      hourglassDurationTemp.value = d;
    }
    if (typeof data.hourglass.showTimer === 'boolean') {
      hourglassShowTimer.value = data.hourglass.showTimer;
    }
  }
  if (timerRunning.value && !timerInterval) {
    timerInterval = setInterval(() => {
      timerTick.value = Date.now();
    }, 500);
  }
  if (!timerRunning.value && timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
};

const saveTimer = async () => {
  if (!selectedSessionId.value) return;
  await fetch(api(`/api/sessions/${encodeURIComponent(selectedSessionId.value)}/timer`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      running: timerRunning.value,
      elapsedMs: timerElapsedMs.value,
      startedAt: timerStartedAt.value ? new Date(timerStartedAt.value).toISOString() : null
    })
  });
};

const toggleTimer = async () => {
  if (!selectedSessionId.value) return;
  if (!timerRunning.value) {
    timerStartedAt.value = Date.now();
    timerRunning.value = true;
    if (!timerInterval) {
      timerInterval = setInterval(() => {
        timerTick.value = Date.now();
      }, 500);
    }
  } else {
    const now = Date.now();
    if (timerStartedAt.value) timerElapsedMs.value += now - timerStartedAt.value;
    timerStartedAt.value = null;
    timerRunning.value = false;
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }
  await saveTimer();
};

const resetTimer = async () => {
  timerRunning.value = false;
  timerElapsedMs.value = 0;
  timerStartedAt.value = null;
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  await saveTimer();
};

const normalizeHourglassDuration = (val: number) => {
  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? n : hourglassDuration.value;
};

const startHourglassLoop = (durationMs: number) => {
  if (hourglassInterval) clearInterval(hourglassInterval);
  hourglassRunning.value = true;
  hourglassRemainingMs.value = durationMs;
  hourglassStartedAt.value = Date.now();
  hourglassInterval = setInterval(() => {
    if (!hourglassRunning.value || !hourglassStartedAt.value) return;
    const elapsed = Date.now() - hourglassStartedAt.value;
    const remaining = Math.max(0, durationMs - elapsed);
    hourglassRemainingMs.value = remaining;
    if (remaining === 0) stopHourglassLoop();
  }, 500);
};

const stopHourglassLoop = () => {
  hourglassRunning.value = false;
  hourglassStartedAt.value = null;
  if (hourglassInterval) {
    clearInterval(hourglassInterval);
    hourglassInterval = null;
  }
};

const sendHourglass = (action: string, payload: Record<string, unknown> = {}) => {
  if (!socket || socket.readyState !== WebSocket.OPEN || !selectedSessionId.value) return;
  const merged = { ...payload } as Record<string, unknown>;
  if (action === 'showTimer' && merged.show === undefined) merged.show = !!hourglassShowTimer.value;
  if (action === 'visibility' || action === 'flip' || action === 'play') {
    merged.durationSeconds = normalizeHourglassDuration(hourglassDuration.value);
    merged.show = !!hourglassShowTimer.value;
  }
  socket.send(JSON.stringify({ type: 'hourglass:command', action, sessionId: selectedSessionId.value, ...merged }));
};

const toggleHourglassVisibility = () => {
  hourglassVisible.value = !hourglassVisible.value;
  sendHourglass('visibility', { visible: hourglassVisible.value });
  sendHourglass('showTimer', { show: hourglassVisible.value ? !!hourglassShowTimer.value : false });
};

const playOrResetHourglass = () => {
  const duration = normalizeHourglassDuration(hourglassDuration.value);
  hourglassDuration.value = duration;
  if (!hourglassRunning.value) {
    hourglassVisible.value = true;
    sendHourglass('visibility', { visible: true });
    sendHourglass('showTimer', { show: !!hourglassShowTimer.value });
    sendHourglass('play', { durationSeconds: duration });
    startHourglassLoop(duration * 1000);
  } else {
    stopHourglassLoop();
    sendHourglass('reset', { durationSeconds: duration });
  }
};

const hourglassButtonLabel = () => {
  return hourglassRunning.value ? t('gm.hourglass.stop', 'Stop') : t('gm.hourglass.start', 'Start');
};

const openHourglassModal = () => {
  hourglassDurationTemp.value = hourglassDuration.value;
  hourglassModalOpen.value = true;
};

const closeHourglassModal = () => {
  hourglassModalOpen.value = false;
};

const applyHourglassDuration = () => {
  const duration = normalizeHourglassDuration(hourglassDurationTemp.value);
  hourglassDuration.value = duration;
  hourglassModalOpen.value = false;
  sendHourglass('setDuration', { durationSeconds: duration });
  saveHourglassPrefs();
};

const saveHourglassPrefs = async () => {
  if (!selectedSessionId.value) return;
  await fetch(api(`/api/sessions/${encodeURIComponent(selectedSessionId.value)}/hourglass`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      durationSeconds: hourglassDuration.value,
      showTimer: !!hourglassShowTimer.value
    })
  });
};

const hourglassDisplay = () => {
  if (!hourglassRunning.value) return t('gm.hourglass.display', 'Durée');
  const ms = Math.max(0, Math.floor(hourglassRemainingMs.value));
  const sec = Math.ceil(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${m}:${pad(s)}`;
};

const sendSlideshow = (index: number) => {
  if (!socket || socket.readyState !== WebSocket.OPEN || !selectedSessionId.value) return;
  if (!slideshowImages.value.length) return;
  if (!frontOnline.value) return;
  const len = slideshowImages.value.length;
  const safeIndex = len > 0 ? Math.min(Math.max(index, 0), len - 1) : 0;
  const slide = len > 0 ? (slideshowImages.value[safeIndex] || null) : null;
  if (!slide) return;
  socket.send(JSON.stringify({ type: 'slideshow:update', name: slide.name || null, sessionId: selectedSessionId.value }));
};

const connectSocket = () => {
  if (!tenantId.value) return;
  allowReconnect = true;
  if (socket) socket.close();
  socket = new WebSocket(`${wsBase()}/ws?tenantId=${encodeURIComponent(tenantId.value)}&role=gm`);
  socket.onopen = () => {
    if (selectedSessionId.value) {
      socket?.send(JSON.stringify({ type: 'presence:hello', sessionId: selectedSessionId.value }));
      sendTensionConfig();
      sendSlideshow(slideshowIndex.value);
    }
    if (presenceTimer) clearInterval(presenceTimer);
    presenceTimer = setInterval(() => {
      if (socket?.readyState === WebSocket.OPEN && selectedSessionId.value) {
        socket.send(JSON.stringify({ type: 'presence:hello', sessionId: selectedSessionId.value }));
      }
    }, 8000);
  };
  socket.onclose = () => {
    if (presenceTimer) {
      clearInterval(presenceTimer);
      presenceTimer = null;
    }
    if (allowReconnect) {
      reconnectTimer = setTimeout(connectSocket, 2000);
    }
  };
  socket.onerror = () => {
    socket?.close();
  };
  socket.onmessage = evt => {
    try {
      const msg = JSON.parse(evt.data || '{}');
      if (msg.type === 'presence:update' && msg.sessionId === selectedSessionId.value) {
        const wasOnline = frontOnline.value;
        frontOnline.value = msg.front === 'online';
        if (frontOnline.value && !wasOnline) {
          sendTensionConfig();
          sendSlideshow(slideshowIndex.value);
          if (selectedTension.value) {
            socket?.send(JSON.stringify({ type: 'tension:update', level: selectedTension.value, sessionId: selectedSessionId.value, silent: true }));
          }
        }
        if (!frontOnline.value && timerRunning.value) {
          toggleTimer();
        }
      }
      if (msg.type === 'tension:request') {
        sendTensionConfig();
        if (selectedTension.value) {
          socket?.send(JSON.stringify({ type: 'tension:update', level: selectedTension.value, sessionId: selectedSessionId.value, silent: true }));
        }
      }
      if (msg.type === 'slideshow:request') {
        sendSlideshow(slideshowIndex.value);
      }
    } catch {
      // ignore
    }
  };
};

const openFront = async () => {
  if (!tenantId.value) return;
  await fetch(api('/api/session-runs'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ sessionId: selectedSessionId.value })
  }).catch(() => null);
  if (selectedSessionId.value) {
    frontOnline.value = false;
    connectSocket();
  }
  window.open(`http://localhost:3001/t/${encodeURIComponent(tenantId.value)}/player_view?session=${encodeURIComponent(selectedSessionId.value)}`, '_blank');
};

const carouselPrev = () => {
  sceneCarouselIndex.value = Math.max(0, sceneCarouselIndex.value - 1);
};

const carouselNext = () => {
  sceneCarouselIndex.value = Math.min(Math.max(0, scenes.value.length - 5), sceneCarouselIndex.value + 1);
};

const cancelLeave = () => {
  showLeaveModal.value = false;
  leaveTarget.value = '';
};

const proceedLeave = () => {
  const target = leaveTarget.value || `/app/sessions/${encodeURIComponent(selectedSessionId.value)}/scenes`;
  showLeaveModal.value = false;
  leaveTarget.value = '';
  router.push(target);
};

watch(selectedSessionId, async (id) => {
  if (!id) return;
  scenarioTitle.value = currentSession.value?.scenario?.title || '';
  await fetchAssets();
  await fetchScenes(id);
  await loadTensionConfig();
  await loadTimer();
  connectSocket();
});

watch(() => route.params.id, (id) => {
  const nextId = (id as string) || '';
  if (nextId && nextId !== selectedSessionId.value) {
    selectedSessionId.value = nextId;
  }
});

onMounted(async () => {
  await fetchSessions();
  if (selectedSessionId.value) {
    await fetchAssets();
    await fetchScenes(selectedSessionId.value);
    await loadTensionConfig();
    await loadTimer();
    connectSocket();
  }
});

onBeforeUnmount(() => {
  allowReconnect = false;
  if (socket) socket.close();
  if (presenceTimer) clearInterval(presenceTimer);
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (timerInterval) clearInterval(timerInterval);
  if (hourglassInterval) clearInterval(hourglassInterval);
});
</script>
