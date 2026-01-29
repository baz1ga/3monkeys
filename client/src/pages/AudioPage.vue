<template>
  <div class="max-w-7xl mx-auto" style="--audio-accent:#65a30d; --audio-accent-strong:#4d7c0f;">
    <div v-if="audioLoading" class="justify-center max-w-4xl mx-auto rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-sm flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
      <div class="h-5 w-5 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
      <span>{{ t('audio.loading') }}</span>
    </div>

    <section v-else class="space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-3">
          <span class="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-lime-50 text-lime-700 dark:bg-lime-900/30">
            <i class="fa-solid fa-music text-lg"></i>
          </span>
          <div>
            <h1 class="text-2xl font-semibold audio-text">{{ t('audio.title') }}</h1>
            <p class="text-sm text-slate-500 dark:text-slate-200">{{ t('audio.subtitle') }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <input type="file" class="hidden" multiple accept="audio/*" @change="uploadAudio" ref="audioInput" />
          <button
            type="button"
            class="inline-flex items-center gap-2 h-10 rounded-lg bg-lime-500 text-slate-900 font-semibold px-4 text-sm shadow-sm hover:bg-lime-400 transition"
            @click="openFilePicker"
            :aria-label="t('audio.buttons.upload')"
            :title="t('audio.buttons.upload')"
          >
            <i class="fa-solid fa-upload"></i>
            <span>{{ t('audio.buttons.upload') }}</span>
          </button>
        </div>
      </div>

      <div v-if="audioFiles.length === 0" class="text-sm max-w-4xl mx-auto text-center text-slate-600 dark:text-slate-200 border border-dashed border-slate-300 dark:border-gray-800 rounded-lg p-4">
        {{ t('audio.none') }}
      </div>

      <div class="space-y-2 max-w-4xl mx-auto" v-else>
        <div
          v-for="(audio, index) in audioFiles"
          :key="audio.id"
          class="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-3 transition"
          draggable="true"
          @dragstart="startAudioDrag(index)"
          @dragend="endAudioDrag"
          @dragover.prevent="onAudioDragOver(index)"
          @drop.prevent="onAudioDrop(index)"
          :class="[
            audioDragOverIndex === index && audioDragIndex !== null ? 'audio-ring ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-900 shadow-lg' : '',
            audioDragIndex === index ? 'opacity-80 scale-[0.99]' : ''
          ]"
        >
          <button
            class="h-8 w-8 inline-flex items-center justify-center rounded-lg border bg-white/90 dark:bg-gray-800/90 text-slate-500 dark:text-white hover:text-lime-600 dark:hover:text-white border border-slate-200 dark:border-gray-700 cursor-grab select-none"
            :class="audioDragIndex === index ? 'cursor-grabbing audio-text' : ''"
            :title="t('audio.reorderHint')"
            draggable="true"
            @dragstart.stop="startAudioDrag(index)"
            @dragend.stop="endAudioDrag"
          >
            <i class="fa-solid fa-grip-vertical text-sm"></i>
          </button>
          <div class="flex-1">
            <div class="text-sm font-semibold truncate">{{ audio.name }}</div>
          </div>
          <audio :src="assetSrc(audio.url)" controls class="w-80 h-10"></audio>
          <div class="flex items-center gap-2">
            <button
              class="h-8 w-8 inline-flex items-center justify-center rounded-lg border audio-border audio-text hover:bg-lime-50 dark:hover:bg-lime-900/30 transition"
              @click="openRenameAudioModal(audio)"
              :aria-label="t('audio.buttons.rename')"
              :title="t('audio.buttons.rename')"
            >
              <i class="fa-solid fa-pen"></i>
            </button>
            <button
              class="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-rose-200 dark:border-rose-900 bg-white dark:bg-gray-950 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition"
              @click="openDeleteConfirm(audio)"
              :aria-label="t('audio.buttons.delete')"
              :title="t('audio.buttons.delete')"
            >
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="text-sm" :class="audioStatus === 'error' ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-300'">
        {{ audioMessage }}
      </div>
    </section>

    <div
      class="fixed inset-0 z-50 flex items-center justify-center px-4"
      v-show="renameAudioModal.open"
      @keydown.escape.window="closeRenameAudioModal"
    >
      <div class="fixed inset-0 bg-black/60" @click="closeRenameAudioModal"></div>
      <div class="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-800 shadow-2xl p-6 space-y-4">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-full flex items-center justify-center text-xl audio-text" style="background: rgba(101,163,13,0.15);">
            <i class="fa-solid fa-pen"></i>
          </div>
          <div class="text-lg font-semibold text-slate-900 dark:text-slate-100">{{ t('audio.renameDialog.title') }}</div>
        </div>
        <p class="text-sm text-slate-600 dark:text-slate-300">
          <span>{{ t('audio.renameDialog.current') }}</span>
          <span class="font-semibold">{{ renameAudioModal.name }}</span>
        </p>
        <div class="space-y-2">
          <label class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-200 font-semibold">{{ t('audio.renameDialog.label') }}</label>
          <input
            type="text"
            class="w-full rounded-lg border bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            style="border-color: var(--audio-accent); --tw-ring-color: var(--audio-accent);"
            v-model="renameAudioModal.newName"
            :placeholder="t('audio.renameDialog.placeholder')"
          />
          <p class="text-xs text-rose-500" v-show="renameAudioModal.error">{{ renameAudioModal.error }}</p>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button class="px-4 py-2 rounded-lg border border-slate-300 dark:border-gray-700 text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800" @click="closeRenameAudioModal">
            {{ t('audio.renameDialog.cancel') }}
          </button>
          <button class="px-4 py-2 rounded-lg audio-bg font-semibold hover:brightness-110" @click="confirmRenameAudio">
            {{ t('audio.renameDialog.confirm') }}
          </button>
        </div>
      </div>
    </div>

    <div
      class="fixed inset-0 z-50 flex items-center justify-center px-4"
      v-show="confirmModal.open"
      @keydown.escape.window="closeConfirm"
    >
      <div class="fixed inset-0 bg-black/60" @click="closeConfirm"></div>
      <div class="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-800 shadow-2xl p-6 space-y-4">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xl">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div class="text-lg font-semibold text-slate-900 dark:text-slate-100">{{ t('audio.confirm.title') }}</div>
        </div>
        <p class="text-sm text-slate-600 dark:text-slate-300">{{ confirmModal.message }}</p>
        <div class="flex justify-end gap-2 pt-2">
          <button class="px-4 py-2 rounded-lg border border-slate-300 dark:border-gray-700 text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800" @click="closeConfirm">
            {{ t('audio.confirm.cancel') }}
          </button>
          <button class="px-4 py-2 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-500" @click="confirmYes">
            {{ t('audio.confirm.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { api, toAssetUrl } from '../lib/api';

const { t } = useI18n();

type AudioAsset = { id: string; name: string; url: string; sortOrder: number };

type RenameModalState = {
  open: boolean;
  id: string;
  name: string;
  newName: string;
  error: string;
};

type ConfirmModalState = {
  open: boolean;
  id: string;
  message: string;
};

const audioFiles = ref<AudioAsset[]>([]);
const audioLoading = ref(false);
const audioMessage = ref('');
const audioStatus = ref<'ok' | 'error'>('ok');
const audioDragIndex = ref<number | null>(null);
const audioDragOverIndex = ref<number | null>(null);

const audioInput = ref<HTMLInputElement | null>(null);

const renameAudioModal = ref<RenameModalState>({
  open: false,
  id: '',
  name: '',
  newName: '',
  error: ''
});

const confirmModal = ref<ConfirmModalState>({
  open: false,
  id: '',
  message: ''
});

const assetSrc = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return toAssetUrl(url);
};

const loadAudio = async () => {
  audioLoading.value = true;
  try {
    const res = await fetch(api('/api/assets?type=audio'), { credentials: 'include' });
    if (!res.ok) throw new Error('Audio');
    audioFiles.value = await res.json();
    audioStatus.value = 'ok';
  } catch {
    audioFiles.value = [];
    audioStatus.value = 'error';
  } finally {
    audioLoading.value = false;
  }
};

const openFilePicker = () => {
  audioInput.value?.click();
};

const uploadAudio = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files || []);
  input.value = '';
  if (!files.length) return;

  let success = 0;
  const errors: string[] = [];
  for (const file of files) {
    if (file.size > 40 * 1024 * 1024) {
      errors.push(`${file.name} > 40MB`);
      continue;
    }
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch(api('/api/assets/audio/upload'), {
        method: 'POST',
        credentials: 'include',
        body: form
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        errors.push(data.error || `Upload failed for ${file.name}`);
      } else {
        success += 1;
      }
    } catch {
      errors.push(`Upload failed for ${file.name}`);
    }
  }

  if (success > 0) {
    await loadAudio();
  }

  audioStatus.value = errors.length ? 'error' : 'ok';
  if (errors.length === 0) {
    audioMessage.value = t('audio.messages.added', { count: success });
  } else {
    const base = success > 0 ? t('audio.messages.added', { count: success }) : t('audio.messages.errors');
    audioMessage.value = `${base} ${errors.join(' | ')}`;
  }
};

const startAudioDrag = (index: number) => {
  audioDragIndex.value = index;
  audioDragOverIndex.value = index;
};

const onAudioDragOver = (index: number) => {
  if (audioDragIndex.value === null) return;
  audioDragOverIndex.value = index;
};

const onAudioDrop = async (index: number) => {
  if (audioDragIndex.value === null) return;
  const list = [...audioFiles.value];
  const [moved] = list.splice(audioDragIndex.value, 1);
  list.splice(index, 0, moved);
  audioDragIndex.value = null;
  audioDragOverIndex.value = null;
  audioFiles.value = list;
  await fetch(api('/api/assets/order'), {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids: list.map(item => item.id) })
  });
};

const endAudioDrag = () => {
  audioDragIndex.value = null;
  audioDragOverIndex.value = null;
};

const openRenameAudioModal = (audio: AudioAsset) => {
  renameAudioModal.value = {
    open: true,
    id: audio.id,
    name: audio.name,
    newName: audio.name,
    error: ''
  };
};

const closeRenameAudioModal = () => {
  renameAudioModal.value = { open: false, id: '', name: '', newName: '', error: '' };
};

const confirmRenameAudio = async () => {
  const { id, name, newName } = renameAudioModal.value;
  if (!newName || newName === name) {
    renameAudioModal.value.error = newName ? t('audio.renameDialog.sameName') : t('audio.renameDialog.empty');
    return;
  }
  renameAudioModal.value.error = '';
  try {
    const res = await fetch(api(`/api/assets/${encodeURIComponent(id)}`), {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Error');
    closeRenameAudioModal();
    await loadAudio();
    audioMessage.value = t('audio.messages.renameOk');
    audioStatus.value = 'ok';
  } catch (err: any) {
    renameAudioModal.value.error = err?.message || t('audio.messages.renameFail');
    audioStatus.value = 'error';
  }
};

const openDeleteConfirm = (audio: AudioAsset) => {
  confirmModal.value = {
    open: true,
    id: audio.id,
    message: t('audio.confirm.deleteOne')
  };
};

const closeConfirm = () => {
  confirmModal.value = { open: false, id: '', message: '' };
};

const confirmYes = async () => {
  if (!confirmModal.value.id) return;
  try {
    await fetch(api(`/api/assets/${encodeURIComponent(confirmModal.value.id)}`), {
      method: 'DELETE',
      credentials: 'include'
    });
    closeConfirm();
    await loadAudio();
    audioMessage.value = t('audio.messages.deleteOk');
    audioStatus.value = 'ok';
  } catch {
    audioMessage.value = t('audio.messages.deleteFailed');
    audioStatus.value = 'error';
  }
};

onMounted(() => {
  loadAudio();
});
</script>

<style scoped>
:global(.audio-text) {
  color: var(--audio-accent, #65a30d);
}
:global(.audio-border) {
  border-color: var(--audio-accent, #65a30d);
}
:global(.audio-bg) {
  background-color: var(--audio-accent, #65a30d);
  color: #fff;
  border-color: var(--audio-accent, #65a30d);
}
:global(.audio-ring) {
  box-shadow: 0 0 0 2px var(--audio-accent, #65a30d);
}
</style>
