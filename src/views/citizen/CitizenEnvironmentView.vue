<script setup lang="ts">
import { useAsyncData } from '@/composables/useAsyncData';
import { listStations, listSources } from '@/services/monitoring.service';
import { LABELS, formatTimeAgo } from '@/config/labels';
import StateMessage from '@/components/ui/StateMessage.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import type { StationReadout } from '@/services/monitoring.service';
import type { InfoSource } from '@/types/domain';

const stationsQuery = useAsyncData<StationReadout[]>(() => listStations(), { isEmpty: (d) => d.length === 0 });
const sourcesQuery = useAsyncData<InfoSource[]>(() => listSources(), { isEmpty: (d) => d.length === 0 });

const stateTone = (s: string): 'critical' | 'warning' | 'info' =>
  s === 'evacuacion' || s === 'alerta' ? 'critical' : s === 'aviso' ? 'warning' : 'info';
</script>

<template>
  <div class="space-y-4">
    <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3">
      <h1 class="text-base font-bold text-[#dbe3f4] uppercase tracking-tight">Información ambiental pública</h1>
      <p class="text-xs text-[#bcc9cd] mt-1 max-w-3xl">
        Niveles de los ríos de referencia y estado de las fuentes de información de la plataforma.
        Cada dato indica su antigüedad; los proveedores externos no conectados figuran como pendientes.
      </p>
    </div>

    <!-- Estaciones hidrométricas -->
    <section>
      <h2 class="text-sm font-bold text-[#dbe3f4] uppercase tracking-tight mb-2 flex items-center gap-1.5">
        <span class="material-symbols-outlined text-[18px] text-[#4cd7f6]">water</span>
        Ríos y estaciones
      </h2>
      <StateMessage :state="stationsQuery.state.value" @retry="stationsQuery.reload()">
        <template #default="{ data }">
          <div class="overflow-x-auto bg-[#141c28] border border-[#3d494c]/40 rounded-lg">
            <table class="w-full text-left text-xs">
              <thead class="bg-[#070e1a] text-[#869397] font-mono text-[10px] uppercase">
                <tr>
                  <th class="p-2.5">Estación</th>
                  <th class="p-2.5">Río</th>
                  <th class="p-2.5">Nivel</th>
                  <th class="p-2.5">Cota alerta</th>
                  <th class="p-2.5">Cota evacuación</th>
                  <th class="p-2.5">Tendencia</th>
                  <th class="p-2.5">Estado</th>
                  <th class="p-2.5">Actualizado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#3d494c]/20">
                <tr v-for="st in data" :key="st.id">
                  <td class="p-2.5">
                    <div class="font-semibold text-[#dbe3f4]">{{ st.name }}</div>
                    <div class="font-mono text-[10px] text-[#869397]">{{ st.code }} · {{ st.province }}</div>
                  </td>
                  <td class="p-2.5 text-[#bcc9cd]">{{ st.river }}</td>
                  <td class="p-2.5 font-mono font-bold text-[#4cd7f6]">{{ st.currentLevelM.toFixed(2) }} m</td>
                  <td class="p-2.5 font-mono text-[#ffb77d]">{{ st.alertLevelM.toFixed(2) }} m</td>
                  <td class="p-2.5 font-mono text-[#ffb3ad]">{{ st.evacLevelM.toFixed(2) }} m</td>
                  <td class="p-2.5 font-mono text-[#bcc9cd]">{{ st.trendCmPerHour !== null ? `+${st.trendCmPerHour} cm/h` : '—' }}</td>
                  <td class="p-2.5">
                    <StatusBadge :label="LABELS.stationState[st.state]" :tone="stateTone(st.state)" />
                    <StatusBadge v-if="st.stale" label="Dato desactualizado" tone="warning" />
                  </td>
                  <td class="p-2.5 font-mono text-[10px] text-[#869397]">{{ formatTimeAgo(st.updatedAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
        <template #empty>
          <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-6 text-center text-sm text-[#bcc9cd]">
            Sin estaciones registradas por ahora.
          </div>
        </template>
      </StateMessage>
    </section>

    <!-- Fuentes de información -->
    <section>
      <h2 class="text-sm font-bold text-[#dbe3f4] uppercase tracking-tight mb-2 flex items-center gap-1.5">
        <span class="material-symbols-outlined text-[18px] text-[#4cd7f6]">database</span>
        Fuentes de información
      </h2>
      <StateMessage :state="sourcesQuery.state.value" @retry="sourcesQuery.reload()">
        <template #default="{ data }">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div v-for="src in data" :key="src.id" class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3 space-y-1.5">
              <div class="flex items-center justify-between gap-2">
                <h3 class="text-sm font-semibold text-[#dbe3f4]">{{ src.name }}</h3>
                <StatusBadge
                  :label="LABELS.sourceStatus[src.status]"
                  :tone="src.status === 'conectada' ? 'success' : src.status === 'pendiente' ? 'warning' : 'neutral'"
                />
              </div>
              <div class="font-mono text-[10px] text-[#869397]">{{ src.provider }} · {{ LABELS.sourceType[src.type] }}</div>
              <div class="font-mono text-[10px] text-[#bcc9cd]">Variables: {{ src.variables.join(', ') }}</div>
              <div class="font-mono text-[10px] text-[#869397]">
                Última sincronización: {{ src.lastSyncAt ? formatTimeAgo(src.lastSyncAt) : 'sin sincronizar' }}
              </div>
              <p v-if="src.notes" class="text-[11px] text-[#869397]">{{ src.notes }}</p>
            </div>
          </div>
        </template>
        <template #empty>
          <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-6 text-center text-sm text-[#bcc9cd]">
            Sin fuentes registradas.
          </div>
        </template>
      </StateMessage>
    </section>
  </div>
</template>
