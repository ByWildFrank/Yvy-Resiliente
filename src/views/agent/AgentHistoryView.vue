<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAsyncData } from '@/composables/useAsyncData';
import { listIncidents } from '@/services/incidents.service';
import { listOperationalActivity } from '@/services/audit.service';
import { LABELS, formatDateTime, formatTimeAgo } from '@/config/labels';
import StateMessage from '@/components/ui/StateMessage.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import type { Incident, AuditEntry } from '@/types/domain';

const activityQuery = useAsyncData<AuditEntry[]>(() => listOperationalActivity(50), { isEmpty: (d) => d.length === 0 });
const incidentsQuery = useAsyncData<Incident[]>(() => listIncidents(), { isEmpty: () => false });

const tab = ref<'actividad' | 'incidentes'>('actividad');

/** Incidentes cerrados/descartados: historial de eventos. */
const closedIncidents = computed(() => {
  if (incidentsQuery.state.value.status !== 'ok') return [];
  return incidentsQuery.state.value.data.filter((i) => ['cerrado', 'descartado', 'controlado'].includes(i.status));
});

const actionLabels: Record<string, string> = {
  'report.verified': 'Reporte verificado',
  'report.discarded': 'Reporte descartado',
  'report.closed': 'Reporte cerrado',
  'report.created': 'Reporte recibido',
  'incident.created': 'Incidente creado',
  'incident.status_changed': 'Incidente actualizado',
  'alert.published': 'Alerta publicada',
  'alert.canceled': 'Alerta cancelada',
  'scenario.run': 'Escenario ejecutado',
  'admin.sensor_changed': 'Sensor/estación actualizado',
};
</script>

<template>
  <div class="space-y-3">
    <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3">
      <h1 class="text-base font-bold text-[#dbe3f4] uppercase tracking-tight">Historial</h1>
      <p class="text-xs text-[#bcc9cd] mt-1">
        Actividad operativa registrada (auditoría de acciones de negocio) y eventos finalizados.
        Las acciones administrativas se registran por separado y son visibles para administración.
      </p>
    </div>

    <div class="flex gap-1.5 text-xs font-mono">
      <button
        type="button"
        :class="['px-3 py-1.5 rounded transition-colors', tab === 'actividad' ? 'bg-[#06b6d4] text-[#00424f] font-bold' : 'bg-[#18202c] text-[#869397] hover:text-[#dbe3f4]']"
        @click="tab = 'actividad'"
      >
        Actividad operativa
      </button>
      <button
        type="button"
        :class="['px-3 py-1.5 rounded transition-colors', tab === 'incidentes' ? 'bg-[#06b6d4] text-[#00424f] font-bold' : 'bg-[#18202c] text-[#869397] hover:text-[#dbe3f4]']"
        @click="tab = 'incidentes'"
      >
        Eventos finalizados
      </button>
    </div>

    <!-- Actividad (auditoría operativa) -->
    <StateMessage v-if="tab === 'actividad'" :state="activityQuery.state.value" @retry="activityQuery.reload()">
      <template #default="{ data }">
        <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg divide-y divide-[#3d494c]/20">
          <div v-for="entry in data" :key="entry.id" class="p-3 flex items-start gap-3">
            <span
              :class="[
                'w-2 h-2 rounded-full mt-1.5 shrink-0',
                String(entry.action).startsWith('alert') ? 'bg-[#ffb77d]' :
                String(entry.action).startsWith('report') ? 'bg-[#4cd7f6]' :
                String(entry.action).startsWith('incident') ? 'bg-[#ffb3ad]' : 'bg-[#869397]',
              ]"
            ></span>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-xs font-semibold text-[#dbe3f4]">{{ actionLabels[entry.action] ?? entry.action }}</span>
                <StatusBadge :label="entry.targetType" tone="neutral" />
                <span class="font-mono text-[10px] text-[#869397]">{{ formatTimeAgo(entry.at) }}</span>
              </div>
              <p class="text-xs text-[#bcc9cd] mt-0.5">{{ entry.details }}</p>
              <div class="font-mono text-[10px] text-[#869397] mt-0.5">{{ entry.actorName }} · {{ formatDateTime(entry.at) }}</div>
            </div>
          </div>
        </div>
      </template>
      <template #empty>
        <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-8 text-center text-sm text-[#bcc9cd]">
          Sin actividad operativa registrada todavía.
        </div>
      </template>
    </StateMessage>

    <!-- Eventos finalizados -->
    <StateMessage v-else :state="incidentsQuery.state.value" @retry="incidentsQuery.reload()">
      <template #default>
        <div v-if="closedIncidents.length === 0" class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-8 text-center text-sm text-[#bcc9cd]">
          Sin eventos finalizados por ahora.
        </div>
        <div v-else class="space-y-2">
          <router-link
            v-for="inc in closedIncidents"
            :key="inc.id"
            :to="`/agente/incidentes/${inc.id}`"
            class="block bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3 hover:bg-[#18202c] transition-colors"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="font-mono text-xs font-bold text-[#4cd7f6]">{{ inc.code }}</span>
              <StatusBadge :label="LABELS.incidentStatus[inc.status]" tone="neutral" />
            </div>
            <p class="text-xs text-[#bcc9cd] mt-1 line-clamp-2">{{ inc.description }}</p>
            <div class="font-mono text-[10px] text-[#869397] mt-1">
              {{ LABELS.incidentType[inc.type] }} · {{ formatDateTime(inc.updatedAt) }}
            </div>
          </router-link>
        </div>
      </template>
    </StateMessage>
  </div>
</template>
