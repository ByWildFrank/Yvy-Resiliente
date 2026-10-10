<script setup lang="ts">
import { useAsyncData } from '@/composables/useAsyncData';
import { listMyReports } from '@/services/reports.service';
import { LABELS, formatTimeAgo } from '@/config/labels';
import StateMessage from '@/components/ui/StateMessage.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import type { CitizenReport } from '@/types/domain';

const reportsQuery = useAsyncData<CitizenReport[]>(() => listMyReports(), { isEmpty: (d) => d.length === 0 });

const statusTone = (s: string): 'success' | 'warning' | 'info' | 'neutral' =>
  s === 'confirmado' ? 'success' :
  s === 'en_verificacion' ? 'warning' :
  s === 'recibido' ? 'info' : 'neutral';
</script>

<template>
  <div class="space-y-3">
    <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3 flex items-center justify-between flex-wrap gap-2">
      <div>
        <h1 class="text-base font-bold text-[#dbe3f4] uppercase tracking-tight">Mis reportes</h1>
        <p class="text-xs text-[#bcc9cd] mt-1">Seguimiento de los reportes que enviaste. El estado lo administran los organismos.</p>
      </div>
      <router-link
        to="/ciudadano/reportar"
        class="bg-[#06b6d4] hover:bg-[#4cd7f6] text-[#00424f] px-3 py-1.5 rounded text-xs font-semibold"
      >
        Nuevo reporte
      </router-link>
    </div>

    <StateMessage :state="reportsQuery.state.value" @retry="reportsQuery.reload()">
      <template #default="{ data }">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <router-link
            v-for="rep in data"
            :key="rep.id"
            :to="`/ciudadano/mis-reportes/${rep.id}`"
            class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3 space-y-2 block hover:bg-[#18202c] transition-colors"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="font-mono text-xs font-bold text-[#4cd7f6]">{{ rep.code }}</span>
              <StatusBadge :label="LABELS.reportStatus[rep.status]" :tone="statusTone(rep.status)" />
            </div>
            <StatusBadge :label="LABELS.reportType[rep.type]" tone="neutral" />
            <p class="text-xs text-[#bcc9cd] line-clamp-2 leading-relaxed">{{ rep.description }}</p>
            <div class="font-mono text-[10px] text-[#869397] flex items-center gap-2">
              <span>{{ formatTimeAgo(rep.createdAt) }}</span>
              <span v-if="rep.photoUrl" class="text-[#4cd7f6] flex items-center gap-0.5">
                <span class="material-symbols-outlined text-[12px]">photo_camera</span> foto
              </span>
            </div>
          </router-link>
        </div>
      </template>
      <template #empty>
        <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-8 text-center">
          <span class="material-symbols-outlined text-3xl text-[#4cd7f6]">assignment_add</span>
          <p class="text-sm text-[#bcc9cd] mt-2">Todavía no enviaste reportes.</p>
          <router-link to="/ciudadano/reportar" class="inline-block mt-3 bg-[#06b6d4] hover:bg-[#4cd7f6] text-[#00424f] px-4 py-1.5 rounded text-xs font-semibold">
            Reportar un incidente
          </router-link>
        </div>
      </template>
    </StateMessage>
  </div>
</template>
