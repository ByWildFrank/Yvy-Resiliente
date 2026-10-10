<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useAsyncData } from '@/composables/useAsyncData';
import { createSensor, listOrganizations } from '@/services/admin.service';
import { createSensor as createSensorOp, listSensors, updateSensor } from '@/services/monitoring.service';
import { pushToast } from '@/composables/useToast';
import { toUserMessage } from '@/types/states';
import { LABELS, formatTimeAgo } from '@/config/labels';
import type { Sensor, SensorType } from '@/types/domain';
import StateMessage from '@/components/ui/StateMessage.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import ModalDialog from '@/components/ui/ModalDialog.vue';

const sensorsQuery = useAsyncData<Sensor[]>(() => listSensors(), { isEmpty: (d) => d.length === 0 });
const orgsQuery = useAsyncData(() => listOrganizations(), { isEmpty: () => false });

const busy = ref(false);
const errorMsg = ref('');

const creating = ref(false);
const createForm = reactive({
  code: '',
  name: '',
  type: 'hidrometrico' as SensorType,
  variable: '',
  unit: '',
  protocol: '',
  status: 'mantenimiento' as Sensor['status'],
  lat: '',
  lng: '',
  label: '',
  organizationId: '' as string | '',
});

const editing = ref<Sensor | null>(null);
const editForm = reactive({ name: '', status: 'mantenimiento' as Sensor['status'], active: true, organizationId: '' as string | '' });

function openEdit(sensor: Sensor): void {
  editing.value = sensor;
  editForm.name = sensor.name;
  editForm.status = sensor.status;
  editForm.active = sensor.active;
  editForm.organizationId = sensor.organizationId ?? '';
  errorMsg.value = '';
}

async function submitCreate(): Promise<void> {
  busy.value = true;
  errorMsg.value = '';
  try {
    const lat = Number(createForm.lat.replace(',', '.'));
    const lng = Number(createForm.lng.replace(',', '.'));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error('Ingresá coordenadas válidas.');
    const sensor = await createSensorOp({
      code: createForm.code.trim().toUpperCase(),
      name: createForm.name.trim(),
      type: createForm.type,
      variable: createForm.variable.trim(),
      unit: createForm.unit.trim(),
      protocol: createForm.protocol.trim() || null,
      status: createForm.status,
      battery: null,
      rssi: null,
      lastPayloadAt: null,
      location: { lat, lng, label: createForm.label.trim() || undefined },
      organizationId: createForm.organizationId || null,
      active: true,
    });
    pushToast('success', 'Sensor registrado', `${sensor.code} dado de alta (sin telemetría hasta su primer dato).`);
    creating.value = false;
    await sensorsQuery.reload();
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
    await updateSensor(editing.value.id, {
      name: editForm.name.trim(),
      status: editForm.status,
      active: editForm.active,
      organizationId: editForm.organizationId || null,
    });
    pushToast('success', 'Sensor actualizado', 'El cambio quedó auditado.');
    editing.value = null;
    await sensorsQuery.reload();
  } catch (err) {
    errorMsg.value = toUserMessage(err);
  } finally {
    busy.value = false;
  }
}

const statusTone = (s: string): 'success' | 'warning' | 'critical' | 'neutral' =>
  s === 'online' ? 'success' : s === 'advertencia' ? 'warning' : s === 'silente' ? 'critical' : 'neutral';
</script>

<template>
  <div class="space-y-3">
    <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div>
        <h1 class="text-base font-bold text-[#dbe3f4] uppercase tracking-tight">Sensores</h1>
        <p class="text-xs text-[#bcc9cd] mt-1 max-w-3xl">
          Registro de dispositivos. El alta no inventa telemetría: el sensor figura sin datos hasta que
          el dispositivo (o su adaptador) reporte el primer payload.
        </p>
      </div>
      <button
        type="button"
        class="flex items-center gap-1.5 bg-[#06b6d4] hover:bg-[#4cd7f6] text-[#00424f] px-3 py-1.5 rounded text-xs font-semibold shrink-0"
        @click="creating = true"
      >
        <span class="material-symbols-outlined text-[16px]">add_circle</span> Registrar sensor
      </button>
    </div>

    <StateMessage :state="sensorsQuery.state.value" @retry="sensorsQuery.reload()">
      <template #default="{ data }">
        <div class="overflow-x-auto bg-[#141c28] border border-[#3d494c]/40 rounded-lg">
          <table class="w-full text-left text-xs">
            <thead class="bg-[#070e1a] text-[#869397] font-mono text-[10px] uppercase">
              <tr>
                <th class="p-2.5">Dispositivo</th>
                <th class="p-2.5">Tipo</th>
                <th class="p-2.5">Organismo</th>
                <th class="p-2.5">Último dato</th>
                <th class="p-2.5">Estado</th>
                <th class="p-2.5">Activo</th>
                <th class="p-2.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#3d494c]/20">
              <tr v-for="sen in data" :key="sen.id" class="hover:bg-[#18202c] transition-colors">
                <td class="p-2.5">
                  <div class="font-semibold text-[#dbe3f4]">{{ sen.name }}</div>
                  <div class="font-mono text-[10px] text-[#4cd7f6]">{{ sen.code }} · {{ sen.protocol ?? '—' }}</div>
                </td>
                <td class="p-2.5"><StatusBadge :label="LABELS.sensorType[sen.type]" tone="neutral" /></td>
                <td class="p-2.5 text-[#bcc9cd] font-mono text-[10px]">
                  <template v-if="orgsQuery.state.value.status === 'ok'">
                    {{ orgsQuery.state.value.data.find((o) => o.id === sen.organizationId)?.name ?? '—' }}
                  </template>
                </td>
                <td class="p-2.5 font-mono text-[10px] text-[#869397]">{{ sen.lastPayloadAt ? formatTimeAgo(sen.lastPayloadAt) : 'sin datos' }}</td>
                <td class="p-2.5"><StatusBadge :label="LABELS.sensorStatus[sen.status]" :tone="statusTone(sen.status)" /></td>
                <td class="p-2.5">
                  <span class="font-mono text-[10px]" :class="sen.active ? 'text-[#4cd7f6]' : 'text-[#869397]'">{{ sen.active ? 'Sí' : 'No' }}</span>
                </td>
                <td class="p-2.5 text-right">
                  <button
                    type="button"
                    class="bg-[#18202c] hover:bg-[#232a37] text-[#4cd7f6] px-2 py-1 rounded text-[11px] font-mono border border-[#3d494c]/40"
                    @click="openEdit(sen)"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
      <template #empty>
        <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-8 text-center text-sm text-[#bcc9cd]">Sin sensores registrados.</div>
      </template>
    </StateMessage>

    <ModalDialog :open="creating" title="Registrar sensor" wide @close="creating = false">
      <form class="space-y-3" @submit.prevent="submitCreate">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="sn-code">Código</label>
            <input id="sn-code" v-model="createForm.code" type="text" required placeholder="NODE-07" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]" />
          </div>
          <div>
            <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="sn-name">Nombre</label>
            <input id="sn-name" v-model="createForm.name" type="text" required class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]" />
          </div>
          <div>
            <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="sn-type">Tipo</label>
            <select id="sn-type" v-model="createForm.type" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]">
              <option v-for="(lbl, key) in LABELS.sensorType" :key="key" :value="key">{{ lbl }}</option>
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="sn-status">Estado inicial</label>
            <select id="sn-status" v-model="createForm.status" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]">
              <option v-for="(lbl, key) in LABELS.sensorStatus" :key="key" :value="key">{{ lbl }}</option>
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="sn-variable">Variable</label>
            <input id="sn-variable" v-model="createForm.variable" type="text" required placeholder="Nivel de agua" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]" />
          </div>
          <div>
            <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="sn-unit">Unidad</label>
            <input id="sn-unit" v-model="createForm.unit" type="text" required placeholder="m" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]" />
          </div>
          <div>
            <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="sn-lat">Latitud</label>
            <input id="sn-lat" v-model="createForm.lat" type="text" required class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]" />
          </div>
          <div>
            <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="sn-lng">Longitud</label>
            <input id="sn-lng" v-model="createForm.lng" type="text" required class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]" />
          </div>
          <div>
            <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="sn-label">Referencia</label>
            <input id="sn-label" v-model="createForm.label" type="text" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]" />
          </div>
          <div>
            <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="sn-org">Organismo responsable</label>
            <select id="sn-org" v-model="createForm.organizationId" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]">
              <option value="">Sin organismo</option>
              <template v-if="orgsQuery.state.value.status === 'ok'">
                <option v-for="org in orgsQuery.state.value.data" :key="org.id" :value="org.id">{{ org.name }}</option>
              </template>
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="sn-protocol">Protocolo</label>
            <input id="sn-protocol" v-model="createForm.protocol" type="text" placeholder="LoRaWAN…" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]" />
          </div>
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
          <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="e-sn-name">Nombre</label>
          <input id="e-sn-name" v-model="editForm.name" type="text" required class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]" />
        </div>
        <div>
          <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="e-sn-status">Estado</label>
          <select id="e-sn-status" v-model="editForm.status" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]">
            <option v-for="(lbl, key) in LABELS.sensorStatus" :key="key" :value="key">{{ lbl }}</option>
          </select>
        </div>
        <div>
          <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="e-sn-org">Organismo</label>
          <select id="e-sn-org" v-model="editForm.organizationId" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]">
            <option value="">Sin organismo</option>
            <template v-if="orgsQuery.state.value.status === 'ok'">
              <option v-for="org in orgsQuery.state.value.data" :key="org.id" :value="org.id">{{ org.name }}</option>
            </template>
          </select>
        </div>
        <label class="flex items-center gap-2 text-xs text-[#bcc9cd]">
          <input v-model="editForm.active" type="checkbox" class="accent-[#4cd7f6]" /> Activo
        </label>
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
