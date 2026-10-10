<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useAsyncData } from '@/composables/useAsyncData';
import { listStations, updateStationReading } from '@/services/monitoring.service';
import { can } from '@/services/auth.service';
import { pushToast } from '@/composables/useToast';
import { toUserMessage } from '@/types/states';
import { LABELS, formatTimeAgo } from '@/config/labels';
import StateMessage from '@/components/ui/StateMessage.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import ModalDialog from '@/components/ui/ModalDialog.vue';
import type { StationReadout } from '@/services/monitoring.service';

const stationsQuery = useAsyncData<StationReadout[]>(() => listStations(), { isEmpty: (d) => d.length === 0 });
const canManage = can('sensors:manage');

const stateTone = (s: string): 'critical' | 'warning' | 'info' =>
  s === 'evacuacion' || s === 'alerta' ? 'critical' : s === 'aviso' ? 'warning' : 'info';

// Modal de carga manual
const editing = ref<StationReadout | null>(null);
const form = reactive({ currentLevelM: '', trendCmPerHour: '' });
const busy = ref(false);

function openEdit(st: StationReadout): void {
  editing.value = st;
  form.currentLevelM = String(st.currentLevelM);
  form.trendCmPerHour = st.trendCmPerHour !== null ? String(st.trendCmPerHour) : '';
}

async function submit(): Promise<void> {
  if (!editing.value) return;
  busy.value = true;
  try {
    const level = Number(form.currentLevelM.replace(',', '.'));
    const trend = form.trendCmPerHour.trim() === '' ? null : Number(form.trendCmPerHour.replace(',', '.'));
    await updateStationReading(editing.value.id, { currentLevelM: level, trendCmPerHour: trend });
    pushToast('success', 'Lectura registrada', `${editing.value.code}: ${level.toFixed(2)} m. Cambio auditado.`);
    editing.value = null;
    await stationsQuery.reload();
  } catch (err) {
    pushToast('error', 'No se pudo guardar', toUserMessage(err));
  } finally {
    busy.value = false;
  }
}

const alertsCount = computed(() =>
  stationsQuery.state.value.status === 'ok'
    ? stationsQuery.state.value.data.filter((s) => s.state === 'alerta' || s.state === 'evacuacion').length
    : 0,
);
</script>

<template>
  <div class="space-y-3">
    <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-base font-bold text-[#dbe3f4] uppercase tracking-tight">Hidrología</h1>
          <StatusBadge v-if="alertsCount > 0" :label="`${alertsCount} en alerta`" tone="critical" />
        </div>
        <p class="text-xs text-[#bcc9cd] mt-1 max-w-3xl">
          Estaciones hidrométricas de referencia con umbrales. Hasta integrar el adaptador oficial
          (fuente "Red hidrométrica oficial", pendiente), las lecturas se actualizan por carga manual auditada.
        </p>
      </div>
      <StatusBadge label="Fuente: carga manual" tone="warning" />
    </div>

    <StateMessage :state="stationsQuery.state.value" @retry="stationsQuery.reload()">
      <template #default="{ data }">
        <div class="overflow-x-auto bg-[#141c28] border border-[#3d494c]/40 rounded-lg">
          <table class="w-full text-left text-xs">
            <thead class="bg-[#070e1a] text-[#869397] font-mono text-[10px] uppercase">
              <tr>
                <th class="p-2.5">Estación</th>
                <th class="p-2.5">Nivel</th>
                <th class="p-2.5">Alerta</th>
                <th class="p-2.5">Evacuación</th>
                <th class="p-2.5">Margen</th>
                <th class="p-2.5">Tendencia</th>
                <th class="p-2.5">Estado</th>
                <th class="p-2.5">Actualizado</th>
                <th v-if="canManage" class="p-2.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#3d494c]/20">
              <tr v-for="st in data" :key="st.id" class="hover:bg-[#18202c] transition-colors">
                <td class="p-2.5">
                  <div class="font-semibold text-[#dbe3f4]">{{ st.name }}</div>
                  <div class="font-mono text-[10px] text-[#869397]">{{ st.code }} · {{ st.river }} · {{ st.province }}</div>
                </td>
                <td class="p-2.5 font-mono font-bold text-[#4cd7f6]">{{ st.currentLevelM.toFixed(2) }} m</td>
                <td class="p-2.5 font-mono text-[#ffb77d]">{{ st.alertLevelM.toFixed(2) }} m</td>
                <td class="p-2.5 font-mono text-[#ffb3ad]">{{ st.evacLevelM.toFixed(2) }} m</td>
                <td class="p-2.5 font-mono" :class="st.marginToAlertM < 0.5 ? 'text-[#ffb4ab]' : 'text-[#bcc9cd]'">
                  {{ st.marginToAlertM.toFixed(2) }} m
                </td>
                <td class="p-2.5 font-mono text-[#bcc9cd]">{{ st.trendCmPerHour !== null ? `+${st.trendCmPerHour} cm/h` : '—' }}</td>
                <td class="p-2.5">
                  <div class="flex flex-col gap-1 items-start">
                    <StatusBadge :label="LABELS.stationState[st.state]" :tone="stateTone(st.state)" />
                    <StatusBadge v-if="st.stale" label="Desactualizado" tone="warning" />
                  </div>
                </td>
                <td class="p-2.5 font-mono text-[10px] text-[#869397]">{{ formatTimeAgo(st.updatedAt) }}</td>
                <td v-if="canManage" class="p-2.5 text-right">
                  <button
                    type="button"
                    class="bg-[#18202c] hover:bg-[#232a37] text-[#4cd7f6] px-2 py-1 rounded text-[11px] font-mono border border-[#3d494c]/40"
                    @click="openEdit(st)"
                  >
                    Cargar lectura
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
      <template #empty>
        <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-8 text-center">
          <span class="material-symbols-outlined text-3xl text-[#4cd7f6]">water</span>
          <p class="text-sm text-[#bcc9cd] mt-2">Sin estaciones registradas.</p>
        </div>
      </template>
    </StateMessage>

    <ModalDialog :open="editing !== null" :title="`Cargar lectura · ${editing?.code ?? ''}`" @close="editing = null">
      <form v-if="editing" class="space-y-3" @submit.prevent="submit">
        <p class="text-xs text-[#bcc9cd]">
          {{ editing.name }} · {{ editing.river }}. Nivel actual registrado: {{ editing.currentLevelM.toFixed(2) }} m
          ({{ formatTimeAgo(editing.updatedAt) }}).
        </p>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="st-level">Nuevo nivel (m)</label>
            <input id="st-level" v-model="form.currentLevelM" type="number" step="0.01" min="0" max="30" required class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]" />
          </div>
          <div>
            <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="st-trend">Tendencia (cm/h)</label>
            <input id="st-trend" v-model="form.trendCmPerHour" type="number" step="0.1" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]" />
          </div>
        </div>
        <p class="text-[11px] text-[#869397] font-mono">La carga queda auditada con tu usuario.</p>
        <div class="flex justify-end gap-2">
          <button type="button" class="bg-[#232a37] hover:bg-[#323947] text-[#dbe3f4] px-3 py-1.5 rounded text-xs border border-[#3d494c]/40" @click="editing = null">Cancelar</button>
          <button type="submit" :disabled="busy" class="bg-[#06b6d4] hover:bg-[#4cd7f6] disabled:opacity-50 text-[#00424f] font-bold px-4 py-1.5 rounded text-xs">
            {{ busy ? 'Guardando…' : 'Registrar lectura' }}
          </button>
        </div>
      </form>
    </ModalDialog>
  </div>
</template>
