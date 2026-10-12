<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAsyncData } from '@/composables/useAsyncData';
import { listStations, listSources } from '@/services/monitoring.service';
import { fetchSmnWeather, type SmnSyncResult, type SmnObservation } from '@/integrations/smn.adapter';
import { fetchNasaFirmsHotspots, type FirmsSyncResult } from '@/integrations/nasaFirms.adapter';
import { LABELS, formatTimeAgo } from '@/config/labels';
import { pushToast } from '@/composables/useToast';
import StateMessage from '@/components/ui/StateMessage.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import type { StationReadout } from '@/services/monitoring.service';
import type { InfoSource } from '@/types/domain';

const stationsQuery = useAsyncData<StationReadout[]>(() => listStations(), { isEmpty: (d) => d.length === 0 });
const sourcesQuery = useAsyncData<InfoSource[]>(() => listSources(), { isEmpty: (d) => d.length === 0 });
const smnQuery = useAsyncData<SmnSyncResult>(() => fetchSmnWeather());
const firmsQuery = useAsyncData<FirmsSyncResult>(() => fetchNasaFirmsHotspots());

const selectedStationIndex = ref(0);
const refreshing = ref(false);

const currentSmnStation = computed<SmnObservation | null>(() => {
  if (smnQuery.state.value.status !== 'ok' || !smnQuery.state.value.data.observations.length) return null;
  return smnQuery.state.value.data.observations[selectedStationIndex.value] ?? smnQuery.state.value.data.observations[0];
});

const stateTone = (s: string): 'critical' | 'warning' | 'info' =>
  s === 'evacuacion' || s === 'alerta' ? 'critical' : s === 'aviso' ? 'warning' : 'info';

async function refreshAllData(): Promise<void> {
  refreshing.value = true;
  try {
    await Promise.all([
      stationsQuery.reload(),
      sourcesQuery.reload(),
      smnQuery.reload(),
      firmsQuery.reload(),
    ]);
    pushToast('success', 'Datos ambientales actualizados', 'SMN, INA y NASA FIRMS refrescados en tiempo real.');
  } catch (err: any) {
    pushToast('error', 'Error al actualizar', err.message);
  } finally {
    refreshing.value = false;
  }
}
</script>

<template>
  <div class="space-y-6 max-w-6xl mx-auto">
    <!-- Encabezado de la Vista -->
    <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
      <div>
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-2xl text-[#4cd7f6]">eco</span>
          <h1 class="text-lg font-bold text-[#dbe3f4] uppercase tracking-tight">Monitoreo Ambiental Territorial</h1>
        </div>
        <p class="text-xs text-[#bcc9cd] mt-1 max-w-2xl leading-relaxed">
          Yvy no depende de sensores propios: procesa y desglosa información oficial de
          <strong>Servicio Meteorológico Nacional (SMN)</strong>, <strong>Instituto Nacional del Agua (INA)</strong> y
          <strong>NASA FIRMS</strong> para anticipar riesgos en Corrientes y Chaco.
        </p>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <router-link
          to="/ciudadano/mapa"
          class="flex items-center gap-1.5 bg-[#18202c] hover:bg-[#232a37] text-[#4cd7f6] px-3.5 py-2 rounded-lg text-xs font-mono border border-[#4cd7f6]/30 transition-colors"
        >
          <span class="material-symbols-outlined text-[16px]">map</span>
          Ver todo en el Mapa
        </router-link>

        <button
          type="button"
          :disabled="refreshing"
          class="flex items-center gap-1.5 bg-[#06b6d4] hover:bg-[#4cd7f6] disabled:opacity-50 text-[#00424f] font-bold px-3.5 py-2 rounded-lg text-xs font-mono transition-colors shadow"
          @click="refreshAllData"
        >
          <span class="material-symbols-outlined text-[16px]" :class="{ 'animate-spin': refreshing }">
            {{ refreshing ? 'refresh' : 'sync' }}
          </span>
          <span>{{ refreshing ? 'Actualizando...' : 'Actualizar' }}</span>
        </button>
      </div>
    </div>

    <!-- SECCIÓN 1: SERVICIO METEOROLÓGICO NACIONAL (SMN ARGENTINA) -->
    <section class="space-y-3">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <h2 class="text-sm font-bold text-[#dbe3f4] uppercase tracking-wide flex items-center gap-2">
          <span class="material-symbols-outlined text-[18px] text-[#f48c24]">wb_sunny</span>
          Clima y Pronóstico Oficial · Servicio Meteorológico Nacional (SMN)
        </h2>
        <span class="text-[11px] font-mono text-[#869397]">Actualizado en tiempo real</span>
      </div>

      <StateMessage :state="smnQuery.state.value" @retry="smnQuery.reload()">
        <template #default="{ data }">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <!-- Tarjeta Principal del Clima Actual -->
            <div class="lg:col-span-1 bg-[#141c28] border border-[#3d494c]/40 rounded-xl p-4 space-y-4 shadow-lg flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between gap-2 border-b border-[#3d494c]/30 pb-2">
                  <span class="text-xs font-mono font-bold text-[#ffb77d] uppercase">Estación SMN</span>
                  <!-- Selector de Estación -->
                  <div class="flex gap-1 text-[10px] font-mono">
                    <button
                      v-for="(st, idx) in data.observations"
                      :key="st.station"
                      type="button"
                      :class="[
                        'px-2 py-0.5 rounded transition-colors',
                        selectedStationIndex === idx
                          ? 'bg-[#06b6d4] text-[#00424f] font-bold'
                          : 'bg-[#18202c] text-[#869397] hover:text-[#dbe3f4]'
                      ]"
                      @click="selectedStationIndex = idx"
                    >
                      {{ st.province }}
                    </button>
                  </div>
                </div>

                <div v-if="currentSmnStation" class="mt-3">
                  <div class="text-sm font-bold text-[#dbe3f4]">{{ currentSmnStation.station }}</div>
                  <div class="text-xs text-[#869397] font-mono">{{ currentSmnStation.province }} · {{ currentSmnStation.description }}</div>

                  <div class="flex items-baseline gap-3 my-3">
                    <span class="text-4xl font-extrabold text-[#4cd7f6] font-mono">{{ currentSmnStation.temperatureC }}°C</span>
                    <span v-if="currentSmnStation.apparentTempC" class="text-xs text-[#bcc9cd] font-mono">
                      ST: {{ currentSmnStation.apparentTempC }}°C
                    </span>
                  </div>

                  <div class="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-[#3d494c]/20">
                    <div class="bg-[#0c1420] p-2 rounded border border-[#3d494c]/20">
                      <div class="text-[10px] text-[#869397]">HUMEDAD</div>
                      <div class="text-[#dbe3f4] font-bold">{{ currentSmnStation.humidityPct }}%</div>
                    </div>
                    <div class="bg-[#0c1420] p-2 rounded border border-[#3d494c]/20">
                      <div class="text-[10px] text-[#869397]">VIENTO</div>
                      <div class="text-[#dbe3f4] font-bold">{{ currentSmnStation.windSpeedKmh }} km/h ({{ currentSmnStation.windDirection }})</div>
                    </div>
                    <div class="bg-[#0c1420] p-2 rounded border border-[#3d494c]/20">
                      <div class="text-[10px] text-[#869397]">RÁFAGAS</div>
                      <div class="text-[#ffb77d] font-bold">{{ currentSmnStation.windGustsKmh ?? 28 }} km/h</div>
                    </div>
                    <div class="bg-[#0c1420] p-2 rounded border border-[#3d494c]/20">
                      <div class="text-[10px] text-[#869397]">PRESIÓN</div>
                      <div class="text-[#dbe3f4] font-bold">{{ currentSmnStation.pressureHpa }} hPa</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Alerta Meteorológica Activa SAT -->
              <div v-if="data.alerts.length > 0" class="bg-[#f48c24]/15 border border-[#f48c24]/50 rounded-lg p-3 text-xs space-y-1">
                <div class="flex items-center gap-1.5 font-bold text-[#ffdcc3] font-mono uppercase text-[11px]">
                  <span class="material-symbols-outlined text-[15px] text-[#f48c24]">warning</span>
                  {{ data.alerts[0].title }}
                </div>
                <p class="text-[#dbe3f4] leading-relaxed text-[11px]">{{ data.alerts[0].description }}</p>
                <div class="text-[10px] text-[#ffb77d] font-mono pt-1">📍 Zona: {{ data.alerts[0].zone }}</div>
              </div>
            </div>

            <!-- Pronóstico Extendido a 5 Días -->
            <div class="lg:col-span-2 bg-[#141c28] border border-[#3d494c]/40 rounded-xl p-4 space-y-3 shadow-lg flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between border-b border-[#3d494c]/30 pb-2">
                  <h3 class="text-xs font-bold text-[#dbe3f4] uppercase font-mono tracking-wide">Pronóstico Extendido (5 Días)</h3>
                  <span class="text-[10px] text-[#869397] font-mono">Cuenca Corrientes - Resistencia</span>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3">
                  <div
                    v-for="f in data.forecast"
                    :key="f.date"
                    class="bg-[#0c1420] border border-[#3d494c]/30 rounded-lg p-2.5 text-center space-y-1.5"
                  >
                    <div class="text-xs font-bold font-mono text-[#ffb77d]">{{ f.dayName }}</div>
                    <div class="text-[10px] text-[#869397] font-mono">{{ f.date.slice(5) }}</div>
                    <span class="material-symbols-outlined text-2xl text-[#4cd7f6] block my-1">
                      {{ f.rainProbabilityPct > 40 ? 'rainy' : f.rainProbabilityPct > 20 ? 'partly_cloudy_day' : 'sunny' }}
                    </span>
                    <div class="font-mono text-xs font-bold text-[#dbe3f4]">
                      {{ f.tempMaxC }}° / <span class="text-[#869397]">{{ f.tempMinC }}°</span>
                    </div>
                    <div class="text-[10px] text-[#bcc9cd] truncate" :title="f.description">{{ f.description }}</div>
                    <div class="text-[10px] font-mono text-[#acedff] pt-1 border-t border-[#3d494c]/20">
                      💧 {{ f.rainProbabilityPct }}% ({{ f.precipitationMm }}mm)
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-[#18202c] border border-[#3d494c]/30 rounded-lg p-2.5 text-xs text-[#bcc9cd] flex items-center justify-between">
                <span>¿Cómo incide el clima en las alertas?</span>
                <span class="text-[11px] font-mono text-[#4cd7f6]">Ráfagas > 30 km/h aceleran el riesgo de incendios y crecidas</span>
              </div>
            </div>
          </div>
        </template>
      </StateMessage>
    </section>

    <!-- SECCIÓN 2: INSTITUTO NACIONAL DEL AGUA (INA) & PREFECTURA -->
    <section class="space-y-3">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <h2 class="text-sm font-bold text-[#dbe3f4] uppercase tracking-wide flex items-center gap-2">
          <span class="material-symbols-outlined text-[18px] text-[#4cd7f6]">water</span>
          Hidrología y Nivel de Ríos · Instituto Nacional del Agua (INA) / Prefectura
        </h2>
        <span class="text-[11px] font-mono text-[#869397]">Ríos Paraná y Paraguay</span>
      </div>

      <StateMessage :state="stationsQuery.state.value" @retry="stationsQuery.reload()">
        <template #default="{ data }">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <article
              v-for="st in data"
              :key="st.id"
              class="bg-[#141c28] border border-[#3d494c]/40 rounded-xl p-3.5 space-y-2.5 shadow-lg relative overflow-hidden"
            >
              <div class="flex items-start justify-between gap-2">
                <div>
                  <h3 class="text-sm font-bold text-[#dbe3f4] leading-tight">{{ st.name }}</h3>
                  <div class="text-[10px] font-mono text-[#869397]">{{ st.code }} · {{ st.river }} ({{ st.province }})</div>
                </div>
                <StatusBadge :label="LABELS.stationState[st.state]" :tone="stateTone(st.state)" />
              </div>

              <!-- Nivel Actual -->
              <div class="flex items-baseline justify-between pt-1">
                <div>
                  <div class="text-[10px] font-mono text-[#869397] uppercase">Altura actual</div>
                  <div class="text-2xl font-bold font-mono text-[#4cd7f6]">{{ st.currentLevelM.toFixed(2) }} m</div>
                </div>
                <div class="text-right">
                  <div class="text-[10px] font-mono text-[#869397] uppercase">Tendencia</div>
                  <div class="text-sm font-mono font-bold text-[#dbe3f4]">
                    {{ st.trendCmPerHour !== null ? `+${st.trendCmPerHour} cm/h` : 'Estable' }}
                  </div>
                </div>
              </div>

              <!-- Cotas de Referencia -->
              <div class="space-y-1 pt-2 border-t border-[#3d494c]/30 text-[11px] font-mono">
                <div class="flex justify-between text-[#bcc9cd]">
                  <span>Cota de alerta:</span>
                  <span class="font-bold text-[#ffb77d]">{{ st.alertLevelM.toFixed(2) }} m</span>
                </div>
                <div class="flex justify-between text-[#bcc9cd]">
                  <span>Cota de evacuación:</span>
                  <span class="font-bold text-[#ffb3ad]">{{ st.evacLevelM.toFixed(2) }} m</span>
                </div>
                <div class="flex justify-between text-[#869397] pt-0.5">
                  <span>Margen a alerta:</span>
                  <span :class="st.marginToAlertM < 0.5 ? 'text-[#ffb4ab] font-bold' : 'text-[#4cd7f6]'">
                    {{ st.marginToAlertM > 0 ? `${st.marginToAlertM.toFixed(2)} m` : 'Superada' }}
                  </span>
                </div>
              </div>

              <div class="pt-2 flex items-center justify-between text-[10px] font-mono border-t border-[#3d494c]/20">
                <span class="text-[#869397]">Actualizado {{ formatTimeAgo(st.updatedAt) }}</span>
                <router-link to="/ciudadano/mapa" class="text-[#4cd7f6] hover:underline flex items-center gap-0.5">
                  Ver en mapa <span class="material-symbols-outlined text-[13px]">chevron_right</span>
                </router-link>
              </div>
            </article>
          </div>
        </template>
      </StateMessage>
    </section>

    <!-- SECCIÓN 3: NASA FIRMS (VIGILANCIA SATELITAL DE FOCOS DE CALOR) -->
    <section class="space-y-3">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <h2 class="text-sm font-bold text-[#dbe3f4] uppercase tracking-wide flex items-center gap-2">
          <span class="material-symbols-outlined text-[18px] text-[#ffb4ab]">satellite_alt</span>
          Vigilancia Satelital de Focos de Calor · NASA FIRMS (VIIRS / MODIS)
        </h2>
        <span class="text-[11px] font-mono text-[#869397]">Detección térmica espacial</span>
      </div>

      <StateMessage :state="firmsQuery.state.value" @retry="firmsQuery.reload()">
        <template #default="{ data }">
          <div class="bg-[#141c28] border border-[#93000a]/40 rounded-xl p-4 space-y-4 shadow-lg">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#3d494c]/30 pb-3">
              <div>
                <div class="text-sm font-bold text-[#ffdad6]">
                  {{ data.totalActiveSpots }} anomalías térmicas activas detectadas en la región
                </div>
                <p class="text-xs text-[#bcc9cd] mt-0.5">
                  Satélites de órbita polar Suomi-NPP (VIIRS 375m) y Terra/Aqua (MODIS). Relevamiento sobre humedales, esteros y pastizales.
                </p>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-mono text-[#ffb77d] bg-[#93000a]/30 border border-[#93000a] px-2.5 py-1 rounded">
                  Superficie estimada: ~{{ data.estimatedAreaHa }} ha
                </span>
                <router-link
                  to="/ciudadano/mapa"
                  class="bg-[#232a37] hover:bg-[#323947] text-[#ffdad6] text-xs font-mono px-3 py-1 rounded border border-[#ffb4ab]/30 transition-colors"
                >
                  Ver en mapa
                </router-link>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div
                v-for="spot in data.hotspots"
                :key="spot.id"
                class="bg-[#0c1420] border border-[#3d494c]/30 rounded-lg p-3 space-y-1.5"
              >
                <div class="flex items-center justify-between">
                  <span class="font-mono text-xs font-bold text-[#ffb4ab]">🛰️ {{ spot.satellite }}</span>
                  <span class="px-1.5 py-0.5 rounded text-[10px] uppercase font-mono bg-[#93000a] text-[#ffdad6]">
                    Confianza {{ spot.confidence }}
                  </span>
                </div>
                <div class="text-xs font-semibold text-[#dbe3f4]">{{ spot.zone }}</div>
                <div class="text-[10px] font-mono text-[#bcc9cd] space-y-0.5">
                  <div>Potencia FRP: <strong class="text-[#ffdad6]">{{ spot.frpMw }} MW</strong></div>
                  <div>Brillo térmico: {{ spot.brightnessK }} K</div>
                  <div>Coordenadas: {{ spot.lat.toFixed(4) }}, {{ spot.lng.toFixed(4) }}</div>
                </div>
                <div class="text-[10px] text-[#869397] font-mono pt-1 border-t border-[#3d494c]/20">
                  Detectado {{ formatTimeAgo(spot.detectedAt) }}
                </div>
              </div>
            </div>
          </div>
        </template>
      </StateMessage>
    </section>

    <!-- SECCIÓN 4: TRANSPARENCIA Y FUENTES OFICIALES CONECTADAS -->
    <section class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-bold text-[#dbe3f4] uppercase tracking-wide flex items-center gap-2">
          <span class="material-symbols-outlined text-[18px] text-[#4cd7f6]">verified</span>
          Transparencia y Procedencia de Datos Oficiales
        </h2>
        <span class="text-[10px] font-mono text-[#869397]">Gobernanza pública de datos</span>
      </div>

      <StateMessage :state="sourcesQuery.state.value" @retry="sourcesQuery.reload()">
        <template #default="{ data }">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div
              v-for="src in data"
              :key="src.id"
              class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3 space-y-1.5 text-xs"
            >
              <div class="flex items-center justify-between gap-1">
                <h3 class="font-bold text-[#dbe3f4] text-xs truncate">{{ src.name }}</h3>
                <StatusBadge
                  :label="src.status === 'conectada' ? 'Activa' : 'Pendiente'"
                  :tone="src.status === 'conectada' ? 'success' : 'warning'"
                />
              </div>
              <div class="text-[10px] font-mono text-[#869397]">{{ src.code }} · {{ src.provider }}</div>
              <div class="text-[10px] text-[#bcc9cd] line-clamp-2">{{ src.notes ?? 'Proveedor oficial verificado.' }}</div>
              <div class="text-[10px] font-mono text-[#4cd7f6] pt-1 border-t border-[#3d494c]/20">
                Sync: {{ src.lastSyncAt ? formatTimeAgo(src.lastSyncAt) : 'sin sincronizar' }}
              </div>
            </div>
          </div>
        </template>
      </StateMessage>
    </section>
  </div>
</template>
