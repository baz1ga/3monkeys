<template>
  <main class="min-h-screen flex items-center justify-center">
    <div class="text-center space-y-3">
      <h1 class="text-3xl font-semibold">3monkeys</h1>
      <p class="text-slate-600">Base Vue prête, auth Discord côté server.</p>
      <div class="flex items-center justify-center gap-3">
        <router-link class="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500" to="/login">
          Login
        </router-link>
        <router-link class="px-4 py-2 rounded-lg border" to="/settings">
          Settings
        </router-link>
      </div>
    </div>
  </main>
</template>
