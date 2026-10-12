<script setup lang="ts">
import { ref } from 'vue';
import { useAsyncData } from '@/composables/useAsyncData';
import { listIncidents } from '@/services/incidents.service';
import { listReportsForAgents } from '@/services/reports.service';
import { listStations, listSensors } from '@/services/monitoring.service';
import { fetchNasaFirmsHotspots, type ThermalHotspot } from '@/integrations/nasaFirms.adapter';
import { can } from '@/services/auth.service';
import { LABELS, formatTimeAgo } from '@/config/labels';
import StateMessage from '@/components/ui/StateMessage.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import TerritorialMap from '@/components/map/TerritorialMap.vue';
import type { Incident, Sensor, CitizenReport } from '@/types/domain';
import type { StationReadout } from '@/services/monitoring.service';

const incidentsQuery = useAsyncData<Incident[]>(() => listIncidents());
const reportsQuery = can('reports:read')
  ? useAsyncData<CitizenReport[]>(() => listReportsForAgents({ limit: 50 }), { isEmpty: () => false })
  : null;
const stationsQuery = useAsyncData<StationReadout[]>(() => listStations());
const sensorsQuery = useAsyncData<Sensor[]>(() => listSensors(), { isEmpty: () => false });
const hotspotsQuery = useAsyncData<ThermalHotspot[]>(() => fetchNasaFirmsHotspots().then(r => r.hotspots), { isEmpty: () => false });

const selectedId = ref<string | null>(null);
const selectedType = ref<'incident' | 'report' | null>(null);

function onSelectIncident(id: string): void {
  selectedId.value = id || null;
  selectedType.value = id ? 'incident' : null;
}

function onSelectReport(id: string): void {
  selectedId.value = id || null;
  selectedType.value = id ? 'report' : null;
}
</script>

<template>
  <div class="space-y-3">
    <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3 flex items-center justify-between flex-wrap gap-2">
      <div>
        <h1 class="text-base font-bold text-[#dbe3f4] uppercase tracking-tight">Mapa Cartográfico Operativo</h1>
        <p class="text-xs text-[#bcc9cd] mt-1">
          Visualizador geoespacial táctico con incidentes activos, puntos de notificación ciudadana georreferenciados,
          estaciones de aforo y sensores telemétricos en tiempo real.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <router-link
          v-if="can('incidents:create')"
          to="/agente/incidentes/nuevo"
          class="flex items-center gap-1.5 bg-[#06b6d4] hover:bg-[#4cd7f6] text-[#00424f] px-3 py-1.5 rounded text-xs font-bold shadow transition-colors"
        >
          <span class="material-symbols-outlined text-[16px]">add_location</span>
          Nuevo Incidente
        </router-link>
        <StatusBadge label="Base de datos: Firestore" tone="info" />
      </div>
    </div>

    <StateMessage :state="incidentsQuery.state.value" @retry="incidentsQuery.reload()">
      <template #default>
        <div class="grid grid-cols-1 xl:grid-cols-4 gap-3">
          <div class="xl:col-span-3">
            <TerritorialMap
              :incidents="incidentsQuery.state.value.status === 'ok' ? incidentsQuery.state.value.data : []"
              :reports="reportsQuery && reportsQuery.state.value.status === 'ok' ? reportsQuery.state.value.data : []"
              :stations="stationsQuery.state.value.status === 'ok' ? stationsQuery.state.value.data : []"
              :hotspots="hotspotsQuery.state.value.status === 'ok' ? hotspotsQuery.state.value.data : []"
              :sensors="sensorsQuery.state.value.status === 'ok' ? sensorsQuery.state.value.data : []"
              mode="tecnico"
              height-class="h-[600px]"
              :selected-id="selectedId"
              @select-incident="onSelectIncident"
              @select-report="onSelectReport"
            />
          </div>

          <div class="space-y-2">
            <!-- Detalle de Incidente Seleccionado -->
            <div
              v-if="selectedType === 'incident' && selectedId && incidentsQuery.state.value.status === 'ok'"
              class="bg-[#141c28] border border-[#4cd7f6]/40 rounded-lg p-3 space-y-1.5 shadow-lg"
            >
              <template v-for="inc in incidentsQuery.state.value.data" :key="inc.id">
                <div v-if="inc.id === selectedId" class="space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="font-mono text-xs font-bold text-[#4cd7f6]">{{ inc.code }}</span>
                    <StatusBadge :label="LABELS.incidentStatus[inc.status]" tone="info" />
                  </div>
                  <StatusBadge :label="LABELS.priority[inc.priority]" :tone="inc.priority === 'critica' ? 'critical' : 'warning'" />
                  <p class="text-[11px] text-[#bcc9cd] leading-relaxed">{{ inc.description }}</p>
                  <div class="text-[10px] text-[#869397] font-mono space-y-0.5 border-t border-[#3d494c]/20 pt-1">
                    <div>📍 {{ inc.location.label ?? `${inc.location.lat.toFixed(4)}, ${inc.location.lng.toFixed(4)}` }}</div>
                    <div>🕒 {{ formatTimeAgo(inc.updatedAt) }}</div>
                  </div>
                  <router-link :to="`/agente/incidentes/${inc.id}`" class="block text-xs text-[#4cd7f6] hover:underline font-mono pt-1">
                    Abrir ficha completa →
                  </router-link>
                </div>
              </template>
            </div>

            <!-- Detalle de Punto de Notificación Seleccionado -->
            <div
              v-else-if="selectedType === 'report' && selectedId && reportsQuery && reportsQuery.state.value.status === 'ok'"
              class="bg-[#141c28] border border-[#f48c24]/40 rounded-lg p-3 space-y-1.5 shadow-lg"
            >
              <template v-for="rep in reportsQuery.state.value.data" :key="rep.id">
                <div v-if="rep.id === selectedId" class="space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="font-mono text-xs font-bold text-[#ffb77d]">{{ rep.code }}</span>
                    <StatusBadge :label="LABELS.reportStatus[rep.status]" tone="warning" />
                  </div>
                  <div class="text-xs font-bold text-[#dbe3f4]">Reporte: {{ LABELS.reportType[rep.type] }}</div>
                  <p class="text-[11px] text-[#bcc9cd] leading-relaxed">{{ rep.description }}</p>
                  <div class="text-[10px] text-[#869397] font-mono space-y-0.5 border-t border-[#3d494c]/20 pt-1">
                    <div>📍 Coord: {{ rep.location.lat.toFixed(5) }}, {{ rep.location.lng.toFixed(5) }}</div>
                    <div>👤 Por: {{ rep.createdByName }}</div>
                    <div>🕒 {{ formatTimeAgo(rep.createdAt) }}</div>
                  </div>
                  <router-link to="/agente/reportes" class="block text-xs text-[#ffb77d] hover:underline font-mono pt-1">
                    Ir al panel de triaje y verificación →
                  </router-link>
                </div>
              </template>
            </div>

            <!-- Sensores en el mapa -->
            <StateMessage :state="sensorsQuery.state.value" @retry="sensorsQuery.reload()">
              <template #default="{ data }">
                <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3 space-y-1">
                  <h3 class="text-xs font-bold text-[#dbe3f4] uppercase font-mono tracking-wide">Sensores IoT</h3>
                  <div v-for="sen in data" :key="sen.id" class="flex items-center justify-between text-[11px] py-0.5 border-b border-[#3d494c]/10">
                    <span class="text-[#bcc9cd] truncate max-w-[140px]">{{ sen.code }} · {{ sen.name }}</span>
                    <span
                      :class="[
                        'font-mono text-[10px]',
                        sen.status === 'online' ? 'text-[#4cd7f6]' : sen.status === 'silente' ? 'text-[#ffb4ab]' : 'text-[#ffb77d]',
                      ]"
                    >
                      {{ sen.status }}
                    </span>
                  </div>
                </div>
              </template>
              <template #empty>
                <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3 text-[11px] text-[#869397]">
                  Sin sensores registrados o sin permiso para verlos.
                </div>
              </template>
            </StateMessage>
          </div>
        </div>
      </template>
    </StateMessage>
  </div>
</template>
