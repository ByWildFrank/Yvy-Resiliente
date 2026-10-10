<script setup lang="ts">
import { computed } from 'vue';
import { useAsyncData } from '@/composables/useAsyncData';
import { listPublicAlerts } from '@/services/alerts.service';
import { listIncidents } from '@/services/incidents.service';
import { listStations } from '@/services/monitoring.service';
import { territorySummary } from '@/services/kpis.service';
import { LABELS, formatTimeAgo } from '@/config/labels';
import StateMessage from '@/components/ui/StateMessage.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import TerritorialMap from '@/components/map/TerritorialMap.vue';
import type { Alert, Incident } from '@/types/domain';
import type { StationReadout } from '@/services/monitoring.service';

const alertsQuery = useAsyncData<Alert[]>(() => listPublicAlerts(), { isEmpty: (d) => d.length === 0 });
const incidentsQuery = useAsyncData<Incident[]>(() => listIncidents({ publicOnly: true }), { isEmpty: (d) => d.length === 0 });
const stationsQuery = useAsyncData<StationReadout[]>(() => listStations(), { isEmpty: (d) => d.length === 0 });

const severityOrder: Record<string, number> = { emergencia: 0, alerta: 1, aviso: 2, info: 3 };
const sortedAlerts = computed(() =>
  alertsQuery.state.value.status === 'ok'
    ? [...alertsQuery.state.value.data].sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9))
    : [],
);

const summary = computed(() => {
  const alerts = alertsQuery.state.value.status === 'ok' ? alertsQuery.state.value.data : [];
  const stations = stationsQuery.state.value.status === 'ok' ? stationsQuery.state.value.data : [];
  return territorySummary(alerts, stations);
});

const publicIncidents = computed(() =>
  incidentsQuery.state.value.status === 'ok' ? incidentsQuery.state.value.data.filter((i) => i.publicViewable) : [],
);

const severityTone = (s: string): 'critical' | 'warning' | 'info' =>
  s === 'emergencia' || s === 'alerta' ? 'critical' : s === 'aviso' ? 'warning' : 'info';
</script>

<template>
  <div class="space-y-4">
    <!-- Hero de acceso rápido -->
    <section class="bg-gradient-to-br from-[#141c28] to-[#18202c] border border-[#3d494c]/40 rounded-xl p-5">
      <h1 class="text-xl font-bold text-[#dbe3f4] tracking-tight">Información ambiental de tu territorio</h1>
      <p class="text-sm text-[#bcc9cd] mt-1 max-w-2xl">
        Consultá alertas vigentes, el estado de los ríos y los incidentes confirmados por los organismos.
        Si observás algo, reportalo: la comunidad ayuda a detectar antes.
      </p>
      <div class="flex flex-wrap gap-2 mt-4">
        <router-link
          to="/ciudadano/reportar"
          class="flex items-center gap-1.5 bg-[#a40217] hover:bg-[#c2182c] text-[#ffdad6] px-4 py-2 rounded text-sm font-semibold transition-colors"
        >
          <span class="material-symbols-outlined text-[18px]">emergency</span>
          Reportar un incidente
        </router-link>
        <router-link
          to="/ciudadano/alertas"
          class="flex items-center gap-1.5 bg-[#232a37] hover:bg-[#323947] text-[#dbe3f4] px-4 py-2 rounded text-sm font-semibold border border-[#3d494c]/40 transition-colors"
        >
          <span class="material-symbols-outlined text-[18px]">notifications</span>
          Ver alertas
        </router-link>
        <router-link
          to="/ciudadano/mapa"
          class="flex items-center gap-1.5 bg-[#232a37] hover:bg-[#323947] text-[#dbe3f4] px-4 py-2 rounded text-sm font-semibold border border-[#3d494c]/40 transition-colors"
        >
          <span class="material-symbols-outlined text-[18px]">map</span>
          Mapa público
        </router-link>
      </div>
    </section>

    <!-- Alertas públicas vigentes -->
    <section>
      <h2 class="text-sm font-bold text-[#dbe3f4] uppercase tracking-tight mb-2 flex items-center gap-1.5">
        <span class="material-symbols-outlined text-[18px] text-[#ffb77d]">notifications_active</span>
        Alertas vigentes
      </h2>
      <StateMessage :state="alertsQuery.state.value" @retry="alertsQuery.reload()">
        <template #default="{ data }">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <router-link
              v-for="alert in data"
              :key="alert.id"
              :to="`/ciudadano/alertas/${alert.id}`"
              :class="[
                'bg-[#141c28] border rounded-lg p-3 block transition-all hover:bg-[#18202c]',
                severityTone(alert.severity) === 'critical' ? 'border-[#a40217]/50' :
                severityTone(alert.severity) === 'warning' ? 'border-[#f48c24]/50' : 'border-[#3d494c]/40',
              ]"
            >
              <div class="flex items-center justify-between gap-2">
                <StatusBadge :label="LABELS.alertSeverity[alert.severity]" :tone="severityTone(alert.severity)" />
                <span class="font-mono text-[10px] text-[#869397]">{{ formatTimeAgo(alert.validFrom) }}</span>
              </div>
              <h3 class="text-sm font-semibold text-[#dbe3f4] mt-2 leading-snug">{{ alert.title }}</h3>
              <p class="text-xs text-[#bcc9cd] mt-1 line-clamp-2">{{ alert.message }}</p>
              <div class="font-mono text-[10px] text-[#4cd7f6] mt-2">{{ alert.territory }}</div>
            </router-link>
          </div>
        </template>
        <template #empty>
          <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-6 text-center">
            <span class="material-symbols-outlined text-3xl text-[#4cd7f6]">task_alt</span>
            <p class="text-sm text-[#bcc9cd] mt-1">No hay alertas públicas vigentes en este momento.</p>
          </div>
        </template>
      </StateMessage>
    </section>

    <!-- Resumen de situación + mapa -->
    <section class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div>
        <h2 class="text-sm font-bold text-[#dbe3f4] uppercase tracking-tight mb-2 flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[18px] text-[#4cd7f6]">travel_explore</span>
          Resumen por localidad
        </h2>
        <StateMessage :state="stationsQuery.state.value" @retry="stationsQuery.reload()">
          <template #default>
            <div class="space-y-2">
              <div
                v-for="row in summary"
                :key="row.territory"
                class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3 flex items-center justify-between gap-2"
              >
                <div class="min-w-0">
                  <div class="text-sm text-[#dbe3f4] font-medium truncate">{{ row.territory }}</div>
                  <div v-if="row.worstStation" class="text-xs text-[#bcc9cd] mt-0.5">
                    {{ row.worstStation.name }}: {{ row.worstStation.currentLevelM.toFixed(2) }} m
                    <span :class="row.worstStation.state === 'normal' ? 'text-[#4cd7f6]' : 'text-[#ffb77d]'">
                      ({{ LABELS.stationState[row.worstStation.state] }})
                    </span>
                  </div>
                  <div v-else class="text-xs text-[#869397] mt-0.5">Sin situación hídrica destacada</div>
                </div>
                <StatusBadge
                  v-if="row.alertCount > 0"
                  :label="`${row.alertCount} alerta${row.alertCount > 1 ? 's' : ''}`"
                  tone="warning"
                />
              </div>
              <p class="text-[11px] text-[#869397] font-mono">Resumen derivado de alertas publicadas y estaciones hidrométricas.</p>
            </div>
          </template>
          <template #empty>
            <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-6 text-center text-sm text-[#bcc9cd]">
              Sin información de localidades por ahora.
            </div>
          </template>
        </StateMessage>
      </div>

      <div>
        <h2 class="text-sm font-bold text-[#dbe3f4] uppercase tracking-tight mb-2 flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[18px] text-[#4cd7f6]">map</span>
          Incidentes difundidos
        </h2>
        <StateMessage :state="incidentsQuery.state.value" @retry="incidentsQuery.reload()">
          <template #default>
            <TerritorialMap
              :incidents="publicIncidents"
              :stations="stationsQuery.state.value.status === 'ok' ? stationsQuery.state.value.data : []"
              mode="publico"
              height-class="h-[340px]"
            />
          </template>
          <template #empty>
            <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-6 text-center text-sm text-[#bcc9cd]">
              No hay incidentes difundibles por ahora.
            </div>
          </template>
        </StateMessage>
      </div>
    </section>
  </div>
</template>
