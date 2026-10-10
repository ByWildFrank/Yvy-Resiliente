<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useAsyncData } from '@/composables/useAsyncData';
import { createSource, listSources, updateSource } from '@/services/monitoring.service';
import { pushToast } from '@/composables/useToast';
import { toUserMessage } from '@/types/states';
import { LABELS, formatDateTime } from '@/config/labels';
import { syncAllOfficialSources } from '@/services/externalSources.service';
import type { InfoSource, SourceType } from '@/types/domain';
import StateMessage from '@/components/ui/StateMessage.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import ModalDialog from '@/components/ui/ModalDialog.vue';

const sourcesQuery = useAsyncData<InfoSource[]>(() => listSources(), { isEmpty: (d) => d.length === 0 });

const busy = ref(false);
const errorMsg = ref('');
const syncingOfficial = ref(false);

async function handleSyncOfficial(): Promise<void> {
  syncingOfficial.value = true;
  try {
    const report = await syncAllOfficialSources();
    pushToast(
      'success',
      'Sincronización oficial exitosa',
      `SMN (${report.smn.observations.length} est.), INA (${report.ina.ports.length} puertos), NASA FIRMS (${report.firms.totalActiveSpots} focos).`,
    );
    await sourcesQuery.reload();
  } catch (err: any) {
    pushToast('error', 'Error en sincronización', err.message);
  } finally {
    syncingOfficial.value = false;
  }
}

const creating = ref(false);
const createForm = reactive({
  name: '',
  provider: '',
  type: 'meteorologica' as SourceType,
  status: 'pendiente' as 'conectada' | 'pendiente' | 'error' | 'desactivada',
  coverage: '',
  variables: '',
  units: '',
  notes: '',
  requiresEnv: '',
});

const editing = ref<InfoSource | null>(null);
const editForm = reactive({
  name: '',
  provider: '',
  status: 'pendiente' as InfoSource['status'],
  coverage: '',
  notes: '',
  active: true,
});

function openEdit(src: InfoSource): void {
  editing.value = src;
  editForm.name = src.name;
  editForm.provider = src.provider;
  editForm.status = src.status;
  editForm.coverage = src.coverage ?? '';
  editForm.notes = src.notes ?? '';
  errorMsg.value = '';
}

async function submitCreate(): Promise<void> {
  busy.value = true;
  errorMsg.value = '';
  try {
    const source = await createSource({
      name: createForm.name.trim(),
      provider: createForm.provider.trim(),
      type: createForm.type,
      status: createForm.status,
      coverage: createForm.coverage.trim() || null,
      variables: createForm.variables.split(',').map((v) => v.trim()).filter(Boolean),
      units: createForm.units.trim() || null,
      lastSyncAt: null,
      notes: createForm.notes.trim() || null,
      requiresEnv: createForm.requiresEnv.split(',').map((v) => v.trim()).filter(Boolean),
    });
    pushToast('success', 'Fuente registrada', `${source.code} registrada con estado "${LABELS.sourceStatus[source.status]}".`);
    creating.value = false;
    await sourcesQuery.reload();
  } catch (err) {
    errorMsg.value = toUserMessage(err);
  } finally {
    busy.value = false;
  }
}

async function submitEdit(): Promise<void> {
  if (!editing.value) return;
  busy.value = true;
  errorMsg.value = '';
  try {
    await updateSource(editing.value.id, {
      name: editForm.name.trim(),
      provider: editForm.provider.trim(),
      status: editForm.status,
      coverage: editForm.coverage.trim() || null,
      notes: editForm.notes.trim() || null,
    });
    pushToast('success', 'Fuente actualizada', 'El cambio quedó auditado. Nunca marques "conectada" una fuente sin adaptador funcionando.');
    editing.value = null;
    await sourcesQuery.reload();
  } catch (err) {
    errorMsg.value = toUserMessage(err);
  } finally {
    busy.value = false;
  }
}

const statusTone = (s: string): 'success' | 'warning' | 'critical' | 'neutral' =>
  s === 'conectada' ? 'success' : s === 'pendiente' ? 'warning' : s === 'error' ? 'critical' : 'neutral';
</script>

<template>
  <div class="space-y-3">
    <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div>
        <h1 class="text-base font-bold text-[#dbe3f4] uppercase tracking-tight">Fuentes de información</h1>
        <p class="text-xs text-[#bcc9cd] mt-1 max-w-3xl">
          Registro de fuentes con su estado real. Regla de honestidad: una fuente solo puede marcarse
          "conectada" cuando exista un adaptador funcionando y sincronizando. No se almacenan secretos acá.
        </p>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button
          type="button"
          :disabled="syncingOfficial"
          class="flex items-center gap-1.5 bg-[#141c28] hover:bg-[#232a37] text-[#4cd7f6] border border-[#4cd7f6]/40 px-3 py-1.5 rounded text-xs font-semibold shrink-0 transition-colors"
          @click="handleSyncOfficial"
        >
          <span class="material-symbols-outlined text-[15px]" :class="{ 'animate-spin': syncingOfficial }">
            {{ syncingOfficial ? 'refresh' : 'sync' }}
          </span>
          <span>{{ syncingOfficial ? 'Sincronizando...' : 'Sincronizar oficiales (SMN, INA, FIRMS)' }}</span>
        </button>
        <button
          type="button"
          class="flex items-center gap-1.5 bg-[#06b6d4] hover:bg-[#4cd7f6] text-[#00424f] px-3 py-1.5 rounded text-xs font-semibold shrink-0"
          @click="creating = true"
        >
          <span class="material-symbols-outlined text-[16px]">add_circle</span> Nueva fuente
        </button>
      </div>
    </div>

    <StateMessage :state="sourcesQuery.state.value" @retry="sourcesQuery.reload()">
      <template #default="{ data }">
        <div class="space-y-2">
          <article v-for="src in data" :key="src.id" class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3 space-y-1.5">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div class="min-w-0">
                <h2 class="text-sm font-semibold text-[#dbe3f4]">{{ src.name }}</h2>
                <div class="font-mono text-[10px] text-[#869397]">{{ src.code }} · {{ src.provider }}</div>
              </div>
              <div class="flex items-center gap-2">
                <StatusBadge :label="LABELS.sourceType[src.type]" tone="neutral" />
                <StatusBadge :label="LABELS.sourceStatus[src.status]" :tone="statusTone(src.status)" />
                <button
                  type="button"
                  class="bg-[#18202c] hover:bg-[#232a37] text-[#4cd7f6] px-2 py-1 rounded text-[11px] font-mono border border-[#3d494c]/40"
                  @click="openEdit(src)"
                >
                  Editar
                </button>
              </div>
            </div>
            <div class="font-mono text-[10px] text-[#bcc9cd]">Variables: {{ src.variables.join(', ') }}</div>
            <div class="font-mono text-[10px] text-[#869397]">
              Última sincronización: {{ src.lastSyncAt ? formatDateTime(src.lastSyncAt) : 'sin sincronizar' }}
              <template v-if="src.requiresEnv.length"> · Requiere: {{ src.requiresEnv.join(', ') }}</template>
            </div>
          </article>
        </div>
      </template>
      <template #empty>
        <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-8 text-center text-sm text-[#bcc9cd]">Sin fuentes registradas.</div>
      </template>
    </StateMessage>

    <ModalDialog :open="creating" title="Nueva fuente" wide @close="creating = false">
      <form class="space-y-3" @submit.prevent="submitCreate">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="s-name">Nombre</label>
            <input id="s-name" v-model="createForm.name" type="text" required class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]" />
          </div>
          <div>
            <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="s-provider">Proveedor</label>
            <input id="s-provider" v-model="createForm.provider" type="text" required class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]" />
          </div>
          <div>
            <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="s-type">Tipo</label>
            <select id="s-type" v-model="createForm.type" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]">
              <option v-for="(lbl, key) in LABELS.sourceType" :key="key" :value="key">{{ lbl }}</option>
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="s-status">Estado inicial</label>
            <select id="s-status" v-model="createForm.status" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]">
              <option v-for="(lbl, key) in LABELS.sourceStatus" :key="key" :value="key">{{ lbl }}</option>
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="s-coverage">Cobertura</label>
            <input id="s-coverage" v-model="createForm.coverage" type="text" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]" />
          </div>
          <div>
            <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="s-variables">Variables (separadas por coma)</label>
            <input id="s-variables" v-model="createForm.variables" type="text" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]" />
          </div>
          <div>
            <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="s-units">Unidades</label>
            <input id="s-units" v-model="createForm.units" type="text" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]" />
          </div>
          <div>
            <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="s-env">Variables de entorno requeridas (coma)</label>
            <input id="s-env" v-model="createForm.requiresEnv" type="text" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]" />
          </div>
        </div>
        <div>
          <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="s-notes">Notas (condiciones de acceso, documentación…)</label>
          <textarea id="s-notes" v-model="createForm.notes" rows="2" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4] resize-y"></textarea>
        </div>
        <p v-if="errorMsg" class="text-xs text-[#ffb3ad]">{{ errorMsg }}</p>
        <div class="flex justify-end gap-2">
          <button type="button" class="bg-[#232a37] hover:bg-[#323947] text-[#dbe3f4] px-3 py-1.5 rounded text-xs border border-[#3d494c]/40" @click="creating = false">Cancelar</button>
          <button type="submit" :disabled="busy" class="bg-[#06b6d4] hover:bg-[#4cd7f6] disabled:opacity-50 text-[#00424f] font-bold px-4 py-1.5 rounded text-xs">
            {{ busy ? 'Guardando…' : 'Registrar' }}
          </button>
        </div>
      </form>
    </ModalDialog>

    <ModalDialog :open="editing !== null" :title="`Editar ${editing?.code ?? ''}`" @close="editing = null">
      <form v-if="editing" class="space-y-3" @submit.prevent="submitEdit">
        <div>
          <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="e-s-name">Nombre</label>
          <input id="e-s-name" v-model="editForm.name" type="text" required class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]" />
        </div>
        <div>
          <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="e-s-provider">Proveedor</label>
          <input id="e-s-provider" v-model="editForm.provider" type="text" required class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]" />
        </div>
        <div>
          <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="e-s-status">Estado</label>
          <select id="e-s-status" v-model="editForm.status" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]">
            <option v-for="(lbl, key) in LABELS.sourceStatus" :key="key" :value="key">{{ lbl }}</option>
          </select>
        </div>
        <p class="text-[11px] text-[#ffb77d] font-mono">⚠ Marcá "conectada" solo cuando el adaptador exista y esté sincronizando.</p>
        <div>
          <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="e-s-coverage">Cobertura</label>
          <input id="e-s-coverage" v-model="editForm.coverage" type="text" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]" />
        </div>
        <div>
          <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="e-s-notes">Notas</label>
          <textarea id="e-s-notes" v-model="editForm.notes" rows="2" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4] resize-y"></textarea>
        </div>
        <p v-if="errorMsg" class="text-xs text-[#ffb3ad]">{{ errorMsg }}</p>
        <div class="flex justify-end gap-2">
          <button type="button" class="bg-[#232a37] hover:bg-[#323947] text-[#dbe3f4] px-3 py-1.5 rounded text-xs border border-[#3d494c]/40" @click="editing = null">Cancelar</button>
          <button type="submit" :disabled="busy" class="bg-[#06b6d4] hover:bg-[#4cd7f6] disabled:opacity-50 text-[#00424f] font-bold px-4 py-1.5 rounded text-xs">
            {{ busy ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
      </form>
    </ModalDialog>
  </div>
</template>
