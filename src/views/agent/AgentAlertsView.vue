<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useAsyncData } from '@/composables/useAsyncData';
import { cancelAlert, createAlert, listOperationalAlerts, publishAlert } from '@/services/alerts.service';
import { can } from '@/services/auth.service';
import { pushToast } from '@/composables/useToast';
import { toUserMessage } from '@/types/states';
import { LABELS, formatDateTime } from '@/config/labels';
import { ALERT_SEVERITIES, ALERT_TYPES, type Alert } from '@/types/domain';
import StateMessage from '@/components/ui/StateMessage.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import ModalDialog from '@/components/ui/ModalDialog.vue';

const alertsQuery = useAsyncData<Alert[]>(() => listOperationalAlerts(), { isEmpty: (d) => d.length === 0 });
const canPublish = can('alerts:publish');

const severityTone = (s: string): 'critical' | 'warning' | 'info' =>
  s === 'emergencia' || s === 'alerta' ? 'critical' : s === 'aviso' ? 'warning' : 'info';

const busy = ref(false);
const showForm = ref(false);
const form = reactive({
  type: 'incendio' as (typeof ALERT_TYPES)[number],
  severity: 'aviso' as (typeof ALERT_SEVERITIES)[number],
  scope: 'publico' as 'publico' | 'operativo',
  territory: '',
  title: '',
  message: '',
  instructions: '',
});

const sorted = computed(() => {
  if (alertsQuery.state.value.status !== 'ok') return [];
  const rank: Record<string, number> = { publicada: 0, borrador: 1, cancelada: 2, expirada: 3 };
  return [...alertsQuery.state.value.data].sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9));
});

async function submit(): Promise<void> {
  busy.value = true;
  try {
    const alert = await createAlert({
      type: form.type,
      severity: form.severity,
      scope: form.scope,
      territory: form.territory,
      title: form.title,
      message: form.message,
      instructions: form.instructions || null,
    });
    pushToast('success', 'Borrador creado', `${alert.code} quedó como borrador. Publicalo cuando esté aprobado.`);
    showForm.value = false;
    Object.assign(form, { territory: '', title: '', message: '', instructions: '' });
    await alertsQuery.reload();
  } catch (err) {
    pushToast('error', 'No se pudo crear', toUserMessage(err));
  } finally {
    busy.value = false;
  }
}

async function publish(id: string): Promise<void> {
  busy.value = true;
  try {
    await publishAlert(id);
    pushToast('success', 'Alerta publicada', 'La publicación quedó auditada y visible según su ámbito.');
    await alertsQuery.reload();
  } catch (err) {
    pushToast('error', 'No se pudo publicar', toUserMessage(err));
  } finally {
    busy.value = false;
  }
}

async function cancel(id: string): Promise<void> {
  busy.value = true;
  try {
    await cancelAlert(id);
    pushToast('info', 'Alerta cancelada', 'La cancelación quedó auditada.');
    await alertsQuery.reload();
  } catch (err) {
    pushToast('error', 'No se pudo cancelar', toUserMessage(err));
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="space-y-3">
    <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div>
        <h1 class="text-base font-bold text-[#dbe3f4] uppercase tracking-tight">Alertas</h1>
        <p class="text-xs text-[#bcc9cd] mt-1 max-w-2xl">
          Publicar una alerta es una acción institucional: requiere el permiso <code class="text-[#4cd7f6]">alerts:publish</code> y queda auditada.
          <template v-if="!canPublish">Tu perfil puede consultar pero no publicar.</template>
        </p>
      </div>
      <button
        v-if="canPublish"
        type="button"
        class="flex items-center gap-1.5 bg-[#06b6d4] hover:bg-[#4cd7f6] text-[#00424f] px-3 py-1.5 rounded text-xs font-semibold shrink-0"
        @click="showForm = true"
      >
        <span class="material-symbols-outlined text-[16px]">campaign</span> Nueva alerta
      </button>
    </div>

    <StateMessage :state="alertsQuery.state.value" @retry="alertsQuery.reload()">
      <template #default>
        <div class="space-y-2">
          <article
            v-for="alert in sorted"
            :key="alert.id"
            :class="[
              'bg-[#141c28] border rounded-lg p-3 space-y-1.5',
              alert.status === 'publicada' && severityTone(alert.severity) === 'critical' ? 'border-[#a40217]/50' :
              alert.status === 'publicada' ? 'border-[#3d494c]/40' : 'border-[#3d494c]/30 opacity-90',
            ]"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="font-mono text-xs font-bold text-[#4cd7f6]">{{ alert.code }}</span>
                <StatusBadge :label="LABELS.alertStatus[alert.status]" :tone="alert.status === 'publicada' ? 'success' : 'neutral'" />
                <StatusBadge :label="LABELS.alertSeverity[alert.severity]" :tone="severityTone(alert.severity)" />
                <StatusBadge :label="LABELS.alertScope[alert.scope]" tone="info" />
              </div>
              <span class="font-mono text-[10px] text-[#869397]">{{ formatDateTime(alert.updatedAt) }}</span>
            </div>
            <h2 class="text-sm font-semibold text-[#dbe3f4]">{{ alert.title }}</h2>
            <p class="text-xs text-[#bcc9cd] leading-relaxed">{{ alert.message }}</p>
            <p v-if="alert.instructions" class="text-[11px] text-[#ffdcc3] font-mono">Recomendaciones: {{ alert.instructions }}</p>
            <div class="font-mono text-[10px] text-[#869397] flex flex-wrap gap-x-3">
              <span>{{ alert.territory }}</span>
              <span>Fuente: {{ alert.source }}</span>
              <span v-if="alert.publishedAt">Publicado: {{ formatDateTime(alert.publishedAt) }}</span>
            </div>
            <div v-if="canPublish && alert.status === 'borrador'" class="flex gap-1.5 pt-1">
              <button
                type="button"
                :disabled="busy"
                class="bg-[#06b6d4] hover:bg-[#4cd7f6] disabled:opacity-50 text-[#00424f] px-2.5 py-1 rounded text-[11px] font-mono font-bold"
                @click="publish(alert.id)"
              >
                Publicar
              </button>
            </div>
            <div v-if="canPublish && alert.status === 'publicada'" class="pt-1">
              <button
                type="button"
                :disabled="busy"
                class="bg-[#232a37] hover:bg-[#323947] text-[#ffb77d] px-2.5 py-1 rounded text-[11px] font-mono border border-[#f48c24]/30 disabled:opacity-50"
                @click="cancel(alert.id)"
              >
                Cancelar alerta
              </button>
            </div>
          </article>
        </div>
      </template>
      <template #empty>
        <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-8 text-center">
          <span class="material-symbols-outlined text-3xl text-[#4cd7f6]">campaign</span>
          <p class="text-sm text-[#bcc9cd] mt-2">No hay alertas registradas.</p>
        </div>
      </template>
    </StateMessage>

    <ModalDialog :open="showForm" title="Nueva alerta (borrador)" wide @close="showForm = false">
      <form class="space-y-3" @submit.prevent="submit">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="al-type">Tipo</label>
            <select id="al-type" v-model="form.type" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]">
              <option v-for="(lbl, key) in LABELS.alertType" :key="key" :value="key">{{ lbl }}</option>
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="al-sev">Severidad</label>
            <select id="al-sev" v-model="form.severity" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]">
              <option v-for="(lbl, key) in LABELS.alertSeverity" :key="key" :value="key">{{ lbl }}</option>
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="al-scope">Ámbito</label>
            <select id="al-scope" v-model="form.scope" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]">
              <option value="publico">Pública (visible a ciudadanos)</option>
              <option value="operativo">Operativa (solo organismos)</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="al-territory">Territorio</label>
          <input id="al-territory" v-model="form.territory" type="text" required placeholder="Localidad / departamento" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]" />
        </div>
        <div>
          <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="al-title">Título</label>
          <input id="al-title" v-model="form.title" type="text" required minlength="6" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]" />
        </div>
        <div>
          <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="al-message">Mensaje</label>
          <textarea id="al-message" v-model="form.message" rows="3" required minlength="20" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4] resize-y"></textarea>
        </div>
        <div>
          <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="al-instr">Recomendaciones (opcional)</label>
          <textarea id="al-instr" v-model="form.instructions" rows="2" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4] resize-y"></textarea>
        </div>
        <p class="text-[11px] text-[#869397] font-mono">La alerta se crea como borrador; la publicación es un paso posterior auditado.</p>
        <div class="flex justify-end gap-2">
          <button type="button" class="bg-[#232a37] hover:bg-[#323947] text-[#dbe3f4] px-3 py-1.5 rounded text-xs border border-[#3d494c]/40" @click="showForm = false">Cancelar</button>
          <button type="submit" :disabled="busy" class="bg-[#06b6d4] hover:bg-[#4cd7f6] disabled:opacity-50 text-[#00424f] font-bold px-4 py-1.5 rounded text-xs">
            {{ busy ? 'Guardando…' : 'Crear borrador' }}
          </button>
        </div>
      </form>
    </ModalDialog>
  </div>
</template>
