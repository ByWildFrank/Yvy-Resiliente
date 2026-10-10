<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAsyncData } from '@/composables/useAsyncData';
import { listIncidents } from '@/services/incidents.service';
import { listReportsForAgents } from '@/services/reports.service';
import { listOperationalAlerts } from '@/services/alerts.service';
import { getDashboardKpis } from '@/services/kpis.service';
import { authState } from '@/services/auth.service';
import { formatDateTime } from '@/config/labels';
import StateMessage from '@/components/ui/StateMessage.vue';

/**
 * Informe de situación compilado en vivo desde los datos reales del sistema.
 * Descargable como texto plano. Sin números inventados: cada cifra se cuenta desde el almacén.
 */
const kpisQuery = useAsyncData(() => getDashboardKpis());
const incidentsQuery = useAsyncData(() => listIncidents(), { isEmpty: () => false });
const reportsQuery = useAsyncData(() => listReportsForAgents(), { isEmpty: () => false });
const alertsQuery = useAsyncData(() => listOperationalAlerts(), { isEmpty: () => false });

const generatedAt = ref<string | null>(null);
const reportText = computed(() => {
  if (
    kpisQuery.state.value.status !== 'ok' ||
    incidentsQuery.state.value.status !== 'ok' ||
    reportsQuery.state.value.status !== 'ok' ||
    alertsQuery.state.value.status !== 'ok'
  ) return null;

  const kpis = kpisQuery.state.value.data;
  const incidents = incidentsQuery.state.value.data;
  const reports = reportsQuery.state.value.data;
  const alerts = alertsQuery.state.value.data;
  const at = generatedAt.value ?? new Date().toISOString();
  const actor = authState.user?.displayName ?? '—';

  const lines: string[] = [
    'INFORME DE SITUACIÓN — YVY RESILIENTE',
    '======================================',
    `Generado: ${formatDateTime(at)}`,
    `Generado por: ${actor}`,
    `Modalidad de datos: ${kpisQuery.state.value.data ? 'almacén activo de la plataforma' : ''}`,
    '',
    '1. RESUMEN OPERATIVO (cifras derivadas de los datos registrados)',
    `   - Incidentes activos: ${kpis.activeIncidents}`,
    `     · De fuego: ${kpis.activeFireIncidents}`,
    `     · Hídricos: ${kpis.activeWaterIncidents}`,
    `   - Reportes ciudadanos pendientes: ${kpis.reportsPending ?? 'no disponible para este perfil'}`,
    `   - Sensores en línea: ${kpis.sensorsOnline ?? '—'}/${kpis.sensorsTotal ?? '—'}`,
    `   - Estaciones hidrométricas: ${kpis.stationsInAlert} de ${kpis.stationsTotal} en aviso o alerta`,
    `   - Alertas públicas vigentes: ${kpis.publicAlerts}`,
    '',
    '2. ALERTAS REGISTRADAS',
    ...alerts.slice(0, 10).map((a) => `   [${a.status}] (${a.severity}) ${a.title} — ${a.territory}`),
    '',
    '3. INCIDENTES ACTIVOS',
    ...incidents
      .filter((i) => !['cerrado', 'descartado'].includes(i.status))
      .slice(0, 15)
      .map((i) => `   ${i.code} · ${i.type} · ${i.status} · prioridad ${i.priority} · ${i.location.label ?? 'sin referencia'}`),
    '',
    '4. REPORTES CIUDADANOS RECIENTES',
    ...reports.slice(0, 10).map((r) => `   ${r.code} · ${r.type} · ${r.status} · ${r.createdByName}`),
    '',
    'NOTA: Informe generado automáticamente desde los datos registrados en la plataforma.',
    'Los datos de sensores y estaciones reflejan la última lectura disponible y su antigüedad.',
    'Este documento no reemplaza los partes oficiales de los organismos.',
  ];
  return lines.join('\n');
});

function generate(): void {
  generatedAt.value = new Date().toISOString();
}

function download(): void {
  if (!reportText.value) return;
  const blob = new Blob([reportText.value], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `yvy-informe-situacion-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <div class="space-y-3">
    <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div>
        <h1 class="text-base font-bold text-[#dbe3f4] uppercase tracking-tight">Informes</h1>
        <p class="text-xs text-[#bcc9cd] mt-1 max-w-2xl">
          Informe de situación compilado en vivo: cada cifra se cuenta desde los datos del almacén activo.
          Sin plantillas predefinidas con números fijos.
        </p>
      </div>
      <div class="flex gap-2">
        <button
          type="button"
          :disabled="kpisQuery.state.value.status !== 'loading' && !reportText"
          class="bg-[#232a37] hover:bg-[#323947] text-[#dbe3f4] px-3 py-1.5 rounded text-xs font-mono border border-[#3d494c]/40"
          @click="generate"
        >
          Actualizar contenido
        </button>
        <button
          type="button"
          :disabled="!reportText"
          class="flex items-center gap-1 bg-[#06b6d4] hover:bg-[#4cd7f6] disabled:opacity-50 text-[#00424f] px-3 py-1.5 rounded text-xs font-semibold"
          @click="download"
        >
          <span class="material-symbols-outlined text-[15px]">download</span> Descargar .txt
        </button>
      </div>
    </div>

    <div
      v-if="kpisQuery.state.value.status === 'loading' || incidentsQuery.state.value.status === 'loading' || reportsQuery.state.value.status === 'loading' || alertsQuery.state.value.status === 'loading'"
      class="flex flex-col items-center justify-center gap-2 py-14"
    >
      <span class="material-symbols-outlined text-3xl text-[#4cd7f6] animate-spin" style="animation-duration: 1.5s;">progress_activity</span>
      <p class="font-mono text-xs text-[#869397] uppercase tracking-wider">Compilando datos…</p>
    </div>

    <div
      v-else-if="kpisQuery.state.value.status === 'error'"
      class="bg-[#a40217]/15 border border-[#a40217]/40 rounded-lg p-4 text-xs text-[#ffdad6]"
    >
      No se pudo compilar el informe: {{ kpisQuery.state.value.error }}
      <button type="button" class="block mt-2 underline" @click="kpisQuery.reload()">Reintentar</button>
    </div>

    <pre
      v-else-if="reportText"
      class="bg-[#070e1a] border border-[#3d494c]/40 rounded-xl p-4 font-mono text-[11px] text-[#bcc9cd] whitespace-pre-wrap overflow-x-auto"
    >{{ reportText }}</pre>
  </div>
</template>
