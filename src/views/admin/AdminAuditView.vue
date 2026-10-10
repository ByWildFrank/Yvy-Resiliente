<script setup lang="ts">
import { ref } from 'vue';
import { useAsyncData } from '@/composables/useAsyncData';
import { listAdminAudit } from '@/services/audit.service';
import { formatDateTime, formatTimeAgo } from '@/config/labels';
import StateMessage from '@/components/ui/StateMessage.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import type { AuditEntry } from '@/types/domain';

const auditQuery = useAsyncData<AuditEntry[]>(() => listAdminAudit(200), { isEmpty: (d) => d.length === 0 });

const visibilityFilter = ref<'ALL' | 'operativo' | 'admin'>('ALL');

const filtered = ref<AuditEntry[]>([]);
function applyFilter(): void {
  if (auditQuery.state.value.status !== 'ok') return;
  filtered.value = visibilityFilter.value === 'ALL'
    ? auditQuery.state.value.data
    : auditQuery.state.value.data.filter((e) => e.visibility === visibilityFilter.value);
}
auditQuery.state.value; // reactividad inicial
applyFilter();
</script>

<template>
  <div class="space-y-3">
    <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3">
      <h1 class="text-base font-bold text-[#dbe3f4] uppercase tracking-tight">Auditoría</h1>
      <p class="text-xs text-[#bcc9cd] mt-1 max-w-3xl">
        Registro completo de acciones privilegiadas: verificaciones, transiciones, publicaciones y
        cambios administrativos. Las consultas de lectura no se auditan.
      </p>
    </div>

    <div class="flex gap-1.5 text-xs font-mono">
      <button
        v-for="opt in (['ALL', 'operativo', 'admin'] as const)"
        :key="opt"
        type="button"
        :class="['px-3 py-1.5 rounded transition-colors', visibilityFilter === opt ? 'bg-[#ffb77d] text-[#3d2400] font-bold' : 'bg-[#18202c] text-[#869397] hover:text-[#dbe3f4]']"
        @click="visibilityFilter = opt; applyFilter()"
      >
        {{ opt === 'ALL' ? 'Todas' : opt === 'operativo' ? 'Operativas' : 'Administrativas' }}
      </button>
    </div>

    <StateMessage :state="auditQuery.state.value" @retry="auditQuery.reload()">
      <template #default>
        <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg divide-y divide-[#3d494c]/20">
          <div v-for="entry in filtered" :key="entry.id" class="p-3 flex items-start gap-3">
            <span
              :class="[
                'w-2 h-2 rounded-full mt-1.5 shrink-0',
                entry.visibility === 'admin' ? 'bg-[#ffb77d]' : 'bg-[#4cd7f6]',
              ]"
            ></span>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-mono text-[11px] font-semibold text-[#dbe3f4]">{{ entry.action }}</span>
                <StatusBadge :label="entry.visibility" :tone="entry.visibility === 'admin' ? 'warning' : 'info'" />
                <StatusBadge :label="entry.targetType" tone="neutral" />
                <span class="font-mono text-[10px] text-[#869397]">{{ formatTimeAgo(entry.at) }}</span>
              </div>
              <p class="text-xs text-[#bcc9cd] mt-0.5">{{ entry.details }}</p>
              <div class="font-mono text-[10px] text-[#869397] mt-0.5">
                {{ entry.actorName }} · {{ entry.targetId }} · {{ formatDateTime(entry.at) }}
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #empty>
        <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-8 text-center text-sm text-[#bcc9cd]">
          Sin registros de auditoría por ahora.
        </div>
      </template>
    </StateMessage>
  </div>
</template>
