<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <div v-if="loading" class="justify-center max-w-4xl mx-auto rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-sm flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
      <div class="h-5 w-5 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
      <span>{{ t('notes.loading') }}</span>
    </div>

    <section v-else class="space-y-6">
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <span class="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-900/30">
            <i class="fa-solid fa-note-sticky text-lg"></i>
          </span>
          <div>
            <h1 class="text-2xl font-semibold inline-flex items-center gap-2 notes-text">
              <span>{{ t('notes.title') }}</span>
            </h1>
            <p class="text-sm text-slate-500 dark:text-slate-200">{{ t('notes.subtitle') }}</p>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div v-if="grouped.scenarios.length === 0 && grouped.unlinked.length === 0" class="text-sm max-w-4xl mx-auto text-center text-slate-600 dark:text-slate-200 border border-dashed border-slate-300 dark:border-gray-800 rounded-lg p-4">
          {{ t('notes.none') }}
        </div>

        <div class="space-y-4 max-w-4xl mx-auto">
          <div v-for="grp in grouped.scenarios" :key="grp.scenario.id" class="rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 shadow-sm space-y-3">
            <div class="text-lg font-semibold notes-text">
              <router-link class="hover:underline" :to="`/app/scenarios`">
                {{ grp.scenario.title || grp.scenario.id }}
              </router-link>
            </div>

            <div v-if="grp.singleSceneNotes.length" class="space-y-2">
              <div v-for="note in grp.singleSceneNotes" :key="note.id" class="rounded-lg border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 shadow-sm flex items-center justify-between gap-3">
                <router-link
                  v-if="note.sessionId"
                  class="font-semibold text-slate-900 dark:text-slate-100 truncate hover:underline"
                  :to="`/app/sessions/${encodeURIComponent(note.sessionId)}/scenes${note.sceneId ? `?scene=${encodeURIComponent(note.sceneId)}` : ''}`"
                >
                  {{ note.sceneTitle || note.title || note.id }}
                </router-link>
                <span v-else class="font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {{ note.sceneTitle || note.title || note.id }}
                </span>
                <div class="flex items-center gap-2 text-xs shrink-0">
                  <button
                    class="h-8 w-8 inline-flex items-center justify-center rounded-lg border notes-border notes-text hover:bg-lime-50 dark:hover:bg-lime-900/30 transition"
                    @click="openEdit(note)"
                    :aria-label="t('notes.buttons.edit')"
                    :title="t('notes.buttons.edit')"
                  >
                    <i class="fa-solid fa-pen"></i>
                  </button>
                  <button
                    class="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-rose-200 dark:border-rose-900 bg-white dark:bg-gray-950 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition"
                    @click="openDelete(note)"
                    :aria-label="t('notes.buttons.delete')"
                    :title="t('notes.buttons.delete')"
                  >
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>

            <div class="space-y-2" v-if="grp.sessions.length">
              <div v-for="sess in grp.sessions" :key="sess.session.id" class="rounded-lg border border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/40 p-3 space-y-2">
                <div class="flex items-center justify-between">
                  <router-link
                    class="font-semibold text-slate-900 dark:text-slate-100 hover:underline"
                    :to="`/app/sessions/${encodeURIComponent(sess.session.id)}/scenes`"
                  >
                    {{ sess.session.title || sess.session.id }}
                  </router-link>
                </div>
                <div class="space-y-2">
                  <div v-for="note in sess.notes" :key="note.id" class="rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 shadow-sm transition flex items-center justify-between gap-3">
                    <router-link
                      v-if="note.sceneId"
                      class="font-semibold text-slate-900 dark:text-slate-100 truncate hover:underline"
                      :to="`/app/sessions/${encodeURIComponent(sess.session.id)}/scenes?scene=${encodeURIComponent(note.sceneId)}`"
                    >
                      {{ note.sceneTitle || note.title || note.id }}
                    </router-link>
                    <span v-else class="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {{ note.sceneTitle || note.title || note.id }}
                    </span>
                    <div class="flex items-center gap-2 text-xs shrink-0">
                      <button class="h-8 w-8 inline-flex items-center justify-center rounded-lg border notes-border notes-text hover:bg-lime-50 dark:hover:bg-lime-900/30 transition" @click="openEdit(note)">
                        <i class="fa-solid fa-pen"></i>
                      </button>
                      <button class="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-rose-200 dark:border-rose-900 bg-white dark:bg-gray-950 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition" @click="openDelete(note)">
                        <i class="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="grouped.unlinked.length" class="rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 shadow-sm space-y-2">
            <div class="text-lg font-semibold text-slate-900 dark:text-slate-100">{{ t('notes.unlinked') }}</div>
            <div class="space-y-2">
              <div v-for="note in grouped.unlinked" :key="note.id" class="rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 shadow-sm flex items-center justify-between gap-3">
                <span class="font-semibold text-slate-900 dark:text-slate-100 truncate">{{ note.title || note.id }}</span>
                <div class="flex items-center gap-2 text-xs shrink-0">
                  <button class="inline-flex items-center gap-1 px-2 py-1 rounded border border-sky-200 text-sky-700 dark:border-gray-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-slate-800 transition" @click="openEdit(note)">
                    <i class="fa-solid fa-pen"></i>
                  </button>
                  <button class="inline-flex items-center gap-1 px-2 py-1 rounded border border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition" @click="openDelete(note)">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div v-if="showEditModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full mx-4 p-4 space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold notes-text">{{ t('notes.modals.editTitle') }}</h2>
          <button class="text-slate-500 hover:text-slate-800" @click="cancelModals" :aria-label="t('notes.buttons.close')" :title="t('notes.buttons.close')">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="text-sm text-slate-500 dark:text-slate-300">{{ activeNote?.sceneTitle || activeNote?.title || activeNote?.id }}</div>
        <textarea class="w-full h-64 border border-slate-200 dark:border-gray-700 rounded-lg p-3 font-mono text-sm bg-slate-50 dark:bg-slate-800" v-model="editContent"></textarea>
        <div class="flex justify-end gap-2">
          <button class="px-3 py-2 rounded-lg border border-slate-200 dark:border-gray-700 text-sm" @click="cancelModals">{{ t('notes.buttons.cancel') }}</button>
          <button class="px-3 py-2 rounded-lg notes-bg text-sm font-semibold hover:brightness-110 transition" @click="saveEdit">{{ t('notes.buttons.save') }}</button>
        </div>
      </div>
    </div>

    <div v-if="showDeleteModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 p-4 space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-rose-600">{{ t('notes.modals.deleteTitle') }}</h2>
          <button class="text-slate-500 hover:text-slate-800" @click="cancelModals" :aria-label="t('notes.buttons.close')" :title="t('notes.buttons.close')">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <p class="text-sm text-slate-600 dark:text-slate-300">
          {{ t('notes.modals.deleteConfirm').replace('{name}', activeNote?.sceneTitle || activeNote?.title || activeNote?.id || '') }}
        </p>
        <div class="flex justify-end gap-2">
          <button class="px-3 py-2 rounded-lg border border-slate-200 dark:border-gray-700 text-sm" @click="cancelModals">{{ t('notes.buttons.cancel') }}</button>
          <button class="px-3 py-2 rounded-lg border border-rose-200 text-rose-600 text-sm font-semibold hover:bg-rose-50 dark:hover:bg-rose-900/30 transition" @click="confirmDelete">
            {{ t('notes.buttons.delete') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { api } from '../lib/api';

type Scenario = { id: string; title: string };
type Session = { id: string; title: string; scenarioId?: string | null };
type Scene = { id: string; title: string; order?: number | null; sessionId?: string | null; scenarioId?: string | null; notes?: string | null };
type Note = { id: string; title: string; content?: string | null; updatedAt?: string };

const { t } = useI18n();
const loading = ref(true);
const notes = ref<Note[]>([]);
const scenarios = ref<Scenario[]>([]);
const sessions = ref<Session[]>([]);
const scenes = ref<Scene[]>([]);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const activeNote = ref<any>(null);
const editContent = ref('');

const looksLikeNoteId = (value: string) => /^c[a-z0-9]{24,}$/i.test(value);

const fetchNotes = async () => {
  const res = await fetch(api('/api/notes'), { credentials: 'include' });
  notes.value = res.ok ? await res.json() : [];
};

const fetchScenarios = async () => {
  const res = await fetch(api('/api/scenarios'), { credentials: 'include' });
  scenarios.value = res.ok ? await res.json() : [];
};

const fetchSessions = async () => {
  const res = await fetch(api('/api/sessions'), { credentials: 'include' });
  sessions.value = res.ok ? await res.json() : [];
};

const fetchScenes = async () => {
  const res = await fetch(api('/api/scenes'), { credentials: 'include' });
  scenes.value = res.ok ? await res.json() : [];
};

const migrateLegacyNotes = async () => {
  const noteIds = new Set(notes.value.map(note => note.id));
  for (const scene of scenes.value) {
    const raw = (scene.notes || '').trim();
    if (!raw) continue;
    if (noteIds.has(raw)) continue;
    if (looksLikeNoteId(raw)) continue;
    try {
      const createRes = await fetch(api('/api/notes'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: scene.title || t('notes.sceneFallback'),
          content: raw
        })
      });
      if (!createRes.ok) continue;
      const created = await createRes.json();
      await fetch(api(`/api/scenes/${encodeURIComponent(scene.id)}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notes: created?.id || null })
      });
      scene.notes = created?.id || null;
      notes.value.unshift(created);
      noteIds.add(created.id);
    } catch {
      // noop
    }
  }
};

const grouped = computed(() => {
  const scenariosById: Record<string, Scenario> = Object.fromEntries(scenarios.value.map(s => [s.id, s]));
  const sessionsById: Record<string, Session> = Object.fromEntries(sessions.value.map(s => [s.id, s]));
  const scenesCountBySession: Record<string, number> = {};
  scenes.value.forEach(scene => {
    if (scene?.sessionId) {
      scenesCountBySession[scene.sessionId] = (scenesCountBySession[scene.sessionId] || 0) + 1;
    }
  });

  const noteUsage: Record<string, any> = {};
  scenes.value.forEach(scene => {
    const noteId = scene?.notes;
    if (!noteId) return;
    noteUsage[noteId] = {
      sessionId: scene.sessionId || null,
      scenarioId: scene.scenarioId || sessionsById[scene.sessionId || '']?.scenarioId || null,
      sceneId: scene.id || null,
      sceneTitle: scene.title || scene.id || '',
      sceneOrder: typeof scene.order === 'number' ? scene.order : 0
    };
  });

  const scenariosGrouped: Record<string, any> = {};
  const unlinked: any[] = [];

  notes.value.forEach(note => {
    const link = noteUsage[note.id];
    if (!link || !link.sessionId || !link.scenarioId) {
      unlinked.push({ ...note, sessionId: link?.sessionId || null, scenarioId: link?.scenarioId || null });
      return;
    }
    const scn = scenariosById[link.scenarioId];
    const sess = sessionsById[link.sessionId];
    if (!scn || !sess) {
      unlinked.push({ ...note, sessionId: link.sessionId, scenarioId: link.scenarioId });
      return;
    }
    if (!scenariosGrouped[scn.id]) {
      scenariosGrouped[scn.id] = { scenario: scn, sessions: {} };
    }
    if (!scenariosGrouped[scn.id].sessions[sess.id]) {
      scenariosGrouped[scn.id].sessions[sess.id] = {
        session: sess,
        notes: [],
        singleScene: (scenesCountBySession[sess.id] || 0) <= 1
      };
    }
    scenariosGrouped[scn.id].sessions[sess.id].notes.push({
      ...note,
      sessionId: sess.id,
      sceneId: link.sceneId,
      sceneTitle: link.sceneTitle,
      sceneOrder: link.sceneOrder
    });
  });

  return {
    scenarios: Object.values(scenariosGrouped).map(scn => {
      const sessionEntries = Object.values(scn.sessions);
      const multiSessions = sessionEntries.filter(s => !s.singleScene).map((sess: any) => ({
        ...sess,
        notes: sess.notes
          .map((n: any) => ({
            ...n,
            sessionId: sess.session.id,
            sceneId: n.sceneId,
            sceneTitle: n.sceneTitle || n.title || n.id
          }))
          .sort((a: any, b: any) => (a.sceneOrder || 0) - (b.sceneOrder || 0))
      }));

      const singleSceneNotes = sessionEntries
        .filter((s: any) => s.singleScene)
        .flatMap((sess: any) => sess.notes.map((n: any) => ({
          ...n,
          sceneTitle: sess.session.title || n.sceneTitle || n.title || n.id,
          sessionTitle: sess.session.title || '',
          sessionId: sess.session.id,
          sceneId: n.sceneId
        })))
        .sort((a: any, b: any) => (a.sceneOrder || 0) - (b.sceneOrder || 0));

      return {
        scenario: scn.scenario,
        sessions: multiSessions,
        singleSceneNotes
      };
    }),
    unlinked
  };
});

const openEdit = async (note: Note) => {
  activeNote.value = note;
  try {
    const res = await fetch(api(`/api/notes/${encodeURIComponent(note.id)}`), { credentials: 'include' });
    const data = res.ok ? await res.json() : null;
    editContent.value = data?.content || '';
  } catch {
    editContent.value = '';
  }
  showEditModal.value = true;
};

const saveEdit = async () => {
  if (!activeNote.value) return;
  try {
    await fetch(api(`/api/notes/${encodeURIComponent(activeNote.value.id)}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ content: editContent.value })
    });
    await fetchNotes();
  } finally {
    cancelModals();
  }
};

const openDelete = (note: Note) => {
  activeNote.value = note;
  showDeleteModal.value = true;
};

const confirmDelete = async () => {
  if (!activeNote.value) return;
  try {
    await fetch(api(`/api/notes/${encodeURIComponent(activeNote.value.id)}`), {
      method: 'DELETE',
      credentials: 'include'
    });
    await fetchNotes();
  } finally {
    cancelModals();
  }
};

const cancelModals = () => {
  showEditModal.value = false;
  showDeleteModal.value = false;
  activeNote.value = null;
  editContent.value = '';
};

onMounted(async () => {
  loading.value = true;
  await Promise.all([fetchScenarios(), fetchSessions(), fetchScenes(), fetchNotes()]);
  await migrateLegacyNotes();
  loading.value = false;
});
</script>

<style>
:root {
  --notes-accent: #0284c7;
  --notes-accent-strong: #0369a1;
}
.notes-text {
  color: var(--notes-accent);
}
.notes-border {
  border-color: var(--notes-accent);
}
.notes-bg {
  background-color: var(--notes-accent);
  color: #fff;
  border-color: var(--notes-accent);
}
</style>
