<script setup lang="ts">
import { computed } from 'vue';
import { useAsyncData } from '@/composables/useAsyncData';
import { getDashboardKpis } from '@/services/kpis.service';
import { listIncidents } from '@/services/incidents.service';
import { listReportsForAgents } from '@/services/reports.service';
import { listStations } from '@/services/monitoring.service';
import { listOperationalActivity } from '@/services/audit.service';
import { can } from '@/services/auth.service';
import { LABELS, formatTimeAgo } from '@/config/labels';
import StateMessage from '@/components/ui/StateMessage.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import KpiCard from '@/components/ui/KpiCard.vue';
import TerritorialMap from '@/components/map/TerritorialMap.vue';
import type { DashboardKpis } from '@/services/kpis.service';
import type { Incident, CitizenReport, AuditEntry } from '@/types/domain';
import type { StationReadout } from '@/services/monitoring.service';

const kpisQuery = useAsyncData<DashboardKpis>(() => getDashboardKpis());
const incidentsQuery = useAsyncData<Incident[]>(() => listIncidents());
const reportsQuery = can('reports:read')
  ? useAsyncData<CitizenReport[]>(() => listReportsForAgents({ limit: 20 }), { isEmpty: () => false })
  : null;
const stationsQuery = useAsyncData<StationReadout[]>(() => listStations());
const activityQuery = useAsyncData<AuditEntry[]>(() => listOperationalActivity(12), { isEmpty: () => false });

const kpis = computed(() => (kpisQuery.state.value.status === 'ok' ? kpisQuery.state.value.data : null));

/** Cola de triaje: incidentes activos + reportes sin resolver, priorizados. */
const triage = computed(() => {
  const incidents = incidentsQuery.state.value.status === 'ok' ? incidentsQuery.state.value.data : [];
  const reports = reportsQuery && reportsQuery.state.value.status === 'ok' ? reportsQuery.state.value.data : [];
  const items: Array<{ kind: 'incident' | 'report'; id: string; code: string; label: string; sublabel: string; status: string; tone: 'critical' | 'warning' | 'info' | 'neutral'; to: string }> = [];

  const priorityRank: Record<string, number> = { critica: 0, alta: 1, media: 2, baja: 3 };
  for (const inc of incidents) {
    if (['cerrado', 'descartado'].includes(inc.status)) continue;
    items.push({
      kind: 'incident', id: inc.id, code: inc.code,
      label: inc.description.slice(0, 90),
      sublabel: `${LABELS.incidentType[inc.type]} · ${inc.location.label ?? 'sin referencia'}`,
      status: LABELS.incidentStatus[inc.status],
      tone: inc.priority === 'critica' ? 'critical' : inc.priority === 'alta' ? 'warning' : 'info',
      to: `/agente/incidentes/${inc.id}`,
    });
  }
  for (const rep of reports) {
    if (['confirmado', 'descartado', 'cerrado'].includes(rep.status)) continue;
    items.push({
      kind: 'report', id: rep.id, code: rep.code,
      label: rep.description.slice(0, 90),
      sublabel: `Reporte ciudadano · ${rep.location.label ?? 'sin referencia'}`,
      status: LABELS.reportStatus[rep.status],
      tone: rep.status === 'en_verificacion' ? 'warning' : 'info',
      to: `/agente/reportes`,
    });
  }
  return items
    .sort((a, b) => {
      const ra = a.kind === 'incident' ? (priorityRank[a.tone === 'critical' ? 'critica' : a.tone === 'warning' ? 'alta' : 'media'] ?? 2) : 1;
      const rb = b.kind === 'incident' ? (priorityRank[b.tone === 'critical' ? 'critica' : b.tone === 'warning' ? 'alta' : 'media'] ?? 2) : 1;
      return ra - rb;
    })
    .slice(0, 8);
});
</script>

<template>
  <div class="space-y-4">
    <!-- KPIs derivados de datos reales -->
    <StateMessage :state="kpisQuery.state.value" @retry="kpisQuery.reload()">
      <template #default="{ data }">
        <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <KpiCard label="Incidentes activos" :value="data.activeIncidents" badge="operativo" :badge-tone="data.activeIncidents > 0 ? 'warning' : 'info'" hint="derivado" hint-tone="info" />
          <KpiCard label="Fuego activo" :value="data.activeFireIncidents" badge="incendios" :badge-tone="data.activeFireIncidents > 0 ? 'critical' : 'info'" hint="derivado" hint-tone="info" />
          <KpiCard label="Hídricos activos" :value="data.activeWaterIncidents" badge="agua" :badge-tone="data.activeWaterIncidents > 0 ? 'info' : 'info'" hint="derivado" hint-tone="info" />
          <KpiCard
            v-if="data.reportsPending !== null"
            label="Reportes pendientes" :value="data.reportsPending" badge="triaje" :badge-tone="data.reportsPending > 0 ? 'critical' : 'info'" hint="derivado" hint-tone="info"
          />
          <KpiCard
            v-if="data.sensorsOnline !== null"
            label="Sensores en línea" :value="`${data.sensorsOnline}/${data.sensorsTotal}`" badge="telemetría" badge-tone="info" hint="derivado" hint-tone="info"
          />
          <KpiCard label="Estaciones en aviso+" :value="`${data.stationsInAlert}/${data.stationsTotal}`" badge="hidrología" :badge-tone="data.stationsInAlert > 0 ? 'warning' : 'info'" hint="derivado" hint-tone="info" />
        </div>
      </template>
    </StateMessage>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <!-- Mapa técnico -->
      <div class="xl:col-span-2 space-y-3">
        <StateMessage :state="incidentsQuery.state.value" @retry="incidentsQuery.reload()">
          <template #default>
            <TerritorialMap
              :incidents="incidentsQuery.state.value.status === 'ok' ? incidentsQuery.state.value.data : []"
              :stations="stationsQuery.state.value.status === 'ok' ? stationsQuery.state.value.data : []"
              mode="tecnico"
              height-class="h-[420px]"
            />
          </template>
        </StateMessage>

        <!-- Actividad reciente (auditoría operativa) -->
        <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3">
          <h2 class="text-xs font-bold text-[#dbe3f4] uppercase font-mono tracking-wide mb-2 flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[16px] text-[#4cd7f6]">history</span>
            Actividad reciente
          </h2>
          <StateMessage :state="activityQuery.state.value" @retry="activityQuery.reload()">
            <template #default="{ data }">
              <div class="space-y-1.5">
                <div v-for="entry in data" :key="entry.id" class="flex items-start gap-2 text-xs">
                  <span class="w-1.5 h-1.5 rounded-full bg-[#4cd7f6] mt-1.5 shrink-0"></span>
                  <div class="min-w-0">
                    <span class="font-mono text-[10px] text-[#869397]">{{ formatTimeAgo(entry.at) }}</span>
                    <span class="text-[#bcc9cd]"> · {{ entry.actorName }}</span>
                    <div class="text-[#dbe3f4] truncate">{{ entry.details }}</div>
                  </div>
                </div>
              </div>
            </template>
            <template #empty>
              <p class="text-xs text-[#869397]">Sin actividad registrada todavía.</p>
            </template>
          </StateMessage>
        </div>
      </div>

      <!-- Cola de triaje -->
      <div class="space-y-3">
        <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3">
          <h2 class="text-xs font-bold text-[#dbe3f4] uppercase font-mono tracking-wide mb-2 flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[16px] text-[#ffb3ad]">notifications_active</span>
            Cola de triaje
            <span v-if="triage.length" class="font-mono text-[10px] bg-[#a40217] text-[#ffdad6] px-1.5 py-0.5 rounded ml-auto">
              {{ triage.length }}
            </span>
          </h2>
          <div v-if="triage.length === 0" class="text-xs text-[#869397] py-4 text-center">
            Sin elementos pendientes de atención. Datos derivados de incidentes y reportes reales.
          </div>
          <div v-else class="space-y-2">
            <router-link
              v-for="item in triage"
              :key="`${item.kind}-${item.id}`"
              :to="item.to"
              class="block bg-[#18202c] border border-[#3d494c]/30 rounded-lg p-2.5 hover:bg-[#232a37] transition-colors"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="font-mono text-[10px] font-bold" :class="item.tone === 'critical' ? 'text-[#ffb3ad]' : item.tone === 'warning' ? 'text-[#ffb77d]' : 'text-[#4cd7f6]'">
                  {{ item.code }}
                </span>
                <StatusBadge :label="item.status" :tone="item.tone" />
              </div>
              <p class="text-[11px] text-[#bcc9cd] mt-1 line-clamp-2">{{ item.label }}</p>
              <div class="font-mono text-[9px] text-[#869397] mt-0.5 truncate">{{ item.sublabel }}</div>
            </router-link>
          </div>
        </div>

        <!-- Accesos rápidos según permisos -->
        <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3 space-y-2">
          <h2 class="text-xs font-bold text-[#dbe3f4] uppercase font-mono tracking-wide">Acciones rápidas</h2>
          <router-link v-if="can('incidents:create')" to="/agente/incidentes/nuevo" class="flex items-center gap-2 bg-[#18202c] hover:bg-[#232a37] border border-[#3d494c]/30 rounded px-3 py-2 text-xs font-semibold text-[#dbe3f4]">
            <span class="material-symbols-outlined text-[16px] text-[#ffb3ad]">add_circle</span> Registrar incidente
          </router-link>
          <router-link v-if="can('reports:verify')" to="/agente/reportes" class="flex items-center gap-2 bg-[#18202c] hover:bg-[#232a37] border border-[#3d494c]/30 rounded px-3 py-2 text-xs font-semibold text-[#dbe3f4]">
            <span class="material-symbols-outlined text-[16px] text-[#4cd7f6]">fact_check</span> Verificar reportes
          </router-link>
          <router-link v-if="can('alerts:publish')" to="/agente/alertas" class="flex items-center gap-2 bg-[#18202c] hover:bg-[#232a37] border border-[#3d494c]/30 rounded px-3 py-2 text-xs font-semibold text-[#dbe3f4]">
            <span class="material-symbols-outlined text-[16px] text-[#ffb77d]">campaign</span> Gestionar alertas
          </router-link>
          <router-link v-if="can('informes:generate')" to="/agente/informes" class="flex items-center gap-2 bg-[#18202c] hover:bg-[#232a37] border border-[#3d494c]/30 rounded px-3 py-2 text-xs font-semibold text-[#dbe3f4]">
            <span class="material-symbols-outlined text-[16px] text-[#4cd7f6]">description</span> Generar informe
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
