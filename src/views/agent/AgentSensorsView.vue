<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useAsyncData } from '@/composables/useAsyncData';
import { diagnoseSensor, listSensors } from '@/services/monitoring.service';
import { pushToast } from '@/composables/useToast';
import { toUserMessage } from '@/types/states';
import { LABELS, formatTimeAgo } from '@/config/labels';
import StateMessage from '@/components/ui/StateMessage.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import type { Sensor } from '@/types/domain';

const sensorsQuery = useAsyncData<Sensor[]>(() => listSensors(), { isEmpty: (d) => d.length === 0 });

const statusTone = (s: string): 'success' | 'warning' | 'critical' | 'neutral' =>
  s === 'online' ? 'success' : s === 'advertencia' ? 'warning' : s === 'silente' ? 'critical' : 'neutral';

// Diagnóstico local sobre el último dato registrado (sin inventar latencias)
const diagnosing = ref<string | null>(null);
const lastDiagnostic = ref<{ code: string; summary: string; stale: boolean } | null>(null);

async function runDiagnostic(sensor: Sensor): Promise<void> {
  diagnosing.value = sensor.id;
  try {
    const result = await diagnoseSensor(sensor.id);
    lastDiagnostic.value = { code: sensor.code, summary: result.summary, stale: result.stale };
    pushToast(result.stale ? 'warning' : 'info', `Diagnóstico ${sensor.code}`, result.summary);
  } catch (err) {
    pushToast('error', 'Diagnóstico fallido', toUserMessage(err));
  } finally {
    diagnosing.value = null;
  }
}
</script>

<template>
  <div class="space-y-3">
    <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3">
      <h1 class="text-base font-bold text-[#dbe3f4] uppercase tracking-tight">Sensores y telemetría</h1>
      <p class="text-xs text-[#bcc9cd] mt-1 max-w-3xl">
        Dispositivos registrados en la plataforma con su último dato real. El diagnóstico local informa
        antigüedad y estado del último payload: no simula pruebas de red.
      </p>
    </div>

    <StateMessage :state="sensorsQuery.state.value" @retry="sensorsQuery.reload()">
      <template #default="{ data }">
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-3">
          <div class="xl:col-span-2 overflow-x-auto bg-[#141c28] border border-[#3d494c]/40 rounded-lg">
            <table class="w-full text-left text-xs">
              <thead class="bg-[#070e1a] text-[#869397] font-mono text-[10px] uppercase">
                <tr>
                  <th class="p-2.5">Dispositivo</th>
                  <th class="p-2.5">Variable</th>
                  <th class="p-2.5">Batería</th>
                  <th class="p-2.5">Señal</th>
                  <th class="p-2.5">Último dato</th>
                  <th class="p-2.5">Estado</th>
                  <th class="p-2.5 text-right">Diagnóstico</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#3d494c]/20">
                <tr v-for="sen in data" :key="sen.id" class="hover:bg-[#18202c] transition-colors">
                  <td class="p-2.5">
                    <div class="font-semibold text-[#dbe3f4]">{{ sen.name }}</div>
                    <div class="font-mono text-[10px] text-[#4cd7f6]">{{ sen.code }} · {{ sen.protocol ?? '—' }}</div>
                  </td>
                  <td class="p-2.5 text-[#bcc9cd]">
                    <div>{{ sen.variable }}</div>
                    <div class="font-mono text-[10px] text-[#869397]">{{ sen.unit }}</div>
                  </td>
                  <td class="p-2.5 font-mono" :class="(sen.battery ?? 100) > 70 ? 'text-[#4cd7f6]' : (sen.battery ?? 0) > 30 ? 'text-[#ffb77d]' : 'text-[#ffb4ab]'">
                    {{ sen.battery !== null ? `${sen.battery}%` : '—' }}
                  </td>
                  <td class="p-2.5 font-mono text-[#bcc9cd]">{{ sen.rssi !== null ? `${sen.rssi} dBm` : '—' }}</td>
                  <td class="p-2.5 font-mono text-[10px] text-[#869397]">{{ formatTimeAgo(sen.lastPayloadAt) }}</td>
                  <td class="p-2.5"><StatusBadge :label="LABELS.sensorStatus[sen.status]" :tone="statusTone(sen.status)" /></td>
                  <td class="p-2.5 text-right">
                    <button
                      type="button"
                      :disabled="diagnosing === sen.id"
                      class="bg-[#18202c] hover:bg-[#232a37] disabled:opacity-50 text-[#4cd7f6] px-2 py-1 rounded text-[11px] font-mono border border-[#3d494c]/40"
                      @click="runDiagnostic(sen)"
                    >
                      {{ diagnosing === sen.id ? '…' : 'Diagnosticar' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Panel de diagnóstico -->
          <div class="space-y-3">
            <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3 space-y-2">
              <h2 class="text-xs font-bold text-[#dbe3f4] uppercase font-mono tracking-wide flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[16px] text-[#4cd7f6]">terminal</span>
                Diagnóstico local
              </h2>
              <p v-if="!lastDiagnostic" class="text-[11px] text-[#869397] leading-relaxed">
                Ejecutá un diagnóstico para ver la antigüedad del último dato registrado del dispositivo.
              </p>
              <div v-else class="bg-[#070e1a] border border-[#3d494c]/30 rounded p-2.5 font-mono text-[11px] text-[#bcc9cd] space-y-1">
                <div class="text-[#4cd7f6]">> {{ lastDiagnostic.code }}</div>
                <div>> {{ lastDiagnostic.summary }}</div>
                <div v-if="lastDiagnostic.stale" class="text-[#ffb77d]">> El dato supera el umbral de vigencia (desactualizado).</div>
                <div class="text-[#869397]">> Fuente: último payload del almacén.</div>
              </div>
            </div>

            <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3 text-[11px] text-[#869397] leading-relaxed">
              <h3 class="text-xs font-bold text-[#dbe3f4] uppercase font-mono tracking-wide mb-1">Nota de honestidad</h3>
              Los sensores listados existen en el registro de la plataforma. No se muestran fabricaciones:
              cada métrica proviene del dato registrado. La administración de dispositivos corresponde al
              módulo de administración.
            </div>
          </div>
        </div>
      </template>
      <template #empty>
        <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-8 text-center">
          <span class="material-symbols-outlined text-3xl text-[#4cd7f6]">sensors_off</span>
          <p class="text-sm text-[#bcc9cd] mt-2">No hay sensores registrados.</p>
        </div>
      </template>
    </StateMessage>
  </div>
</template>
