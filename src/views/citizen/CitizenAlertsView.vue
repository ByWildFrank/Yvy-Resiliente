<script setup lang="ts">
import { useAsyncData } from '@/composables/useAsyncData';
import { listPublicAlerts } from '@/services/alerts.service';
import { LABELS, formatDateTime, formatTimeAgo } from '@/config/labels';
import StateMessage from '@/components/ui/StateMessage.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import type { Alert } from '@/types/domain';

const alertsQuery = useAsyncData<Alert[]>(() => listPublicAlerts(), { isEmpty: (d) => d.length === 0 });

const severityOrder: Record<string, number> = { emergencia: 0, alerta: 1, aviso: 2, info: 3 };

const tone = (s: string): 'critical' | 'warning' | 'info' =>
  s === 'emergencia' || s === 'alerta' ? 'critical' : s === 'aviso' ? 'warning' : 'info';
</script>

<template>
  <div class="space-y-3">
    <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3">
      <h1 class="text-base font-bold text-[#dbe3f4] uppercase tracking-tight">Alertas públicas</h1>
      <p class="text-xs text-[#bcc9cd] mt-1">
        Alertas publicadas por organismos autorizados. Ante una emergencia real, seguí las indicaciones
        oficiales y los canales de emergencia locales.
      </p>
    </div>

    <StateMessage :state="alertsQuery.state.value" @retry="alertsQuery.reload()">
      <template #default="{ data }">
        <div class="space-y-3">
          <router-link
            v-for="alert in [...data].sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9))"
            :key="alert.id"
            :to="`/ciudadano/alertas/${alert.id}`"
            :class="[
              'block bg-[#141c28] border rounded-lg p-4 transition-all hover:bg-[#18202c]',
              tone(alert.severity) === 'critical' ? 'border-[#a40217]/50' :
              tone(alert.severity) === 'warning' ? 'border-[#f48c24]/50' : 'border-[#3d494c]/40',
            ]"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <StatusBadge :label="LABELS.alertSeverity[alert.severity]" :tone="tone(alert.severity)" />
                <StatusBadge :label="LABELS.alertType[alert.type]" tone="neutral" />
              </div>
              <span class="font-mono text-[10px] text-[#869397]">{{ formatTimeAgo(alert.publishedAt ?? alert.validFrom) }}</span>
            </div>
            <h2 class="text-sm font-semibold text-[#dbe3f4] mt-2">{{ alert.title }}</h2>
            <p class="text-xs text-[#bcc9cd] mt-1 line-clamp-2">{{ alert.message }}</p>
            <div class="font-mono text-[10px] text-[#869397] mt-2 flex flex-wrap gap-x-3">
              <span>{{ alert.territory }}</span>
              <span>Publicado: {{ formatDateTime(alert.publishedAt) }}</span>
              <span>Fuente: {{ alert.source }}</span>
            </div>
          </router-link>
        </div>
      </template>
      <template #empty>
        <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-8 text-center">
          <span class="material-symbols-outlined text-3xl text-[#4cd7f6]">task_alt</span>
          <p class="text-sm text-[#bcc9cd] mt-2">No hay alertas públicas vigentes.</p>
          <p class="text-xs text-[#869397] mt-1">La ausencia de alertas no implica ausencia de riesgo: mantené las precauciones habituales.</p>
        </div>
      </template>
    </StateMessage>
  </div>
</template>
