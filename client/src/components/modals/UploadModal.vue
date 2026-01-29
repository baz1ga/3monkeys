<template>
  <div
    class="fixed inset-0 z-50 flex items-start justify-center px-3 pt-[5vh]"
    v-show="modelValue"
    @keydown.escape.window="close"
  >
    <div class="fixed inset-0 bg-black/60" @click="close"></div>
    <div class="relative w-full max-w-3xl max-h-[800px] rounded-2xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-800 shadow-2xl p-6 flex flex-col space-y-4 overflow-y-auto">
      <div class="flex items-center gap-2 border-b border-slate-200 dark:border-gray-800">
        <button
          class="px-4 py-2 text-sm font-semibold"
          :class="uploadTab === 'drop' ? 'gallery-text border-b-2 gallery-border' : 'text-slate-500 dark:text-slate-200'"
          @click="setUploadTab('drop')"
        >
          <span>{{ t('gallery.upload.fromComputer') }}</span>
        </button>
        <button
          class="px-4 py-2 text-sm font-semibold"
          :class="uploadTab === 'url' ? 'gallery-text border-b-2 gallery-border' : 'text-slate-500 dark:text-slate-200'"
          @click="setUploadTab('url')"
        >
          <span>{{ t('gallery.upload.fromUrl') }}</span>
        </button>
        <button
          class="px-4 py-2 text-sm font-semibold inline-flex items-center gap-2"
          :class="uploadTab === 'pixabay' ? 'gallery-text border-b-2 gallery-border' : 'text-slate-500 dark:text-slate-200'"
          @click="setUploadTab('pixabay')"
        >
          <img src="https://pixabay.com/favicon-16x16.png" alt="" class="h-4 w-4" />
          <span>{{ t('gallery.upload.pixabay') }}</span>
        </button>
      </div>

      <div class="space-y-4" v-show="uploadTab === 'drop'">
        <div
          class="rounded-2xl border-2 border-dashed p-6 text-center transition cursor-pointer"
          :class="uploadDragActive ? 'gallery-border bg-yellow-50 dark:bg-yellow-900/20' : 'gallery-border bg-yellow-50/50 dark:bg-yellow-900/10'"
          @dragover.prevent="uploadDragActive = true"
          @dragleave.prevent="uploadDragActive = false"
          @drop.prevent="handleUploadDrop"
          @click="$refs.uploadInput.click()"
        >
          <div class="text-3xl gallery-text mb-2"><i class="fa-solid fa-cloud-arrow-up"></i></div>
          <div class="text-xs text-slate-500 dark:text-slate-200 mt-1">{{ t('gallery.upload.dropHint') }}</div>
          <div class="mt-3">
            <span
              class="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm bg-white dark:bg-transparent hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
              :class="['gallery-border', 'gallery-text']"
            >
              {{ t('gallery.upload.browse') }}
            </span>
          </div>
          <input type="file" :multiple="allowMultiple" accept="image/*" class="hidden" ref="uploadInput" @change="uploadFile" />
        </div>
      </div>

      <div class="space-y-3" v-show="uploadTab === 'url'">
        <div class="flex items-center gap-2">
          <input
            type="url"
            v-model="uploadUrl"
            class="flex-1 rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            style="--tw-ring-color: var(--gallery-accent, #10b981)"
            :placeholder="t('gallery.upload.urlPlaceholder')"
          />
          <button
            class="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm bg-white dark:bg-transparent transition hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
            :class="['gallery-border', 'gallery-text']"
            @click="uploadFromUrl()"
            :disabled="uploadUrlLoading || !uploadUrl"
          >
            <i class="fa-solid fa-cloud-arrow-down"></i>
            <span>{{ uploadUrlLoading ? t('gallery.upload.urlLoading') : t('gallery.upload.urlImport') }}</span>
          </button>
        </div>
        <p class="text-xs" :class="uploadUrlStatus === 'error' ? 'text-rose-500 dark:text-rose-400' : 'gallery-text'">
          {{ uploadUrlMessage }}
        </p>
      </div>

      <div class="space-y-3 flex-1 overflow-y-auto pr-1" v-show="uploadTab === 'pixabay'">
        <div class="flex items-center gap-2">
          <input
            type="text"
            v-model="pixabayQuery"
            class="flex-1 rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:outline-none disabled:opacity-50"
            style="--tw-ring-color: var(--gallery-accent, #10b981)"
            :placeholder="pixabayKey ? t('gallery.upload.pixabayPlaceholder') : t('gallery.upload.pixabayNoKey')"
            :disabled="!pixabayKey"
            @keydown.enter.prevent="searchPixabay()"
          />
          <button
            class="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm bg-white dark:bg-transparent transition hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
            :class="['gallery-border', 'gallery-text']"
            @click="searchPixabay()"
            :disabled="pixabayLoading || !pixabayQuery.trim() || !pixabayKey"
          >
            <i class="fa-solid fa-magnifying-glass"></i>
            <span>{{ pixabayLoading ? t('gallery.upload.pixabayLoading') : t('gallery.upload.pixabaySearch') }}</span>
          </button>
        </div>
        <p class="text-xs" :class="pixabayStatus === 'error' ? 'text-rose-500 dark:text-rose-400' : 'gallery-text'">
          {{ pixabayMessage || (!pixabayKey ? t('gallery.upload.pixabayMissingKey') : '') }}
        </p>

        <div class="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-3" v-show="pixabayResults.length > 0">
          <div
            v-for="img in pixabayResults"
            :key="img.id"
            class="relative rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-800 overflow-hidden shadow-sm"
          >
            <img :src="img.webformatURL" :alt="img.tags" class="h-32 w-full object-cover" />
            <button
              class="absolute top-2 right-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold bg-yellow-500 text-slate-900 hover:bg-yellow-400 shadow"
              @click="importFromPixabay(img.largeImageURL || img.webformatURL)"
              :disabled="uploadUrlLoading"
            >
              <i class="fa-solid fa-cloud-arrow-down"></i>
              <span>{{ t('gallery.upload.pixabayImport') }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { api } from '../../lib/api';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    allowMultiple?: boolean;
    context?: string;
    onFilesSelected?: (files: File[], context: string) => Promise<boolean | void>;
  }>(),
  {
    allowMultiple: true,
    context: 'gallery'
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'files-selected', files: File[]): void;
}>();

const { t } = useI18n();

type PixabayHit = { id: number; webformatURL: string; largeImageURL: string; tags: string };

const uploadTab = ref<'drop' | 'url' | 'pixabay'>('drop');
const uploadDragActive = ref(false);
const uploadUrl = ref('');
const uploadUrlMessage = ref('');
const uploadUrlStatus = ref<'ok' | 'error'>('ok');
const uploadUrlLoading = ref(false);
const pixabayQuery = ref('');
const pixabayLoading = ref(false);
const pixabayStatus = ref<'ok' | 'error'>('ok');
const pixabayMessage = ref('');
const pixabayResults = ref<PixabayHit[]>([]);
const pixabayKey = ref(true);

const close = () => {
  emit('update:modelValue', false);
  uploadDragActive.value = false;
};

const setUploadTab = (tab: 'drop' | 'url' | 'pixabay') => {
  uploadTab.value = tab;
  uploadUrlMessage.value = '';
  uploadUrlStatus.value = 'ok';
  pixabayMessage.value = '';
  pixabayStatus.value = 'ok';
  if (tab === 'pixabay') {
    checkPixabayKey().then(() => {
      if (pixabayKey.value) {
        searchPixabay(true);
      }
    });
  }
};

const processSelectedFiles = async (files: File[]) => {
  if (!files.length) return false;
  const selected = props.allowMultiple ? files : files.slice(0, 1);

  if (typeof props.onFilesSelected === 'function') {
    try {
      const result = await props.onFilesSelected(selected, props.context || 'gallery');
      if (result !== false) {
        close();
        return true;
      }
      uploadUrlMessage.value = t('gallery.upload.error');
      uploadUrlStatus.value = 'error';
      return false;
    } catch {
      uploadUrlMessage.value = t('gallery.upload.error');
      uploadUrlStatus.value = 'error';
      return false;
    }
  }

  emit('files-selected', selected);
  close();
  return true;
};

const handleUploadDrop = async (event: DragEvent) => {
  event.preventDefault();
  const files = Array.from(event.dataTransfer?.files || []);
  uploadDragActive.value = false;
  if (!files.length) return;
  await processSelectedFiles(files);
};

const uploadFile = async (eventOrFiles: Event | File[]) => {
  const files = Array.isArray(eventOrFiles)
    ? eventOrFiles
    : Array.from((eventOrFiles.target as HTMLInputElement)?.files || []);
  if ((eventOrFiles as Event)?.target) (eventOrFiles.target as HTMLInputElement).value = '';
  if (!files.length) return;
  await processSelectedFiles(files);
};

const uploadFromUrl = async (urlOverride = '') => {
  const targetUrl = urlOverride || uploadUrl.value;
  if (!targetUrl) return;
  uploadUrlLoading.value = true;
  uploadUrlMessage.value = '';
  uploadUrlStatus.value = 'ok';
  try {
    const res = await fetch(targetUrl, { mode: 'cors' }).catch(() => null);
    if (!res || !res.ok) throw new Error(t('gallery.upload.urlFetchError'));
    const blob = await res.blob();
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) throw new Error(t('gallery.upload.urlNotImage'));
    const urlPath = targetUrl.split('/').pop() || 'image';
    const extFromType = contentType.split('/')[1]?.split(';')[0] || 'jpg';
    const baseName = urlPath.match(/[^?#]+/)?.[0] || `upload.${extFromType}`;
    const finalName = baseName.includes('.') ? baseName : `${baseName}.${extFromType}`;
    const file = new File([blob], finalName, { type: contentType || 'image/jpeg' });
    const result = await processSelectedFiles([file]);
    if (result === false) {
      uploadUrlMessage.value = t('gallery.upload.urlImportFail');
      uploadUrlStatus.value = 'error';
    } else {
      uploadUrlMessage.value = t('gallery.upload.urlImported');
      uploadUrlStatus.value = 'ok';
      uploadUrl.value = '';
    }
  } catch (err: any) {
    uploadUrlMessage.value = err?.message || t('gallery.upload.urlImportFail');
    uploadUrlStatus.value = 'error';
  }
  uploadUrlLoading.value = false;
};

const importFromPixabay = async (url: string) => {
  if (!url) return;
  pixabayMessage.value = '';
  pixabayStatus.value = 'ok';
  await uploadFromUrl(url);
  if (uploadUrlStatus.value === 'ok') {
    pixabayMessage.value = t('gallery.upload.pixabayImportOk');
    pixabayStatus.value = 'ok';
  } else {
    pixabayMessage.value = t('gallery.upload.pixabayImportFail');
    pixabayStatus.value = 'error';
  }
};

const checkPixabayKey = async () => {
  try {
    const res = await fetch(api('/api/assets/pixabay?q='), { credentials: 'include' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data?.error === 'Missing PIXABAY_KEY') {
        pixabayKey.value = false;
        return;
      }
    }
    pixabayKey.value = true;
  } catch {
    pixabayKey.value = false;
  }
};

const searchPixabay = async (allowEmpty = false) => {
  if (!allowEmpty && !pixabayQuery.value.trim()) return;
  if (allowEmpty && !pixabayQuery.value.trim()) {
    pixabayQuery.value = 'fantasy';
  }
  pixabayLoading.value = true;
  pixabayStatus.value = 'ok';
  pixabayMessage.value = '';
  try {
    const res = await fetch(
      api(`/api/assets/pixabay?q=${encodeURIComponent(pixabayQuery.value.trim())}`),
      { credentials: 'include' }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'pixabay');
    pixabayResults.value = data.hits || [];
    pixabayStatus.value = 'ok';
  } catch {
    pixabayResults.value = [];
    pixabayStatus.value = 'error';
    pixabayMessage.value = t('gallery.upload.pixabayError');
  } finally {
    pixabayLoading.value = false;
  }
};
</script>
