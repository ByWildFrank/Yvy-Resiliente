<script setup lang="ts">
import { authState } from '@/services/auth.service';
import ToastHost from '@/components/ui/ToastHost.vue';
</script>

<template>
  <div class="min-h-screen bg-[#0c1420] text-[#dbe3f4] font-sans antialiased">
    <!-- Splash mientras se restaura la sesión persistida -->
    <div
      v-if="!authState.initialized"
      class="min-h-screen flex flex-col items-center justify-center gap-3"
    >
      <div class="w-10 h-10 rounded bg-gradient-to-br from-[#06b6d4] to-[#00424f] flex items-center justify-center animate-pulse">
        <svg viewBox="0 0 24 24" class="w-6 h-6 text-white" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
      <p class="font-mono text-xs text-[#869397] uppercase tracking-widest">Restaurando sesión…</p>
    </div>

    <router-view v-else />

    <ToastHost />
  </div>
</template>
