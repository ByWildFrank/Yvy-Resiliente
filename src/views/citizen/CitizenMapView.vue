<script setup lang="ts">
import { ref } from 'vue';
import { useAsyncData } from '@/composables/useAsyncData';
import { listIncidents } from '@/services/incidents.service';
import { listPublicNotificationPoints } from '@/services/reports.service';
import { listStations } from '@/services/monitoring.service';
import { fetchNasaFirmsHotspots, type ThermalHotspot } from '@/integrations/nasaFirms.adapter';
import { LABELS, formatDateTime, formatTimeAgo } from '@/config/labels';
import StateMessage from '@/components/ui/StateMessage.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import TerritorialMap from '@/components/map/TerritorialMap.vue';
import type { Incident, CitizenReport } from '@/types/domain';
import type { StationReadout } from '@/services/monitoring.service';

const incidentsQuery = useAsyncData<Incident[]>(() => listIncidents({ publicOnly: true }));
const reportsQuery = useAsyncData<CitizenReport[]>(() => listPublicNotificationPoints(), { isEmpty: () => false });
const stationsQuery = useAsyncData<StationReadout[]>(() => listStations());
const hotspotsQuery = useAsyncData<ThermalHotspot[]>(
  () => fetchNasaFirmsHotspots().then((r) => r.hotspots),
  { isEmpty: (d) => d.length === 0 },
);

const selectedId = ref<string | null>(null);
const selectedIncident = ref<Incident | null>(null);
const selectedReport = ref<CitizenReport | null>(null);

function onSelectIncident(id: string): void {
  if (!id) {
    selectedIncident.value = null;
    selectedId.value = null;
    return;
  }
  selectedReport.value = null;
  selectedId.value = id;
  if (incidentsQuery.state.value.status === 'ok') {
    selectedIncident.value = incidentsQuery.state.value.data.find((i) => i.id === id) ?? null;
  }
}

function onSelectReport(id: string): void {
  if (!id) {
    selectedReport.value = null;
    selectedId.value = null;
    return;
  }
  selectedIncident.value = null;
  selectedId.value = id;
  if (reportsQuery.state.value.status === 'ok') {
    selectedReport.value = reportsQuery.state.value.data.find((r) => r.id === id) ?? null;
  }
}
</script>

<template>
  <div class="space-y-3">
    <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 class="text-base font-bold text-[#dbe3f4] uppercase tracking-tight">Mapa Cartográfico Real y Multifuentas</h1>
          <p class="text-xs text-[#bcc9cd] mt-1 max-w-3xl">
            Visualización geoespacial de incidentes territoriales, puntos de notificación ciudadana,
            alturas hidrométricas oficiales (<strong>INA / Prefectura</strong>) y focos de calor satelitales en tiempo real (<strong>NASA FIRMS</strong>).
          </p>
        </div>
        <div class="flex items-center gap-2">
          <router-link
            to="/ciudadano/reportar"
            class="flex items-center gap-1.5 bg-[#a40217] hover:bg-[#c2182c] text-[#ffdad6] px-3 py-1.5 rounded text-xs font-semibold shadow transition-colors"
          >
            <span class="material-symbols-outlined text-[16px]">add_location_alt</span>
            Notificar incidente
          </router-link>
        </div>
      </div>
    </div>

    <StateMessage :state="incidentsQuery.state.value" @retry="incidentsQuery.reload()">
      <template #default>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div class="lg:col-span-2">
            <TerritorialMap
              :incidents="incidentsQuery.state.value.status === 'ok' ? incidentsQuery.state.value.data : []"
              :reports="reportsQuery.state.value.status === 'ok' ? reportsQuery.state.value.data : []"
              :stations="stationsQuery.state.value.status === 'ok' ? stationsQuery.state.value.data : []"
              :hotspots="hotspotsQuery.state.value.status === 'ok' ? hotspotsQuery.state.value.data : []"
              mode="publico"
              height-class="h-[560px]"
              :selected-id="selectedId"
              @select-incident="onSelectIncident"
              @select-report="onSelectReport"
            />
          </div>

          <!-- Panel Lateral de Información Multifuentas -->
          <div class="space-y-3">
            <!-- Detalle de Incidente Seleccionado -->
            <div v-if="selectedIncident" class="bg-[#141c28] border border-[#4cd7f6]/40 rounded-lg p-3 space-y-2 shadow-lg">
              <div class="flex items-center justify-between gap-2">
                <span class="font-mono text-xs text-[#4cd7f6] font-bold">{{ selectedIncident.code }}</span>
                <StatusBadge :label="LABELS.incidentStatus[selectedIncident.status]" tone="info" />
              </div>
              <StatusBadge
                :label="LABELS.incidentType[selectedIncident.type]"
                :tone="selectedIncident.type === 'incendio' || selectedIncident.type === 'humo' ? 'critical' : 'info'"
              />
              <p class="text-xs text-[#bcc9cd] leading-relaxed">{{ selectedIncident.description }}</p>
              <div class="font-mono text-[11px] text-[#869397] space-y-0.5 pt-1 border-t border-[#3d494c]/20">
                <div>📍 {{ selectedIncident.location.label ?? `${selectedIncident.location.lat.toFixed(4)}, ${selectedIncident.location.lng.toFixed(4)}` }}</div>
                <div>🕒 {{ formatTimeAgo(selectedIncident.createdAt) }}</div>
                <div v-if="selectedIncident.areaHa">🔥 Área estimada: {{ selectedIncident.areaHa }} ha</div>
              </div>
            </div>

            <!-- Detalle de Reporte Seleccionado -->
            <div v-else-if="selectedReport" class="bg-[#141c28] border border-[#ffb77d]/40 rounded-lg p-3 space-y-2 shadow-lg">
              <div class="flex items-center justify-between gap-2">
                <span class="font-mono text-xs text-[#ffb77d] font-bold">{{ selectedReport.code }}</span>
                <StatusBadge :label="LABELS.reportStatus[selectedReport.status]" tone="warning" />
              </div>
              <div class="text-xs font-semibold text-[#dbe3f4]">Reporte ciudadano · {{ LABELS.reportType[selectedReport.type] }}</div>
              <p class="text-xs text-[#bcc9cd] leading-relaxed">{{ selectedReport.description }}</p>
              <div class="font-mono text-[11px] text-[#869397] space-y-0.5 pt-1 border-t border-[#3d494c]/20">
                <div>📍 Coordenadas: {{ selectedReport.location.lat.toFixed(5) }}, {{ selectedReport.location.lng.toFixed(5) }}</div>
                <div v-if="selectedReport.location.label">📌 Referencia: {{ selectedReport.location.label }}</div>
                <div>👤 Notificado por: {{ selectedReport.createdByName }}</div>
                <div>🕒 Fecha: {{ formatTimeAgo(selectedReport.createdAt) }}</div>
                <div v-if="selectedReport.resolutionNote" class="text-[#4cd7f6]">
                  ℹ️ Estado: {{ selectedReport.resolutionNote }}
                </div>
              </div>
            </div>

            <div v-else class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3 text-xs text-[#869397]">
              Seleccioná cualquier foco, estación hidrométrica o punto de notificación en el mapa para ver la ficha completa.
            </div>

            <!-- Vigilancia Satelital de Focos de Calor (NASA FIRMS) -->
            <div class="bg-[#141c28] border border-[#93000a]/40 rounded-lg p-3 space-y-2">
              <div class="flex items-center justify-between">
                <h3 class="text-xs font-bold text-[#ffdad6] uppercase font-mono tracking-wide flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[15px] text-[#ffb4ab]">satellite_alt</span>
                  Focos Satelitales (NASA FIRMS)
                </h3>
                <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#93000a] text-[#ffdad6]">
                  {{ hotspotsQuery.state.value.status === 'ok' ? hotspotsQuery.state.value.data.length : 0 }} activos
                </span>
              </div>
              <p class="text-[11px] text-[#bcc9cd] leading-relaxed">
                Anomalías térmicas detectadas por satélites VIIRS y MODIS. Se actualizan automáticamente para prevenir propagación de incendios.
              </p>
              <div v-if="hotspotsQuery.state.value.status === 'ok'" class="space-y-1 pt-1 border-t border-[#3d494c]/20">
                <div
                  v-for="h in hotspotsQuery.state.value.data.slice(0, 3)"
                  :key="h.id"
                  class="flex items-center justify-between text-[11px] font-mono"
                >
                  <span class="text-[#ffb4ab] truncate">{{ h.zone }}</span>
                  <span class="text-[#ffdad6] font-bold">{{ h.frpMw }} MW</span>
                </div>
              </div>
            </div>

            <!-- Estaciones del Río Paraná (INA / Prefectura) -->
            <StateMessage :state="stationsQuery.state.value" @retry="stationsQuery.reload()">
              <template #default="{ data }">
                <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3 space-y-1.5">
                  <div class="flex items-center justify-between">
                    <h3 class="text-xs font-bold text-[#acedff] uppercase font-mono tracking-wide flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-[15px] text-[#4cd7f6]">water</span>
                      Nivel de Ríos (INA / Prefectura)
                    </h3>
                    <router-link to="/ciudadano/ambiente" class="text-[10px] font-mono text-[#4cd7f6] hover:underline">
                      Ver detalle
                    </router-link>
                  </div>
                  <div v-for="st in data.slice(0, 4)" :key="st.id" class="flex items-center justify-between text-xs py-0.5">
                    <span class="text-[#bcc9cd] truncate">{{ st.name }}</span>
                    <span :class="st.state === 'normal' ? 'text-[#4cd7f6] font-mono' : 'text-[#ffb77d] font-mono font-bold'">
                      {{ st.currentLevelM.toFixed(2) }} m
                      <span class="text-[10px] text-[#869397]">({{ st.trendCmPerHour !== null ? `+${st.trendCmPerHour}cm/h` : '=' }})</span>
                    </span>
                  </div>
                </div>
              </template>
              <template #empty>
                <div class="text-xs text-[#869397]">Sin estaciones registradas.</div>
              </template>
            </StateMessage>
          </div>
        </div>
      </template>
      <template #empty>
        <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-8 text-center">
          <span class="material-symbols-outlined text-3xl text-[#4cd7f6]">map</span>
          <p class="text-sm text-[#bcc9cd] mt-2">No hay incidentes difundidos en este momento.</p>
          <p class="text-xs text-[#869397] mt-1 font-mono">Última consulta: {{ formatDateTime(new Date().toISOString()) }}</p>
        </div>
      </template>
    </StateMessage>
  </div>
</template>
