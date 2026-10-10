<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useAsyncData } from '@/composables/useAsyncData';
import { listStations } from '@/services/monitoring.service';
import {
  FIRE_ASSUMPTIONS, FIRE_LIMITATIONS, HYDRO_ASSUMPTIONS, HYDRO_LIMITATIONS,
  SCENARIO_ENGINE, listRecentScenarioRuns, runAndPersistScenario,
  runFireScenario, runHydroScenario,
} from '@/services/scenarios.service';
import { pushToast } from '@/composables/useToast';
import { toUserMessage } from '@/types/states';
import { formatDateTime } from '@/config/labels';
import StateMessage from '@/components/ui/StateMessage.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import type { ScenarioResults, ScenarioRun } from '@/types/domain';
import type { StationReadout } from '@/services/monitoring.service';

const mode = ref<'incendio' | 'hidrologico'>('incendio');
const stationsQuery = useAsyncData<StationReadout[]>(() => listStations(), { isEmpty: () => false });
const runsQuery = useAsyncData<ScenarioRun[]>(() => listRecentScenarioRuns(5), { isEmpty: () => false });

const fireForm = reactive({ windSpeedKmh: 30, windDirection: 'NE', relativeHumidityPct: 30, horizonHours: 6 });
const hydroForm = reactive({ stationCode: '', climbRateCmPerHour: 4, horizonHours: 6 });

const busy = ref(false);
const result = ref<{ headline: ScenarioResults['headline']; notes: string[] } | null>(null);
const errorMsg = ref('');

const selectedStation = computed(() => {
  if (stationsQuery.state.value.status !== 'ok') return null;
  return stationsQuery.state.value.data.find((s) => s.code === hydroForm.stationCode) ?? null;
});

const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];

async function run(): Promise<void> {
  busy.value = true;
  errorMsg.value = '';
  try {
    if (mode.value === 'incendio') {
      const results = runFireScenario({ ...fireForm });
      result.value = { headline: results.headline, notes: results.notes };
      await runAndPersistScenario({
        mode: 'incendio', inputs: { ...fireForm }, results,
        assumptions: FIRE_ASSUMPTIONS, limitations: FIRE_LIMITATIONS,
      });
    } else {
      if (!selectedStation.value) {
        errorMsg.value = 'Seleccioná una estación.';
        return;
      }
      const results = runHydroScenario({ ...hydroForm }, selectedStation.value);
      result.value = { headline: results.headline, notes: results.notes };
      await runAndPersistScenario({
        mode: 'hidrologico', inputs: { ...hydroForm }, results,
        assumptions: HYDRO_ASSUMPTIONS, limitations: HYDRO_LIMITATIONS,
      });
    }
    pushToast('success', 'Escenario ejecutado', 'Corrida guardada y auditada (motor de reglas demo).');
    await runsQuery.reload();
  } catch (err) {
    errorMsg.value = toUserMessage(err);
    pushToast('error', 'No se pudo ejecutar', toUserMessage(err));
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="space-y-3">
    <div class="bg-[#141c28] border border-[#f48c24]/40 rounded-lg p-3">
      <div class="flex items-center gap-2 flex-wrap">
        <h1 class="text-base font-bold text-[#dbe3f4] uppercase tracking-tight">Escenarios</h1>
        <StatusBadge label="Simulación demostrativa — no operativa" tone="warning" />
      </div>
      <p class="text-xs text-[#bcc9cd] mt-1 max-w-4xl">
        Motor <code class="text-[#ffb77d]">{{ SCENARIO_ENGINE }}</code>: reglas simples con supuestos y
        limitaciones explícitas. <strong class="text-[#ffb77d]">No es un modelo físico ni una predicción
        operativa.</strong> Cada corrida se persiste con sus entradas para trazabilidad.
        La integración de modelos reales queda documentada como pendiente.
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <!-- Parámetros -->
      <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-xl p-4 space-y-4">
        <div class="flex bg-[#070e1a] rounded p-1 border border-[#3d494c]/30">
          <button
            type="button"
            :class="['flex-1 py-1.5 rounded text-xs font-semibold', mode === 'incendio' ? 'bg-[#a40217] text-[#ffdad6]' : 'text-[#869397] hover:text-[#dbe3f4]']"
            @click="mode = 'incendio'"
          >
            Propagación de fuego
          </button>
          <button
            type="button"
            :class="['flex-1 py-1.5 rounded text-xs font-semibold', mode === 'hidrologico' ? 'bg-[#06b6d4] text-[#00424f]' : 'text-[#869397] hover:text-[#dbe3f4]']"
            @click="mode = 'hidrologico'"
          >
            Proyección hídrica
          </button>
        </div>

        <template v-if="mode === 'incendio'">
          <div>
            <div class="flex justify-between font-mono text-xs">
              <span class="text-[#869397]">Velocidad del viento</span>
              <span class="text-[#ffb77d] font-bold">{{ fireForm.windSpeedKmh }} km/h</span>
            </div>
            <input v-model.number="fireForm.windSpeedKmh" type="range" min="5" max="60" class="w-full h-1.5 bg-[#2d3542] rounded appearance-none cursor-pointer accent-[#ffb77d]" />
          </div>
          <div>
            <div class="flex justify-between font-mono text-xs">
              <span class="text-[#869397]">Humedad relativa</span>
              <span class="text-[#ffb3ad] font-bold">{{ fireForm.relativeHumidityPct }}%</span>
            </div>
            <input v-model.number="fireForm.relativeHumidityPct" type="range" min="10" max="60" class="w-full h-1.5 bg-[#2d3542] rounded appearance-none cursor-pointer accent-[#ffb3ad]" />
          </div>
          <div>
            <div class="font-mono text-xs text-[#869397] mb-1.5">Dirección del viento</div>
            <div class="grid grid-cols-4 gap-1 font-mono text-xs">
              <button
                v-for="dir in directions" :key="dir" type="button"
                :class="['p-1 rounded text-center', fireForm.windDirection === dir ? 'bg-[#06b6d4] text-[#00424f] font-bold' : 'bg-[#18202c] text-[#869397] hover:text-[#dbe3f4]']"
                @click="fireForm.windDirection = dir"
              >
                {{ dir }}
              </button>
            </div>
          </div>
        </template>

        <template v-else>
          <div>
            <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="sc-station">Estación</label>
            <select id="sc-station" v-model="hydroForm.stationCode" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]">
              <option value="" disabled>Seleccioná una estación…</option>
              <template v-if="stationsQuery.state.value.status === 'ok'">
                <option v-for="st in stationsQuery.state.value.data" :key="st.id" :value="st.code">
                  {{ st.code }} · {{ st.name }} ({{ st.currentLevelM.toFixed(2) }} m)
                </option>
              </template>
            </select>
          </div>
          <div>
            <div class="flex justify-between font-mono text-xs">
              <span class="text-[#869397]">Tasa de subida asumida</span>
              <span class="text-[#4cd7f6] font-bold">{{ hydroForm.climbRateCmPerHour }} cm/h</span>
            </div>
            <input v-model.number="hydroForm.climbRateCmPerHour" type="range" min="0" max="20" class="w-full h-1.5 bg-[#2d3542] rounded appearance-none cursor-pointer accent-[#4cd7f6]" />
          </div>
        </template>

        <div>
          <div class="flex justify-between font-mono text-xs">
            <span class="text-[#869397]">Horizonte</span>
            <span class="text-[#4cd7f6] font-bold">+{{ mode === 'incendio' ? fireForm.horizonHours : hydroForm.horizonHours }} h</span>
          </div>
          <input
            :value="mode === 'incendio' ? fireForm.horizonHours : hydroForm.horizonHours"
            type="range" min="2" max="24" step="2"
            class="w-full h-1.5 bg-[#2d3542] rounded appearance-none cursor-pointer accent-[#4cd7f6]"
            @input="mode === 'incendio' ? (fireForm.horizonHours = Number(($event.target as HTMLInputElement).value)) : (hydroForm.horizonHours = Number(($event.target as HTMLInputElement).value))"
          />
        </div>

        <p v-if="errorMsg" class="text-xs text-[#ffb3ad] bg-[#a40217]/20 border border-[#a40217]/40 rounded px-3 py-2">{{ errorMsg }}</p>

        <button
          type="button"
          :disabled="busy"
          class="w-full bg-[#a40217] hover:bg-[#c2182c] disabled:opacity-50 text-[#ffdad6] py-2 rounded text-xs font-mono font-bold"
          @click="run"
        >
          {{ busy ? 'Calculando…' : 'Ejecutar escenario (demo)' }}
        </button>
      </div>

      <!-- Resultado -->
      <div class="space-y-3">
        <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-xl p-4 min-h-[200px]">
          <h2 class="text-xs font-bold text-[#dbe3f4] uppercase font-mono tracking-wide mb-3">Resultado</h2>
          <div v-if="result" class="space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div v-for="(value, key) in result.headline" :key="key" class="bg-[#18202c] rounded p-2.5 border border-[#3d494c]/30">
                <div class="font-mono text-[10px] text-[#869397] uppercase">{{ key }}</div>
                <div class="text-xs text-[#dbe3f4] font-semibold mt-1 leading-snug">{{ value }}</div>
              </div>
            </div>
            <ul class="space-y-1">
              <li v-for="(note, idx) in result.notes" :key="idx" class="text-[11px] text-[#ffdcc3] flex gap-1.5">
                <span class="text-[#ffb77d]">▸</span>{{ note }}
              </li>
            </ul>
          </div>
          <div v-else class="flex flex-col items-center justify-center py-10 text-center gap-1">
            <span class="material-symbols-outlined text-3xl text-[#869397] opacity-60">model_training</span>
            <p class="text-xs text-[#869397]">Configurá los parámetros y ejecutá el escenario.</p>
          </div>
        </div>

        <!-- Supuestos y limitaciones -->
        <div class="bg-[#0d1522] border border-[#3d494c]/40 rounded-xl p-4 space-y-2">
          <h3 class="text-xs font-bold text-[#dbe3f4] uppercase font-mono tracking-wide">Supuestos y limitaciones</h3>
          <ul class="space-y-0.5">
            <li v-for="(a, i) in mode === 'incendio' ? FIRE_ASSUMPTIONS : HYDRO_ASSUMPTIONS" :key="`a-${i}`" class="text-[11px] text-[#bcc9cd]">• {{ a }}</li>
            <li v-for="(l, i) in mode === 'incendio' ? FIRE_LIMITATIONS : HYDRO_LIMITATIONS" :key="`l-${i}`" class="text-[11px] text-[#ffb77d]">⚠ {{ l }}</li>
          </ul>
        </div>

        <!-- Corridas recientes -->
        <StateMessage :state="runsQuery.state.value" @retry="runsQuery.reload()">
          <template #default="{ data }">
            <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-xl p-4">
              <h3 class="text-xs font-bold text-[#dbe3f4] uppercase font-mono tracking-wide mb-2">Corridas recientes</h3>
              <div class="space-y-1.5">
                <div v-for="runItem in data" :key="runItem.id" class="text-[11px] text-[#bcc9cd] flex justify-between gap-2 border-b border-[#3d494c]/20 pb-1">
                  <span>
                    <span class="font-mono text-[#4cd7f6]">{{ runItem.mode }}</span> · {{ runItem.runByName }}
                  </span>
                  <span class="font-mono text-[10px] text-[#869397] shrink-0">{{ formatDateTime(runItem.createdAt) }}</span>
                </div>
              </div>
            </div>
          </template>
          <template #empty>
            <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-xl p-4 text-[11px] text-[#869397]">
              Sin corridas registradas todavía.
            </div>
          </template>
        </StateMessage>
      </div>
    </div>
  </div>
</template>
