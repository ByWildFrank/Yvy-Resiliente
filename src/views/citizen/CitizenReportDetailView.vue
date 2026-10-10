<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { useAsyncData } from '@/composables/useAsyncData';
import { getMyReport, withdrawMyReport } from '@/services/reports.service';
import { pushToast } from '@/composables/useToast';
import { toUserMessage } from '@/types/states';
import { LABELS, formatDateTime } from '@/config/labels';
import StateMessage from '@/components/ui/StateMessage.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import TerritorialMap from '@/components/map/TerritorialMap.vue';
import type { CitizenReport } from '@/types/domain';

const route = useRoute();
const busy = ref(false);

const reportQuery = useAsyncData<CitizenReport | null>(
  () => getMyReport(String(route.params.id)),
  { isEmpty: (d) => d === null },
);

const statusTone = (s: string): 'success' | 'warning' | 'info' | 'neutral' =>
  s === 'confirmado' ? 'success' :
  s === 'en_verificacion' ? 'warning' :
  s === 'recibido' ? 'info' : 'neutral';

async function withdraw(): Promise<void> {
  if (reportQuery.state.value.status !== 'ok') return;
  busy.value = true;
  try {
    await withdrawMyReport(String(route.params.id));
    pushToast('success', 'Reporte retirado', 'El reporte fue retirado por su autor.');
    await reportQuery.reload();
  } catch (err) {
    pushToast('error', 'No se pudo retirar', toUserMessage(err));
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-3">
    <router-link to="/ciudadano/mis-reportes" class="inline-flex items-center gap-1 text-xs text-[#4cd7f6] hover:underline">
      <span class="material-symbols-outlined text-[14px]">arrow_back</span> Volver a mis reportes
    </router-link>

    <StateMessage :state="reportQuery.state.value" @retry="reportQuery.reload()">
      <template #default="{ data }">
        <article class="bg-[#141c28] border border-[#3d494c]/40 rounded-xl p-4 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="font-mono text-sm font-bold text-[#4cd7f6]">{{ data.code }}</span>
              <StatusBadge :label="LABELS.reportStatus[data.status]" :tone="statusTone(data.status)" />
            </div>
            <StatusBadge :label="LABELS.reportType[data.type]" tone="neutral" />
          </div>

          <p class="text-sm text-[#bcc9cd] leading-relaxed">{{ data.description }}</p>

          <div class="font-mono text-[11px] text-[#869397] space-y-0.5 border-t border-[#3d494c]/20 pt-2">
            <div>Enviado: {{ formatDateTime(data.createdAt) }}</div>
            <div>Ubicación: {{ data.location.label ?? `${data.location.lat.toFixed(5)}, ${data.location.lng.toFixed(5)}` }}</div>
            <div v-if="data.photoUrl" class="text-[#4cd7f6]">Con adjunto fotográfico</div>
          </div>

          <!-- Mapa con punto de notificación fijo -->
          <div class="rounded-lg overflow-hidden border border-[#3d494c]/40">
            <TerritorialMap
              :reports="[data]"
              height-class="h-[220px]"
              :initial-center="[data.location.lat, data.location.lng]"
              :initial-zoom="13"
              :selected-id="data.id"
            />
          </div>

          <img v-if="data.photoUrl" :src="data.photoUrl" alt="Foto adjunta del reporte" class="rounded-lg border border-[#3d494c]/40 max-h-72 object-cover" />

          <!-- Línea de tiempo del reporte -->
          <div class="border-t border-[#3d494c]/20 pt-3">
            <h2 class="text-xs font-bold text-[#dbe3f4] uppercase font-mono tracking-wide mb-2">Seguimiento</h2>
            <ol class="space-y-2">
              <li v-for="(entry, idx) in data.timeline" :key="idx" class="flex gap-2">
                <span
                  :class="[
                    'w-2 h-2 rounded-full mt-1.5 shrink-0',
                    entry.status === 'confirmado' ? 'bg-[#4cd7f6]' :
                    entry.status === 'descartado' ? 'bg-[#869397]' :
                    entry.status === 'en_verificacion' ? 'bg-[#ffb77d]' : 'bg-[#06b6d4]',
                  ]"
                ></span>
                <div class="min-w-0">
                  <div class="text-xs text-[#dbe3f4] font-medium">{{ LABELS.reportStatus[entry.status] }}</div>
                  <div class="font-mono text-[10px] text-[#869397]">{{ formatDateTime(entry.at) }} · {{ entry.actorName }}</div>
                  <p v-if="entry.note" class="text-[11px] text-[#bcc9cd] mt-0.5">{{ entry.note }}</p>
                </div>
              </li>
            </ol>
          </div>

          <div v-if="data.resolutionNote" class="bg-[#18202c] border border-[#3d494c]/40 rounded p-2.5 text-xs text-[#bcc9cd]">
            <span class="font-mono text-[10px] text-[#869397] uppercase">Resolución: </span>{{ data.resolutionNote }}
          </div>

          <div class="flex items-center justify-between gap-2 border-t border-[#3d494c]/20 pt-3">
            <p class="text-[11px] text-[#869397] font-mono">
              El estado es administrado por el operativo; no puede modificarse desde acá.
            </p>
            <button
              v-if="data.status === 'recibido'"
              type="button"
              :disabled="busy"
              class="text-xs text-[#ffb4ab] hover:text-[#ffdad6] underline disabled:opacity-50"
              @click="withdraw"
            >
              {{ busy ? 'Retirando…' : 'Retirar reporte' }}
            </button>
          </div>
        </article>
      </template>
      <template #empty>
        <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-8 text-center">
          <span class="material-symbols-outlined text-3xl text-[#ffb4ab]">search_off</span>
          <p class="text-sm text-[#bcc9cd] mt-2">El reporte no existe o no te pertenece.</p>
        </div>
      </template>
    </StateMessage>
  </div>
</template>
