<script setup lang="ts">
import { useAsyncData } from '@/composables/useAsyncData';
import { listSources } from '@/services/monitoring.service';
import { LABELS, formatTimeAgo } from '@/config/labels';
import StateMessage from '@/components/ui/StateMessage.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import type { InfoSource } from '@/types/domain';

const sourcesQuery = useAsyncData<InfoSource[]>(() => listSources(), { isEmpty: (d) => d.length === 0 });

const statusTone = (s: string): 'success' | 'warning' | 'critical' | 'neutral' =>
  s === 'conectada' ? 'success' : s === 'pendiente' ? 'warning' : s === 'error' ? 'critical' : 'neutral';
</script>

<template>
  <div class="space-y-3">
    <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3">
      <h1 class="text-base font-bold text-[#dbe3f4] uppercase tracking-tight">Fuentes de información</h1>
      <p class="text-xs text-[#bcc9cd] mt-1 max-w-3xl">
        Registro de las fuentes de datos de la plataforma con su estado REAL. Los proveedores externos
        sin integrar figuran como "Pendiente de integración" junto con las variables de entorno que
        requerirán: nunca se muestran datos como si vinieran de ellos.
      </p>
    </div>

    <StateMessage :state="sourcesQuery.state.value" @retry="sourcesQuery.reload()">
      <template #default="{ data }">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <article v-for="src in data" :key="src.id" class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3 space-y-2">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <h2 class="text-sm font-semibold text-[#dbe3f4] leading-snug">{{ src.name }}</h2>
                <div class="font-mono text-[10px] text-[#869397]">{{ src.code }} · {{ src.provider }}</div>
              </div>
              <StatusBadge :label="LABELS.sourceStatus[src.status]" :tone="statusTone(src.status)" />
            </div>

            <div class="flex flex-wrap gap-1.5">
              <StatusBadge :label="LABELS.sourceType[src.type]" tone="neutral" />
              <StatusBadge v-if="src.coverage" :label="src.coverage" tone="neutral" />
            </div>

            <div class="font-mono text-[10px] text-[#bcc9cd]">Variables: {{ src.variables.join(', ') }}{{ src.units ? ` (${src.units})` : '' }}</div>

            <div class="font-mono text-[10px] text-[#869397]">
              Última sincronización: {{ src.lastSyncAt ? formatTimeAgo(src.lastSyncAt) : 'sin sincronizar' }}
            </div>

            <div
              v-if="src.status === 'pendiente'"
              class="bg-[#f48c24]/10 border border-[#f48c24]/30 rounded p-2 space-y-1"
            >
              <p class="text-[11px] text-[#ffdcc3] leading-relaxed">{{ src.notes }}</p>
              <div v-if="src.requiresEnv.length" class="font-mono text-[10px] text-[#ffb77d]">
                Variables requeridas: {{ src.requiresEnv.join(', ') }}
              </div>
            </div>
            <p v-else-if="src.notes" class="text-[11px] text-[#869397]">{{ src.notes }}</p>
          </article>
        </div>
      </template>
      <template #empty>
        <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-8 text-center">
          <span class="material-symbols-outlined text-3xl text-[#4cd7f6]">database</span>
          <p class="text-sm text-[#bcc9cd] mt-2">Sin fuentes registradas.</p>
        </div>
      </template>
    </StateMessage>
  </div>
</template>
