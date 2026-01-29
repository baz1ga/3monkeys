<template>
  <main class="min-h-screen bg-slate-50 p-6">
    <div class="max-w-2xl mx-auto space-y-4">
      <div class="bg-white rounded-2xl shadow p-6">
        <h1 class="text-xl font-semibold">Mon espace</h1>
        <div v-if="loading" class="text-slate-500 mt-3">Chargement…</div>
        <div v-else class="mt-4 space-y-2">
          <div class="flex items-center gap-3">
            <img v-if="user?.avatarUrl" :src="user.avatarUrl" class="h-12 w-12 rounded-full" />
            <div>
              <div class="font-semibold">{{ user?.displayName || user?.email }}</div>
              <div class="text-sm text-slate-500">{{ user?.email }}</div>
            </div>
          </div>
          <div class="text-sm text-slate-600">Role: {{ user?.role }}</div>
          <div class="text-sm text-slate-600">Tenant: {{ user?.tenant?.name }}</div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '../lib/api';

type UserPayload = {
  id: string;
  email: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  role: string;
  tenant?: { id: string; name: string } | null;
};

const user = ref<UserPayload | null>(null);
const loading = ref(true);

onMounted(async () => {
  try {
    const res = await fetch(api('/auth/me'), { credentials: 'include' });
    if (res.ok) {
      user.value = await res.json();
    }
  } finally {
    loading.value = false;
  }
});
</script>
