<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useAsyncData } from '@/composables/useAsyncData';
import { listReportsForAgents, resolveReport, startReportVerification } from '@/services/reports.service';
import { can } from '@/services/auth.service';
import { pushToast } from '@/composables/useToast';
import { toUserMessage } from '@/types/states';
import { LABELS, formatTimeAgo } from '@/config/labels';
import { REPORT_STATUSES, type CitizenReport, type ReportStatus } from '@/types/domain';
import StateMessage from '@/components/ui/StateMessage.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import ModalDialog from '@/components/ui/ModalDialog.vue';
import TerritorialMap from '@/components/map/TerritorialMap.vue';

const reportsQuery = useAsyncData<CitizenReport[]>(() => listReportsForAgents(), { isEmpty: (d) => d.length === 0 });

const filter = ref<'ALL' | ReportStatus>('ALL');
const search = ref('');
const viewMode = ref<'grid' | 'map'>('grid');
const selectedMapReport = ref<CitizenReport | null>(null);

const canVerify = can('reports:verify');
const canCreateIncident = can('incidents:create');

const filtered = computed(() => {
  if (reportsQuery.state.value.status !== 'ok') return [];
  return reportsQuery.state.value.data.filter((rep) => {
    if (filter.value !== 'ALL' && rep.status !== filter.value) return false;
    if (search.value) {
      const q = search.value.toLowerCase();
      if (!`${rep.code} ${rep.description} ${rep.location.label ?? ''}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });
});

const statusTone = (s: string): 'success' | 'warning' | 'info' | 'neutral' =>
  s === 'confirmado' ? 'success' : s === 'en_verificacion' ? 'warning' : s === 'recibido' ? 'info' : 'neutral';

// Modal de resolución
const resolving = ref<CitizenReport | null>(null);
const resolveForm = reactive({ decision: 'confirmado' as 'confirmado' | 'descartado', note: '', createIncident: true });
const busy = ref(false);

function openResolve(rep: CitizenReport): void {
  resolving.value = rep;
  resolveForm.decision = 'confirmado';
  resolveForm.note = '';
  resolveForm.createIncident = true;
}

async function submitResolve(): Promise<void> {
  if (!resolving.value) return;
  busy.value = true;
  try {
    const result = await resolveReport({
      id: resolving.value.id,
      decision: resolveForm.decision,
      note: resolveForm.note || undefined,
      createIncident: resolveForm.decision === 'confirmado' && resolveForm.createIncident,
    });
    pushToast(
      'success',
      'Reporte resuelto',
      result.incidentId
        ? `Reporte ${result.report.code} confirmado y derivado a incidente. Ambos movimientos quedaron auditados.`
        : `Reporte ${result.report.code} actualizado y auditado.`,
    );
    resolving.value = null;
    await reportsQuery.reload();
  } catch (err) {
    pushToast('error', 'No se pudo resolver', toUserMessage(err));
  } finally {
    busy.value = false;
  }
}

async function takeForVerification(rep: CitizenReport): Promise<void> {
  try {
    await startReportVerification(rep.id);
    pushToast('info', 'En verificación', `Reporte ${rep.code} tomado para verificación.`);
    await reportsQuery.reload();
  } catch (err) {
    pushToast('error', 'No se pudo actualizar', toUserMessage(err));
  }
}
</script>

<template>
  <div class="space-y-3">
    <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-base font-bold text-[#dbe3f4] uppercase tracking-tight">Verificación de reportes</h1>
          <StatusBadge
            v-if="reportsQuery.state.value.status === 'ok'"
            :label="`${reportsQuery.state.value.data.filter((r) => r.status === 'recibido' || r.status === 'en_verificacion').length} en cola`"
            tone="warning"
          />
        </div>
        <p class="text-xs text-[#bcc9cd] mt-1">
          Reportes ciudadanos sin verificar. Confirmar deriva a incidente y se audita; descartar requiere nota.
        </p>
      </div>
      <input
        v-model="search"
        type="text"
        placeholder="Buscar…"
        class="md:w-56 bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-1.5 text-xs text-[#dbe3f4] placeholder:text-[#869397] focus:outline-none focus:ring-1 focus:ring-[#4cd7f6]"
      />
    </div>

    <div class="flex items-center justify-between flex-wrap gap-2">
      <div class="flex flex-wrap gap-1.5 text-xs font-mono">
        <button
          type="button"
          :class="['px-2.5 py-1 rounded transition-colors', filter === 'ALL' ? 'bg-[#06b6d4] text-[#00424f] font-bold' : 'bg-[#18202c] text-[#869397] hover:text-[#dbe3f4]']"
          @click="filter = 'ALL'"
        >
          Todos
        </button>
        <button
          v-for="(lbl, key) in LABELS.reportStatus"
          :key="key"
          type="button"
          :class="['px-2.5 py-1 rounded transition-colors', filter === key ? 'bg-[#06b6d4] text-[#00424f] font-bold' : 'bg-[#18202c] text-[#869397] hover:text-[#dbe3f4]']"
          @click="filter = key as ReportStatus"
        >
          {{ lbl }}
        </button>
      </div>

      <!-- Selector de vista: Cuadrícula vs Mapa Georreferenciado -->
      <div class="flex bg-[#141c28] rounded border border-[#3d494c]/40 p-0.5 text-xs font-mono">
        <button
          type="button"
          :class="['flex items-center gap-1 px-2.5 py-1 rounded transition-colors', viewMode === 'grid' ? 'bg-[#06b6d4] text-[#00424f] font-bold' : 'text-[#869397] hover:text-[#dbe3f4]']"
          @click="viewMode = 'grid'"
        >
          <span class="material-symbols-outlined text-[15px]">grid_view</span> Tarjetas
        </button>
        <button
          type="button"
          :class="['flex items-center gap-1 px-2.5 py-1 rounded transition-colors', viewMode === 'map' ? 'bg-[#06b6d4] text-[#00424f] font-bold' : 'text-[#869397] hover:text-[#dbe3f4]']"
          @click="viewMode = 'map'"
        >
          <span class="material-symbols-outlined text-[15px]">map</span> Mapa táctico
        </button>
      </div>
    </div>

    <StateMessage :state="reportsQuery.state.value" @retry="reportsQuery.reload()">
      <template #default>
        <!-- Vista Mapa -->
        <div v-if="viewMode === 'map'" class="space-y-3">
          <TerritorialMap
            :reports="filtered"
            height-class="h-[520px]"
            mode="tecnico"
            @select-report="(id) => {
              const rep = filtered.find(r => r.id === id);
              if (rep) {
                selectedMapReport = rep;
                openResolve(rep);
              }
            }"
          />
          <p class="text-xs text-[#869397] font-mono">
            Hacé clic en cualquier punto de notificación en el mapa para abrir el panel de verificación y resolución.
          </p>
        </div>

        <!-- Vista Cuadrícula -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <article v-for="rep in filtered" :key="rep.id" class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3 space-y-2 flex flex-col">
            <div class="flex items-center justify-between gap-2">
              <span class="font-mono text-xs font-bold text-[#4cd7f6]">{{ rep.code }}</span>
              <StatusBadge :label="LABELS.reportStatus[rep.status]" :tone="statusTone(rep.status)" />
            </div>
            <StatusBadge :label="LABELS.reportType[rep.type]" tone="neutral" />
            <p class="text-xs text-[#bcc9cd] leading-relaxed line-clamp-4 flex-1">{{ rep.description }}</p>

            <div class="font-mono text-[10px] text-[#869397] space-y-0.5 border-t border-[#3d494c]/20 pt-1.5">
              <div>{{ rep.createdByName }} · {{ formatTimeAgo(rep.createdAt) }}</div>
              <div>{{ rep.location.label ?? `${rep.location.lat.toFixed(3)}, ${rep.location.lng.toFixed(3)}` }}</div>
              <div v-if="rep.photoUrl" class="text-[#4cd7f6] flex items-center gap-0.5">
                <span class="material-symbols-outlined text-[12px]">photo_camera</span> con foto adjunta
              </div>
              <div v-if="rep.incidentId" class="text-[#4cd7f6]">Derivado a incidente</div>
            </div>

            <div v-if="canVerify" class="flex gap-1.5 pt-1">
              <button
                v-if="rep.status === 'recibido'"
                type="button"
                class="flex-1 bg-[#232a37] hover:bg-[#323947] text-[#ffb77d] py-1.5 rounded text-[11px] font-mono border border-[#f48c24]/30"
                @click="takeForVerification(rep)"
              >
                Tomar
              </button>
              <button
                v-if="['recibido', 'en_verificacion'].includes(rep.status)"
                type="button"
                class="flex-1 bg-[#06b6d4] hover:bg-[#4cd7f6] text-[#00424f] py-1.5 rounded text-[11px] font-mono font-bold"
                @click="openResolve(rep)"
              >
                Resolver
              </button>
            </div>
          </article>
        </div>
      </template>
      <template #empty>
        <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-8 text-center">
          <span class="material-symbols-outlined text-3xl text-[#4cd7f6]">inbox</span>
          <p class="text-sm text-[#bcc9cd] mt-2">No hay reportes que coincidan con los filtros.</p>
        </div>
      </template>
    </StateMessage>

    <!-- Modal de resolución -->
    <ModalDialog :open="resolving !== null" :title="`Resolver ${resolving?.code ?? ''}`" @close="resolving = null">
      <div v-if="resolving" class="space-y-3">
        <p class="text-xs text-[#bcc9cd]">{{ resolving.description }}</p>

        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            :class="['p-2.5 rounded border text-xs font-semibold', resolveForm.decision === 'confirmado' ? 'bg-[#06b6d4]/20 border-[#06b6d4] text-[#4cd7f6]' : 'bg-[#18202c] border-[#3d494c]/30 text-[#bcc9cd]']"
            @click="resolveForm.decision = 'confirmado'"
          >
            Confirmar
          </button>
          <button
            type="button"
            :class="['p-2.5 rounded border text-xs font-semibold', resolveForm.decision === 'descartado' ? 'bg-[#a40217]/20 border-[#a40217] text-[#ffb3ad]' : 'bg-[#18202c] border-[#3d494c]/30 text-[#bcc9cd]']"
            @click="resolveForm.decision = 'descartado'"
          >
            Descartar
          </button>
        </div>

        <label v-if="resolveForm.decision === 'confirmado' && canCreateIncident" class="flex items-start gap-2 text-xs text-[#bcc9cd]">
          <input v-model="resolveForm.createIncident" type="checkbox" class="mt-0.5 accent-[#4cd7f6]" />
          Derivar a un incidente nuevo (crea un incidente vinculado con estos datos)
        </label>

        <textarea
          v-model="resolveForm.note"
          rows="2"
          placeholder="Nota de resolución (evidencia, motivo del descarte…)"
          class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-xs text-[#dbe3f4] resize-y"
        ></textarea>

        <p class="text-[11px] text-[#869397] font-mono">La resolución queda registrada en la auditoría operativa.</p>

        <div class="flex justify-end gap-2">
          <button type="button" class="bg-[#232a37] hover:bg-[#323947] text-[#dbe3f4] px-3 py-1.5 rounded text-xs border border-[#3d494c]/40" @click="resolving = null">
            Cancelar
          </button>
          <button
            type="button"
            :disabled="busy"
            class="bg-[#06b6d4] hover:bg-[#4cd7f6] disabled:opacity-50 text-[#00424f] font-bold px-4 py-1.5 rounded text-xs"
            @click="submitResolve"
          >
            {{ busy ? 'Guardando…' : 'Confirmar resolución' }}
          </button>
        </div>
      </div>
    </ModalDialog>
  </div>
</template>
