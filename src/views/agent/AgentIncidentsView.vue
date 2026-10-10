<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAsyncData } from '@/composables/useAsyncData';
import { listIncidents } from '@/services/incidents.service';
import { can } from '@/services/auth.service';
import { LABELS, formatTimeAgo } from '@/config/labels';
import StateMessage from '@/components/ui/StateMessage.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import type { Incident, IncidentStatus, IncidentType } from '@/types/domain';

const incidentsQuery = useAsyncData<Incident[]>(() => listIncidents(), { isEmpty: (d) => d.length === 0 });

const filterStatus = ref<'ALL' | IncidentStatus>('ALL');
const filterType = ref<'ALL' | IncidentType>('ALL');
const search = ref('');

const filtered = computed(() => {
  if (incidentsQuery.state.value.status !== 'ok') return [];
  return incidentsQuery.state.value.data.filter((inc) => {
    if (filterStatus.value !== 'ALL' && inc.status !== filterStatus.value) return false;
    if (filterType.value !== 'ALL' && inc.type !== filterType.value) return false;
    if (search.value) {
      const q = search.value.toLowerCase();
      const haystack = `${inc.code} ${inc.description} ${inc.location.label ?? ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
});

const priorityTone = (p: string): 'critical' | 'warning' | 'info' | 'neutral' =>
  p === 'critica' ? 'critical' : p === 'alta' ? 'warning' : p === 'media' ? 'info' : 'neutral';
</script>

<template>
  <div class="space-y-3">
    <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-base font-bold text-[#dbe3f4] uppercase tracking-tight">Incidentes</h1>
          <StatusBadge
            v-if="incidentsQuery.state.value.status === 'ok'"
            :label="`${incidentsQuery.state.value.data.length} registrados`"
            tone="info"
          />
        </div>
        <p class="text-xs text-[#bcc9cd] mt-1">Listado completo del almacén activo, filtrable por estado, tipo y búsqueda.</p>
      </div>
      <router-link
        v-if="can('incidents:create')"
        to="/agente/incidentes/nuevo"
        class="flex items-center gap-1.5 bg-[#06b6d4] hover:bg-[#4cd7f6] text-[#00424f] px-3 py-1.5 rounded text-xs font-semibold shrink-0"
      >
        <span class="material-symbols-outlined text-[16px]">add_circle</span> Registrar incidente
      </router-link>
    </div>

    <!-- Filtros -->
    <div class="bg-[#141c28] border border-[#3d494c]/30 rounded-lg p-2 flex flex-wrap items-center gap-2 text-xs">
      <input
        v-model="search"
        type="text"
        placeholder="Buscar por código, descripción o lugar…"
        class="flex-1 min-w-[180px] bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-1.5 text-xs text-[#dbe3f4] placeholder:text-[#869397] focus:outline-none focus:ring-1 focus:ring-[#4cd7f6]"
      />
      <select v-model="filterStatus" class="bg-[#18202c] border border-[#3d494c]/40 rounded px-2 py-1.5 text-xs text-[#dbe3f4] font-mono">
        <option value="ALL">Todos los estados</option>
        <option v-for="(lbl, key) in LABELS.incidentStatus" :key="key" :value="key">{{ lbl }}</option>
      </select>
      <select v-model="filterType" class="bg-[#18202c] border border-[#3d494c]/40 rounded px-2 py-1.5 text-xs text-[#dbe3f4] font-mono">
        <option value="ALL">Todos los tipos</option>
        <option v-for="(lbl, key) in LABELS.incidentType" :key="key" :value="key">{{ lbl }}</option>
      </select>
    </div>

    <StateMessage :state="incidentsQuery.state.value" @retry="incidentsQuery.reload()">
      <template #default>
        <div class="overflow-x-auto bg-[#141c28] border border-[#3d494c]/40 rounded-lg">
          <table class="w-full text-left text-xs">
            <thead class="bg-[#070e1a] text-[#869397] font-mono text-[10px] uppercase">
              <tr>
                <th class="p-2.5">Código</th>
                <th class="p-2.5">Tipo</th>
                <th class="p-2.5">Prioridad</th>
                <th class="p-2.5">Estado</th>
                <th class="p-2.5">Ubicación</th>
                <th class="p-2.5">Actualizado</th>
                <th class="p-2.5">Difundido</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#3d494c]/20">
              <router-link
                v-for="inc in filtered"
                :key="inc.id"
                :to="`/agente/incidentes/${inc.id}`"
                custom
                v-slot="{ navigate }"
              >
                <tr class="cursor-pointer hover:bg-[#18202c] transition-colors" @click="navigate">
                  <td class="p-2.5 font-mono font-bold text-[#4cd7f6]">{{ inc.code }}</td>
                  <td class="p-2.5"><StatusBadge :label="LABELS.incidentType[inc.type]" :tone="inc.type === 'incendio' || inc.type === 'humo' ? 'critical' : 'info'" /></td>
                  <td class="p-2.5"><StatusBadge :label="LABELS.priority[inc.priority]" :tone="priorityTone(inc.priority)" /></td>
                  <td class="p-2.5"><StatusBadge :label="LABELS.incidentStatus[inc.status]" tone="neutral" /></td>
                  <td class="p-2.5 text-[#bcc9cd] max-w-[220px] truncate">{{ inc.location.label ?? `${inc.location.lat.toFixed(3)}, ${inc.location.lng.toFixed(3)}` }}</td>
                  <td class="p-2.5 font-mono text-[10px] text-[#869397]">{{ formatTimeAgo(inc.updatedAt) }}</td>
                  <td class="p-2.5">
                    <span class="font-mono text-[10px]" :class="inc.publicViewable ? 'text-[#4cd7f6]' : 'text-[#869397]'">
                      {{ inc.publicViewable ? 'Sí' : 'No' }}
                    </span>
                  </td>
                </tr>
              </router-link>
            </tbody>
          </table>
        </div>
      </template>
      <template #empty>
        <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-8 text-center">
          <span class="material-symbols-outlined text-3xl text-[#4cd7f6]">search_off</span>
          <p class="text-sm text-[#bcc9cd] mt-2">No hay incidentes que coincidan con los filtros.</p>
        </div>
      </template>
    </StateMessage>
  </div>
</template>
