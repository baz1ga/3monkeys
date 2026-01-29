<template>
  <div class="max-w-7xl mx-auto space-y-6" style="--gallery-accent:#ca8a04; --gallery-accent-strong:#a16207;">
    <div v-if="loading" class="justify-center max-w-4xl mx-auto rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-sm flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
      <div class="h-5 w-5 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
      <span>{{ t('gallery.loading') }}</span>
    </div>

    <section v-else class="space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-3">
          <span class="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/30">
            <i class="fa-solid fa-images text-lg"></i>
          </span>
          <div>
            <h1 class="text-2xl font-semibold gallery-text">{{ t('gallery.title') }}</h1>
            <p class="text-sm text-slate-500 dark:text-slate-200">{{ t('gallery.subtitle') }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="btn-ghost inline-flex h-[34px] items-center gap-2 rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
            @click="hideSelectedVisible"
            :disabled="selectedVisible.length === 0"
            :title="selectedVisible.length === 0 ? t('gallery.buttons.selectImages') : t('gallery.buttons.hideSelected')"
          >
            <i class="fa-solid fa-eye-slash"></i>
            <span>{{ t('gallery.buttons.hideSelected') }}</span>
            <span class="badge-count" v-show="selectedVisible.length > 0">{{ selectedVisible.length }}</span>
          </button>
          <button
            class="inline-flex items-center gap-2 h-10 rounded-lg bg-yellow-500 text-slate-900 font-semibold px-4 text-sm shadow-sm hover:bg-yellow-400 transition"
            @click="openUploadModal"
            :title="t('gallery.buttons.add')"
          >
            <i class="fa-solid fa-upload"></i> <span>{{ t('gallery.buttons.add') }}</span>
          </button>
        </div>
      </div>

      <div class="rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4">
        <div v-if="filteredVisible.length === 0" class="text-sm max-w-4xl mx-auto text-center text-slate-600 dark:text-slate-200 border border-dashed border-slate-300 dark:border-gray-800 rounded-lg p-4">
          {{ t('gallery.none') }}
        </div>

        <div v-else class="grid gap-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
          <div
            v-for="(img, index) in filteredVisible"
            :key="img.id"
            class="relative rounded-lg border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden aspect-square transition-all group hover:-translate-y-0.5"
            :draggable="query.trim() === ''"
            @dragstart="startDrag(index, $event)"
            @dragend="endDrag"
            @dragover.prevent="onDragOver(index)"
            @dragenter.prevent="onDragOver(index)"
            @drop.prevent="onDrop(index)"
            :class="[
              'shadow-sm hover:shadow-md',
              dragOverIndex === index ? 'gallery-ring ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-900 shadow-lg' : '',
              dragIndex === index ? 'opacity-80 scale-[0.98]' : ''
            ]"
          >
            <div class="absolute top-2 right-2 z-20 flex items-center gap-2">
              <label class="h-8 w-8 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 shadow cursor-pointer">
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded border border-slate-400 bg-white text-yellow-500 accent-yellow-500 cursor-pointer"
                  :checked="selectedVisible.includes(img.id)"
                  @change.stop="toggleSelectVisible(img.id)"
                  :aria-label="`${t('gallery.selectImage')} ${img.name}`"
                />
              </label>
            </div>
            <button
              class="absolute top-2 left-2 h-7 w-7 flex items-center justify-center rounded-full bg-white/90 dark:bg-gray-800/90 text-slate-500 hover:text-yellow-600 cursor-grab select-none border border-slate-200 dark:border-gray-700 text-xs"
              :class="dragIndex === index ? 'cursor-grabbing text-yellow-600' : ''"
              :title="t('gallery.reorderHint')"
              @mousedown.prevent
            >
              <i class="fa-solid fa-grip-vertical"></i>
            </button>
            <div class="absolute bottom-2 left-2 px-2 py-1 rounded-full bg-slate-900/80 text-white text-[11px] font-semibold shadow-sm">#{{ index + 1 }}</div>
            <div class="absolute inset-0">
              <img :src="assetSrc(img.thumbUrl || img.url)" draggable="false" class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105 group-active:scale-[1.02]" @click="zoom(img.url)" />
            </div>
            <div class="absolute inset-0 bg-slate-900/15 dark:bg-slate-100/10 opacity-0 group-hover:opacity-100 transition flex items-center justify-center pointer-events-none text-[10px] font-semibold tracking-wide text-white">
              {{ t('gallery.dragToMove') }}
            </div>
            <div
              class="absolute inset-0 flex items-center justify-center text-xs font-semibold tracking-wide uppercase"
              :style="dragIndex !== null && dragOverIndex === index ? 'background: var(--gallery-accent-strong); color: #fff;' : 'display:none;'"
              v-show="dragIndex !== null && dragOverIndex === index"
            >
              <span>{{ t('gallery.dropHere') }}</span>
            </div>
            <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent p-2 text-white space-y-1.5">
              <div class="text-[12px] font-semibold truncate text-slate-400">{{ img.name }}</div>
            </div>
          </div>
        </div>
      </div>

      <div id="hiddenPictures" class="space-y-4 mt-6">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <span class="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/30">
              <i class="fa-solid fa-eye-slash text-lg"></i>
            </span>
            <div>
              <h2 class="text-2xl font-semibold gallery-text">{{ t('gallery.hiddenTitle') }}</h2>
              <p class="text-sm text-slate-500 dark:text-slate-200">{{ t('gallery.hiddenSubtitle') }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              class="btn-ghost inline-flex h-[34px] items-center gap-2 rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
              @click="showSelectedHidden"
              :disabled="selectedHidden.length === 0"
              :title="selectedHidden.length === 0 ? t('gallery.buttons.selectImages') : t('gallery.buttons.showHidden')"
            >
              <i class="fa-regular fa-eye"></i>
              <span>{{ t('gallery.buttons.showHidden') }}</span>
              <span class="badge-count" v-show="selectedHidden.length > 0">{{ selectedHidden.length }}</span>
            </button>
            <button
              class="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-rose-200 dark:border-rose-900 bg-white dark:bg-gray-950 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
              @click="openDeleteConfirm(selectedHidden)"
              :disabled="selectedHidden.length === 0"
              :title="selectedHidden.length === 0 ? t('gallery.buttons.selectImages') : t('gallery.buttons.deleteSelection')"
            >
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4">
          <div v-if="filteredHidden.length === 0" class="text-sm max-w-4xl mx-auto text-center text-slate-600 dark:text-slate-200 border border-dashed border-slate-300 dark:border-gray-800 rounded-lg p-4">
            {{ t('gallery.none') }}
          </div>
          <div v-else class="grid gap-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
            <div v-for="img in filteredHidden" :key="img.id" class="relative rounded-lg border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden aspect-square transition-all group hover:-translate-y-0.5 shadow-sm hover:shadow-md">
              <div class="absolute top-2 right-2 z-20 flex items-center gap-2">
                <label class="h-8 w-8 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 shadow cursor-pointer">
                  <input
                    type="checkbox"
                    class="h-4 w-4 rounded border border-slate-400 bg-white text-yellow-500 accent-yellow-500 cursor-pointer"
                    :checked="selectedHidden.includes(img.id)"
                    @change.stop="toggleSelectHidden(img.id)"
                    :aria-label="`${t('gallery.selectImage')} ${img.name}`"
                  />
                </label>
              </div>
              <div class="absolute top-2 left-2 px-2 py-1 rounded-full bg-amber-500 text-slate-900 text-[11px] font-semibold shadow-sm">{{ t('gallery.hiddenBadge') }}</div>
              <div class="absolute inset-0">
                <img :src="assetSrc(img.thumbUrl || img.url)" class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105 group-active:scale-[1.02]" @click="zoom(img.url)" />
              </div>
              <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent p-2 text-white space-y-1.5">
                <div class="text-[12px] font-semibold truncate text-slate-400">{{ img.name }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
        v-show="zoomUrl"
        @click="zoomUrl = ''"
      >
        <div class="relative max-w-4xl w-full px-6">
          <button
            class="absolute -top-10 right-0 text-slate-200 text-xl"
            @click.stop="zoomUrl = ''"
            :title="t('gallery.zoomClose')"
          >✕</button>
          <img :src="assetSrc(zoomUrl)" class="w-full rounded-xl border border-slate-700 shadow-2xl" />
        </div>
      </div>

      <UploadModal v-model="uploadModalOpen" :allow-multiple="true" context="gallery" :on-files-selected="handleUploadFiles" />
    </section>

    <div
      class="fixed inset-0 z-50 flex items-center justify-center px-4"
      v-show="confirmModalOpen"
      @keydown.escape.window="closeConfirm"
    >
      <div class="fixed inset-0 bg-black/60" @click="closeConfirm"></div>
      <div class="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-800 shadow-2xl p-6 space-y-4">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xl">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div class="text-lg font-semibold text-slate-900 dark:text-slate-100">{{ t('gallery.confirm.title') }}</div>
        </div>
        <p class="text-sm text-slate-600 dark:text-slate-300">{{ confirmMessage }}</p>
        <div class="flex justify-end gap-2 pt-2">
          <button class="px-4 py-2 rounded-lg border border-slate-300 dark:border-gray-700 text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800" @click="closeConfirm">
            {{ t('gallery.confirm.cancel') }}
          </button>
          <button class="px-4 py-2 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-500" @click="confirmDelete">
            {{ t('gallery.confirm.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import UploadModal from '../components/modals/UploadModal.vue';

const { t } = useI18n();

type Asset = { id: string; name: string; url: string; thumbUrl?: string | null; hidden: boolean; sortOrder: number };

const query = ref('');
const loading = ref(false);
const visible = ref<Asset[]>([]);
const hidden = ref<Asset[]>([]);
const selectedVisible = ref<string[]>([]);
const selectedHidden = ref<string[]>([]);
const dragIndex = ref<number | null>(null);
const dragOverIndex = ref<number | null>(null);
const zoomUrl = ref('');

const uploadModalOpen = ref(false);
const confirmModalOpen = ref(false);
const confirmMessage = ref('');
const confirmDeleteIds = ref<string[]>([]);

const filteredVisible = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return visible.value;
  return visible.value.filter(item => item.name.toLowerCase().includes(q));
});

const filteredHidden = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return hidden.value;
  return hidden.value.filter(item => item.name.toLowerCase().includes(q));
});

const fetchAssets = async () => {
  loading.value = true;
  try {
    const res = await fetch('http://localhost:3100/api/assets?type=image', { credentials: 'include' });
    if (!res.ok) throw new Error('fetch');
    const data = await res.json();
    visible.value = data.filter((i: Asset) => !i.hidden);
    hidden.value = data.filter((i: Asset) => i.hidden);
    selectedVisible.value = selectedVisible.value.filter(id => visible.value.some(v => v.id === id));
    selectedHidden.value = selectedHidden.value.filter(id => hidden.value.some(h => h.id === id));
  } catch {
    visible.value = [];
    hidden.value = [];
    selectedVisible.value = [];
    selectedHidden.value = [];
  } finally {
    loading.value = false;
  }
};

const openUploadModal = () => {
  uploadModalOpen.value = true;
};

const toggleSelectVisible = (id: string) => {
  if (selectedVisible.value.includes(id)) {
    selectedVisible.value = selectedVisible.value.filter(v => v !== id);
  } else {
    selectedVisible.value = [...selectedVisible.value, id];
  }
};

const toggleSelectHidden = (id: string) => {
  if (selectedHidden.value.includes(id)) {
    selectedHidden.value = selectedHidden.value.filter(v => v !== id);
  } else {
    selectedHidden.value = [...selectedHidden.value, id];
  }
};

const hideSelectedVisible = async () => {
  if (selectedVisible.value.length === 0) return;
  await fetch('http://localhost:3100/api/assets/visibility', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids: selectedVisible.value, hidden: true })
  });
  selectedVisible.value = [];
  await fetchAssets();
};

const showSelectedHidden = async () => {
  if (selectedHidden.value.length === 0) return;
  await fetch('http://localhost:3100/api/assets/visibility', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids: selectedHidden.value, hidden: false })
  });
  selectedHidden.value = [];
  await fetchAssets();
};

const openDeleteConfirm = (ids: string[]) => {
  if (!ids.length) return;
  confirmDeleteIds.value = [...ids];
  confirmMessage.value = t('gallery.confirm.message', { count: ids.length });
  confirmModalOpen.value = true;
};

const closeConfirm = () => {
  confirmModalOpen.value = false;
  confirmDeleteIds.value = [];
  confirmMessage.value = '';
};

const confirmDelete = async () => {
  if (!confirmDeleteIds.value.length) return;
  await Promise.all(
    confirmDeleteIds.value.map(id =>
      fetch(`http://localhost:3100/api/assets/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include'
      })
    )
  );
  selectedHidden.value = [];
  closeConfirm();
  await fetchAssets();
};

const startDrag = (index: number, event: DragEvent) => {
  if (query.value.trim()) return;
  dragIndex.value = index;
  dragOverIndex.value = index;
  if (event?.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
  }
};

const onDragOver = (index: number) => {
  if (dragIndex.value === null) return;
  dragOverIndex.value = index;
};

const onDrop = async (index: number) => {
  if (dragIndex.value === null) return;
  const list = [...visible.value];
  const [moved] = list.splice(dragIndex.value, 1);
  list.splice(index, 0, moved);
  dragIndex.value = null;
  dragOverIndex.value = null;
  visible.value = list;
  await fetch('http://localhost:3100/api/assets/order', {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids: list.map(item => item.id) })
  });
};

const endDrag = () => {
  dragIndex.value = null;
  dragOverIndex.value = null;
};

const zoom = (url: string) => {
  zoomUrl.value = url;
};

const assetSrc = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `http://localhost:3100${url}`;
};

const uploadFile = async (file: File) => {
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('http://localhost:3100/api/assets/upload', {
    method: 'POST',
    credentials: 'include',
    body: formData
  });
  if (!res.ok) throw new Error('upload');
};

const uploadFiles = async (files: File[]) => {
  for (const file of files) {
    await uploadFile(file);
  }
};

const handleUploadFiles = async (files: File[]) => {
  if (!files.length) return false;
  try {
    await uploadFiles(files);
    await fetchAssets();
    return true;
  } catch {
    return false;
  }
};

onMounted(() => {
  fetchAssets();
});
</script>

<style scoped>
:global(.gallery-text) {
  color: var(--gallery-accent, #ca8a04);
}
:global(.gallery-border) {
  border-color: var(--gallery-accent, #ca8a04);
}
:global(.gallery-ring) {
  box-shadow: 0 0 0 2px var(--gallery-accent, #ca8a04);
}
:global(.badge-count) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.35rem;
  border-radius: 9999px;
  background: #fde68a;
  color: #7c2d12;
  font-size: 0.65rem;
  font-weight: 700;
}
</style>
