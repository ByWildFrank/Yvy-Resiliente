<script setup lang="ts" generic="T">
/**
 * Renderiza los estados estandarizados de consulta (loading/error/empty)
 * y expone el contenido solo cuando hay datos (`ok`).
 */
import type { QueryState } from '@/types/states';

const props = defineProps<{
  state: QueryState<T>;
}>();

const emit = defineEmits<{ retry: [] }>();
</script>

<template>
  <!-- CARGANDO -->
  <div v-if="state.status === 'loading'" class="flex flex-col items-center justify-center gap-2 py-14 text-center">
    <span class="material-symbols-outlined text-3xl text-[#4cd7f6] animate-spin" style="animation-duration: 1.5s;">
      progress_activity
    </span>
    <p class="font-mono text-xs text-[#869397] uppercase tracking-wider">Consultando datos…</p>
  </div>

  <!-- ERROR: nunca se reemplaza por datos inventados -->
  <div v-else-if="state.status === 'error'" class="flex flex-col items-center justify-center gap-3 py-14 px-4 text-center">
    <span class="material-symbols-outlined text-3xl text-[#ffb4ab]">cloud_off</span>
    <div>
      <p class="text-sm font-semibold text-[#dbe3f4]">No se pudo consultar la información</p>
      <p class="text-xs text-[#bcc9cd] mt-1 max-w-md">{{ state.error }}</p>
    </div>
    <button
      type="button"
      class="bg-[#232a37] hover:bg-[#323947] text-[#dbe3f4] px-3 py-1.5 rounded text-xs font-mono border border-[#3d494c]/40"
      @click="emit('retry')"
    >
      Reintentar
    </button>
  </div>

  <!-- SIN RESULTADOS -->
  <div v-else-if="state.status === 'empty'" class="flex flex-col items-center justify-center gap-2 py-14 text-center">
    <slot name="empty">
      <span class="material-symbols-outlined text-3xl text-[#869397]">inbox</span>
      <p class="text-sm text-[#bcc9cd]">Sin resultados por ahora.</p>
    </slot>
  </div>

  <!-- DATOS DISPONIBLES -->
  <slot v-else-if="state.status === 'ok'" :data="state.data" />
</template>
