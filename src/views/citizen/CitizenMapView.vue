<script setup lang="ts">
import { ref } from 'vue';
import { useAsyncData } from '@/composables/useAsyncData';
import { listIncidents } from '@/services/incidents.service';
import { listPublicNotificationPoints } from '@/services/reports.service';
import { listStations } from '@/services/monitoring.service';
import { LABELS, formatDateTime, formatTimeAgo } from '@/config/labels';
import StateMessage from '@/components/ui/StateMessage.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import TerritorialMap from '@/components/map/TerritorialMap.vue';
import type { Incident, CitizenReport } from '@/types/domain';
import type { StationReadout } from '@/services/monitoring.service';

const incidentsQuery = useAsyncData<Incident[]>(() => listIncidents({ publicOnly: true }));
const reportsQuery = useAsyncData<CitizenReport[]>(() => listPublicNotificationPoints(), { isEmpty: () => false });
const stationsQuery = useAsyncData<StationReadout[]>(() => listStations());

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
          <h1 class="text-base font-bold text-[#dbe3f4] uppercase tracking-tight">Mapa Cartográfico Real</h1>
          <p class="text-xs text-[#bcc9cd] mt-1 max-w-3xl">
            Visualización geoespacial de incidentes confirmados, puntos de notificación ciudadana y
            estaciones hidrométricas sobre el territorio de Corrientes y Chaco. Podés cambiar entre vista táctica y satelital.
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
              mode="publico"
              height-class="h-[540px]"
              :selected-id="selectedId"
              @select-incident="onSelectIncident"
              @select-report="onSelectReport"
            />
          </div>

          <!-- Panel de Detalle del Marcador Seleccionado -->
          <div class="space-y-3">
            <!-- Detalle de Incidente -->
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
                <div>📍 Ubicación: {{ selectedIncident.location.label ?? `${selectedIncident.location.lat.toFixed(4)}, ${selectedIncident.location.lng.toFixed(4)}` }}</div>
                <div>🕒 Actualizado: {{ formatTimeAgo(selectedIncident.updatedAt) }}</div>
                <div v-if="selectedIncident.areaHa">🔥 Superficie estimada: {{ selectedIncident.areaHa.toLocaleString('es-AR') }} ha</div>
                <div v-if="selectedIncident.levelM">🌊 Nivel: {{ selectedIncident.levelM.toFixed(2) }} m</div>
              </div>
            </div>

            <!-- Detalle de Punto de Notificación (Reporte Ciudadano) -->
            <div v-else-if="selectedReport" class="bg-[#141c28] border border-[#f48c24]/40 rounded-lg p-3 space-y-2 shadow-lg">
              <div class="flex items-center justify-between gap-2">
                <span class="font-mono text-xs text-[#ffb77d] font-bold">{{ selectedReport.code }}</span>
                <StatusBadge :label="LABELS.reportStatus[selectedReport.status]" tone="warning" />
              </div>
              <div class="flex items-center gap-1.5">
                <span class="material-symbols-outlined text-sm text-[#f48c24]">campaign</span>
                <span class="text-xs font-bold text-[#dbe3f4]">Punto de notificación ciudadana</span>
              </div>
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

            <div v-else class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-4 text-xs text-[#869397]">
              Seleccioná cualquier foco, punto de notificación o estación en el mapa para ver la información detallada.
            </div>

            <!-- Estaciones visibles al público -->
            <StateMessage :state="stationsQuery.state.value" @retry="stationsQuery.reload()">
              <template #default="{ data }">
                <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3 space-y-1.5">
                  <h3 class="text-xs font-bold text-[#dbe3f4] uppercase font-mono tracking-wide">Estaciones hidrométricas</h3>
                  <div v-for="st in data" :key="st.id" class="flex items-center justify-between text-xs">
                    <span class="text-[#bcc9cd] truncate">{{ st.name }}</span>
                    <span :class="st.state === 'normal' ? 'text-[#4cd7f6] font-mono' : 'text-[#ffb77d] font-mono font-bold'">
                      {{ st.currentLevelM.toFixed(2) }} m
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
