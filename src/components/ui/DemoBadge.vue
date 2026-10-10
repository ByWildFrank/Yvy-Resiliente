<script setup lang="ts">
/**
 * Badge global de modo demo — visible permanentemente cuando el adaptador demo
 * está activo. Declara honestamente el origen de los datos.
 */
import { appConfig } from '@/config/appConfig';

defineProps<{ compact?: boolean }>();
</script>

<template>
  <div
    v-if="appConfig.isDemo"
    :class="[
      'flex items-center gap-1.5 bg-[#f48c24]/15 text-[#ffb77d] rounded border border-[#f48c24]/40 font-mono uppercase font-semibold tracking-wider shrink-0',
      compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-1 text-[10px]',
    ]"
    title="Los datos provienen del almacén local de demostración (fixtures etiquetados). No son datos operativos reales."
  >
    <span class="w-1.5 h-1.5 rounded-full bg-[#ffb77d] animate-pulse"></span>
    <span>MODO DEMO — DATOS DE DEMOSTRACIÓN</span>
  </div>
</template>
