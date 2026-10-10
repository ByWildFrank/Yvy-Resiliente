<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useAsyncData } from '@/composables/useAsyncData';
import { getPublicAlert } from '@/services/alerts.service';
import { LABELS, formatDateTime } from '@/config/labels';
import StateMessage from '@/components/ui/StateMessage.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import type { Alert } from '@/types/domain';

const route = useRoute();
const alertQuery = useAsyncData<Alert | null>(
  () => getPublicAlert(String(route.params.id)),
  { isEmpty: (d) => d === null },
);

const tone = (s: string): 'critical' | 'warning' | 'info' =>
  s === 'emergencia' || s === 'alerta' ? 'critical' : s === 'aviso' ? 'warning' : 'info';
</script>

<template>
  <div class="space-y-3 max-w-3xl">
    <router-link to="/ciudadano/alertas" class="inline-flex items-center gap-1 text-xs text-[#4cd7f6] hover:underline">
      <span class="material-symbols-outlined text-[14px]">arrow_back</span> Volver a alertas
    </router-link>

    <StateMessage :state="alertQuery.state.value" @retry="alertQuery.reload()">
      <template #default="{ data }">
        <article
          :class="[
            'bg-[#141c28] border rounded-xl p-5 space-y-3',
            tone(data.severity) === 'critical' ? 'border-[#a40217]/50' :
            tone(data.severity) === 'warning' ? 'border-[#f48c24]/50' : 'border-[#3d494c]/40',
          ]"
        >
          <div class="flex flex-wrap items-center gap-2">
            <StatusBadge :label="LABELS.alertSeverity[data.severity]" :tone="tone(data.severity)" />
            <StatusBadge :label="LABELS.alertType[data.type]" tone="neutral" />
            <StatusBadge :label="LABELS.alertStatus[data.status]" tone="success" />
          </div>

          <h1 class="text-lg font-bold text-[#dbe3f4] leading-snug">{{ data.title }}</h1>

          <p class="text-sm text-[#bcc9cd] leading-relaxed">{{ data.message }}</p>

          <div v-if="data.instructions" class="bg-[#18202c] border border-[#f48c24]/30 rounded-lg p-3">
            <h2 class="font-mono text-[10px] text-[#ffb77d] uppercase font-bold tracking-wider mb-1">Recomendaciones</h2>
            <p class="text-xs text-[#ffdcc3] leading-relaxed">{{ data.instructions }}</p>
          </div>

          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-[#869397] pt-1 border-t border-[#3d494c]/20">
            <div class="flex justify-between"><dt>Territorio</dt><dd class="text-[#bcc9cd]">{{ data.territory }}</dd></div>
            <div class="flex justify-between"><dt>Fuente</dt><dd class="text-[#bcc9cd]">{{ data.source }}</dd></div>
            <div class="flex justify-between"><dt>Publicada</dt><dd class="text-[#bcc9cd]">{{ formatDateTime(data.publishedAt) }}</dd></div>
            <div class="flex justify-between"><dt>Vigencia desde</dt><dd class="text-[#bcc9cd]">{{ formatDateTime(data.validFrom) }}</dd></div>
            <div v-if="data.validUntil" class="flex justify-between"><dt>Vigencia hasta</dt><dd class="text-[#bcc9cd]">{{ formatDateTime(data.validUntil) }}</dd></div>
            <div class="flex justify-between"><dt>Identificación</dt><dd class="text-[#4cd7f6]">{{ data.code }}</dd></div>
          </dl>

          <p class="text-[11px] text-[#869397] font-mono">
            Recomendaciones emitidas por el organismo de origen. Yvy las difunde sin alterarlas.
          </p>
        </article>
      </template>
      <template #empty>
        <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-8 text-center">
          <span class="material-symbols-outlined text-3xl text-[#ffb4ab]">search_off</span>
          <p class="text-sm text-[#bcc9cd] mt-2">La alerta no existe o no está publicada para el público.</p>
        </div>
      </template>
    </StateMessage>
  </div>
</template>
