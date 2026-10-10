<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useAsyncData } from '@/composables/useAsyncData';
import { createOrganization, listOrganizations, updateOrganization } from '@/services/admin.service';
import { pushToast } from '@/composables/useToast';
import { toUserMessage } from '@/types/states';
import { LABELS, formatDateTime } from '@/config/labels';
import type { Organization, OrganizationType } from '@/types/domain';
import StateMessage from '@/components/ui/StateMessage.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import ModalDialog from '@/components/ui/ModalDialog.vue';

const orgsQuery = useAsyncData<Organization[]>(() => listOrganizations(), { isEmpty: (d) => d.length === 0 });

const busy = ref(false);
const errorMsg = ref('');

// Creación
const creating = ref(false);
const createForm = reactive({
  name: '',
  type: 'bomberos' as OrganizationType,
  territory: '',
  contact: '',
});

// Edición
const editing = ref<Organization | null>(null);
const editForm = reactive({ name: '', type: 'otro' as OrganizationType, territory: '', contact: '', active: true });

function openEdit(org: Organization): void {
  editing.value = org;
  editForm.name = org.name;
  editForm.type = org.type;
  editForm.territory = org.territory;
  editForm.contact = org.contact ?? '';
  editForm.active = org.active;
  errorMsg.value = '';
}

async function submitCreate(): Promise<void> {
  busy.value = true;
  errorMsg.value = '';
  try {
    const org = await createOrganization({
      name: createForm.name.trim(),
      type: createForm.type,
      territory: createForm.territory.trim(),
      contact: createForm.contact.trim() || null,
      active: true,
    });
    pushToast('success', 'Organismo creado', `${org.name} registrado y auditado.`);
    creating.value = false;
    createForm.name = ''; createForm.territory = ''; createForm.contact = '';
    await orgsQuery.reload();
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
    await updateOrganization(editing.value.id, {
      name: editForm.name.trim(),
      type: editForm.type,
      territory: editForm.territory.trim(),
      contact: editForm.contact.trim() || null,
      active: editForm.active,
    });
    pushToast('success', 'Organismo actualizado', 'El cambio quedó auditado.');
    editing.value = null;
    await orgsQuery.reload();
  } catch (err) {
    errorMsg.value = toUserMessage(err);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="space-y-3">
    <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div>
        <h1 class="text-base font-bold text-[#dbe3f4] uppercase tracking-tight">Organismos</h1>
        <p class="text-xs text-[#bcc9cd] mt-1">Directorio de organismos con su territorio de acción. Toda modificación queda auditada.</p>
      </div>
      <button
        type="button"
        class="flex items-center gap-1.5 bg-[#06b6d4] hover:bg-[#4cd7f6] text-[#00424f] px-3 py-1.5 rounded text-xs font-semibold shrink-0"
        @click="creating = true"
      >
        <span class="material-symbols-outlined text-[16px]">add_circle</span> Nuevo organismo
      </button>
    </div>

    <StateMessage :state="orgsQuery.state.value" @retry="orgsQuery.reload()">
      <template #default="{ data }">
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <article v-for="org in data" :key="org.id" class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3 space-y-2">
            <div class="flex items-start justify-between gap-2">
              <h2 class="text-sm font-semibold text-[#dbe3f4] leading-snug">{{ org.name }}</h2>
              <StatusBadge :label="org.active ? 'Activo' : 'Inactivo'" :tone="org.active ? 'success' : 'neutral'" />
            </div>
            <div class="flex flex-wrap gap-1.5">
              <StatusBadge :label="LABELS.orgType[org.type]" tone="info" />
              <StatusBadge :label="org.territory" tone="neutral" />
            </div>
            <div class="font-mono text-[10px] text-[#869397] space-y-0.5">
              <div v-if="org.contact">Contacto: {{ org.contact }}</div>
              <div>Actualizado: {{ formatDateTime(org.updatedAt) }}</div>
            </div>
            <button
              type="button"
              class="bg-[#18202c] hover:bg-[#232a37] text-[#4cd7f6] px-2.5 py-1 rounded text-[11px] font-mono border border-[#3d494c]/40"
              @click="openEdit(org)"
            >
              Editar
            </button>
          </article>
        </div>
      </template>
      <template #empty>
        <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-8 text-center">
          <span class="material-symbols-outlined text-3xl text-[#4cd7f6]">account_balance</span>
          <p class="text-sm text-[#bcc9cd] mt-2">Sin organismos registrados.</p>
        </div>
      </template>
    </StateMessage>

    <ModalDialog :open="creating" title="Nuevo organismo" @close="creating = false">
      <form class="space-y-3" @submit.prevent="submitCreate">
        <div>
          <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="org-name">Nombre</label>
          <input id="org-name" v-model="createForm.name" type="text" required class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]" />
        </div>
        <div>
          <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="org-type">Tipo</label>
          <select id="org-type" v-model="createForm.type" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]">
            <option v-for="(lbl, key) in LABELS.orgType" :key="key" :value="key">{{ lbl }}</option>
          </select>
        </div>
        <div>
          <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="org-territory">Territorio</label>
          <input id="org-territory" v-model="createForm.territory" type="text" required class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]" />
        </div>
        <div>
          <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="org-contact">Contacto (opcional)</label>
          <input id="org-contact" v-model="createForm.contact" type="text" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]" />
        </div>
        <p v-if="errorMsg" class="text-xs text-[#ffb3ad]">{{ errorMsg }}</p>
        <div class="flex justify-end gap-2">
          <button type="button" class="bg-[#232a37] hover:bg-[#323947] text-[#dbe3f4] px-3 py-1.5 rounded text-xs border border-[#3d494c]/40" @click="creating = false">Cancelar</button>
          <button type="submit" :disabled="busy" class="bg-[#06b6d4] hover:bg-[#4cd7f6] disabled:opacity-50 text-[#00424f] font-bold px-4 py-1.5 rounded text-xs">
            {{ busy ? 'Guardando…' : 'Crear' }}
          </button>
        </div>
      </form>
    </ModalDialog>

    <ModalDialog :open="editing !== null" :title="`Editar ${editing?.name ?? ''}`" @close="editing = null">
      <form v-if="editing" class="space-y-3" @submit.prevent="submitEdit">
        <div>
          <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="e-org-name">Nombre</label>
          <input id="e-org-name" v-model="editForm.name" type="text" required class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]" />
        </div>
        <div>
          <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="e-org-type">Tipo</label>
          <select id="e-org-type" v-model="editForm.type" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]">
            <option v-for="(lbl, key) in LABELS.orgType" :key="key" :value="key">{{ lbl }}</option>
          </select>
        </div>
        <div>
          <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="e-org-territory">Territorio</label>
          <input id="e-org-territory" v-model="editForm.territory" type="text" required class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]" />
        </div>
        <div>
          <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="e-org-contact">Contacto</label>
          <input id="e-org-contact" v-model="editForm.contact" type="text" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]" />
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
