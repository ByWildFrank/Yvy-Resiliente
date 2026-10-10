<script setup lang="ts">
import { useAsyncData } from '@/composables/useAsyncData';
import { listUsers } from '@/services/admin.service';
import { listOrganizations } from '@/services/admin.service';
import { listIncidents } from '@/services/incidents.service';
import { listReportsForAgents } from '@/services/reports.service';
import { listSensors, listSources } from '@/services/monitoring.service';
import { listAdminAudit } from '@/services/audit.service';
import { authState, can } from '@/services/auth.service';
import { formatTimeAgo } from '@/config/labels';
import StateMessage from '@/components/ui/StateMessage.vue';
import KpiCard from '@/components/ui/KpiCard.vue';
import type { AuditEntry } from '@/types/domain';

const usersQuery = useAsyncData(() => listUsers(), { isEmpty: () => false });
const orgsQuery = useAsyncData(() => listOrganizations(), { isEmpty: () => false });
const incidentsQuery = can('incidents:read')
  ? useAsyncData(() => listIncidents(), { isEmpty: () => false })
  : null;
const reportsQuery = can('reports:read')
  ? useAsyncData(() => listReportsForAgents(), { isEmpty: () => false })
  : null;
const sensorsQuery = useAsyncData(() => listSensors(), { isEmpty: () => false });
const sourcesQuery = useAsyncData(() => listSources(), { isEmpty: () => false });
const auditQuery = useAsyncData<AuditEntry[]>(() => listAdminAudit(10), { isEmpty: () => false });

function countOf(q: { state: { value: { status: string; data?: unknown[] } } }): string | null {
  const st = q.state.value;
  return st.status === 'ok' ? String((st.data as unknown[]).length) : null;
}
</script>

<template>
  <div class="space-y-4">
    <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3">
      <h1 class="text-base font-bold text-[#dbe3f4] uppercase tracking-tight">Dashboard administrativo</h1>
      <p class="text-xs text-[#bcc9cd] mt-1">
        Contadores derivados en vivo del almacén activo{{ authState.user ? ` · sesión: ${authState.user.displayName}` : '' }}.
        El administrador técnico no publica alertas ni verifica incidentes sin permisos operativos.
      </p>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      <StateMessage :state="usersQuery.state.value" @retry="usersQuery.reload()">
        <template #default>
          <KpiCard label="Usuarios" :value="countOf(usersQuery) ?? '—'" badge="gestión" badge-tone="info" clickable @select="$router.push('/admin/usuarios')" />
        </template>
      </StateMessage>
      <StateMessage :state="orgsQuery.state.value" @retry="orgsQuery.reload()">
        <template #default>
          <KpiCard label="Organismos" :value="countOf(orgsQuery) ?? '—'" badge="directorio" badge-tone="info" clickable @select="$router.push('/admin/organismos')" />
        </template>
      </StateMessage>
      <StateMessage :state="sensorsQuery.state.value" @retry="sensorsQuery.reload()">
        <template #default>
          <KpiCard label="Sensores" :value="countOf(sensorsQuery) ?? '—'" badge="registro" badge-tone="info" clickable @select="$router.push('/admin/sensores')" />
        </template>
      </StateMessage>
      <StateMessage :state="sourcesQuery.state.value" @retry="sourcesQuery.reload()">
        <template #default>
          <KpiCard label="Fuentes" :value="countOf(sourcesQuery) ?? '—'" badge="registro" badge-tone="info" clickable @select="$router.push('/admin/fuentes')" />
        </template>
      </StateMessage>
      <KpiCard
        v-if="incidentsQuery"
        label="Incidentes" :value="incidentsQuery.state.value.status === 'ok' ? String(incidentsQuery.state.value.data.length) : '—'"
        badge="solo lectura" badge-tone="info"
      />
      <KpiCard
        v-if="reportsQuery"
        label="Reportes" :value="reportsQuery.state.value.status === 'ok' ? String(reportsQuery.state.value.data.length) : '—'"
        badge="solo lectura" badge-tone="info"
      />
    </div>

    <!-- Auditoría administrativa reciente -->
    <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3">
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-xs font-bold text-[#dbe3f4] uppercase font-mono tracking-wide">Auditoría administrativa reciente</h2>
        <router-link to="/admin/auditoria" class="text-[11px] text-[#4cd7f6] hover:underline font-mono">Ver todo</router-link>
      </div>
      <StateMessage :state="auditQuery.state.value" @retry="auditQuery.reload()">
        <template #default="{ data }">
          <div class="space-y-1.5">
            <div v-for="entry in data" :key="entry.id" class="flex items-start gap-2 text-xs">
              <span class="w-1.5 h-1.5 rounded-full bg-[#ffb77d] mt-1.5 shrink-0"></span>
              <div class="min-w-0">
                <span class="font-mono text-[10px] text-[#869397]">{{ formatTimeAgo(entry.at) }}</span>
                <span class="text-[#bcc9cd]"> · {{ entry.actorName }}</span>
                <div class="text-[#dbe3f4] truncate">{{ entry.details }}</div>
              </div>
            </div>
          </div>
        </template>
        <template #empty>
          <p class="text-xs text-[#869397]">Sin acciones administrativas registradas todavía.</p>
        </template>
      </StateMessage>
    </div>
  </div>
</template>
