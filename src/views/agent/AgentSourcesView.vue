<script setup lang="ts">
import { ref } from 'vue';
import { useAsyncData } from '@/composables/useAsyncData';
import { listSources } from '@/services/monitoring.service';
import { syncAllOfficialSources, syncSmnSource, syncInaSource, syncNasaFirmsSource } from '@/services/externalSources.service';
import { pushToast } from '@/composables/useToast';
import { LABELS, formatTimeAgo } from '@/config/labels';
import StateMessage from '@/components/ui/StateMessage.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import type { InfoSource } from '@/types/domain';

const sourcesQuery = useAsyncData<InfoSource[]>(() => listSources(), { isEmpty: (d) => d.length === 0 });
const syncing = ref(false);

const statusTone = (s: string): 'success' | 'warning' | 'critical' | 'neutral' =>
  s === 'conectada' ? 'success' : s === 'pendiente' ? 'warning' : s === 'error' ? 'critical' : 'neutral';

async function handleSyncAll(): Promise<void> {
  syncing.value = true;
  try {
    const report = await syncAllOfficialSources();
    pushToast(
      'success',
      'Fuentes sincronizadas con éxito',
      `SMN (${report.smn.observations.length} estaciones), INA (${report.ina.ports.length} puertos), NASA FIRMS (${report.firms.totalActiveSpots} focos).`,
    );
    await sourcesQuery.reload();
  } catch (err: any) {
    pushToast('error', 'Fallo en sincronización', err.message ?? 'No se pudo sincronizar.');
  } finally {
    syncing.value = false;
  }
}

async function handleSyncSingle(code: string): Promise<void> {
  syncing.value = true;
  try {
    if (code === 'SMN-RED') {
      const res = await syncSmnSource();
      pushToast('success', 'SMN Sincronizado', `${res.observations.length} estaciones meteorológicas actualizadas.`);
    } else if (code === 'INA-SINA') {
      const res = await syncInaSource();
      pushToast('success', 'INA Sincronizado', `${res.ports.length} estaciones hidrométricas del Río Paraná actualizadas.`);
    } else if (code === 'NASA-FIRMS') {
      const res = await syncNasaFirmsSource();
      pushToast('success', 'NASA FIRMS Sincronizado', `${res.totalActiveSpots} anomalías térmicas detectadas en el NEA.`);
    }
    await sourcesQuery.reload();
  } catch (err: any) {
    pushToast('error', 'Error de sincronización', err.message);
  } finally {
    syncing.value = false;
  }
}
</script>

<template>
  <div class="space-y-3">
    <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 class="text-base font-bold text-[#dbe3f4] uppercase tracking-tight">Fuentes de información oficiales</h1>
        <p class="text-xs text-[#bcc9cd] mt-1 max-w-2xl">
          Conexiones en tiempo real con proveedores oficiales: <strong>SMN Argentina</strong> (clima),
          <strong>INA / Prefectura</strong> (hidrología y cotas de ríos) y <strong>NASA FIRMS</strong> (focos satelitales).
        </p>
      </div>

      <button
        type="button"
        :disabled="syncing"
        class="flex items-center justify-center gap-1.5 bg-[#06b6d4] hover:bg-[#4cd7f6] disabled:opacity-50 text-[#00424f] font-bold text-xs font-mono px-3.5 py-2 rounded-lg transition-colors shrink-0 shadow-lg"
        @click="handleSyncAll"
      >
        <span class="material-symbols-outlined text-[16px]" :class="{ 'animate-spin': syncing }">
          {{ syncing ? 'refresh' : 'sync' }}
        </span>
        <span>{{ syncing ? 'Sincronizando fuentes...' : 'Sincronizar fuentes ahora' }}</span>
      </button>
    </div>

    <StateMessage :state="sourcesQuery.state.value" @retry="sourcesQuery.reload()">
      <template #default="{ data }">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <article v-for="src in data" :key="src.id" class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3 space-y-2.5">
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

            <div class="flex items-center justify-between pt-1 border-t border-[#3d494c]/20">
              <div class="font-mono text-[10px] text-[#869397]">
                Última sincronización: {{ src.lastSyncAt ? formatTimeAgo(src.lastSyncAt) : 'sin sincronizar' }}
              </div>

              <button
                v-if="src.code === 'SMN-RED' || src.code === 'INA-SINA' || src.code === 'NASA-FIRMS'"
                type="button"
                :disabled="syncing"
                class="text-[10px] font-mono text-[#4cd7f6] hover:underline flex items-center gap-1 disabled:opacity-40"
                @click="handleSyncSingle(src.code)"
              >
                <span class="material-symbols-outlined text-[12px]">sync</span>
                <span>Actualizar</span>
              </button>
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
            <p v-else-if="src.notes" class="text-[11px] text-[#869397] leading-relaxed">{{ src.notes }}</p>
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
