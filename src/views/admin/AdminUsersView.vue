<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useAsyncData } from '@/composables/useAsyncData';
import { createUser, listOrganizations, listUsers, updateUser } from '@/services/admin.service';
import { authState } from '@/services/auth.service';
import { pushToast } from '@/composables/useToast';
import { toUserMessage } from '@/types/states';
import { LABELS } from '@/config/labels';
import { PERMISSIONS, SPECIALTIES, type Permission, type Role, type Specialty, type UserAccount } from '@/types/domain';
import StateMessage from '@/components/ui/StateMessage.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import ModalDialog from '@/components/ui/ModalDialog.vue';

const usersQuery = useAsyncData<UserAccount[]>(() => listUsers(), { isEmpty: (d) => d.length === 0 });
const orgsQuery = useAsyncData(() => listOrganizations(), { isEmpty: () => false });

const search = ref('');
const roleFilter = ref<'ALL' | Role>('ALL');

const filtered = computed(() => {
  if (usersQuery.state.value.status !== 'ok') return [];
  return usersQuery.state.value.data.filter((u) => {
    if (roleFilter.value !== 'ALL' && u.role !== roleFilter.value) return false;
    if (search.value) {
      const q = search.value.toLowerCase();
      if (!`${u.displayName} ${u.email}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });
});

// ─── Edición de usuario ──
const editing = ref<UserAccount | null>(null);
const editForm = reactive({
  displayName: '',
  role: 'ciudadano' as Role,
  organizationId: '' as string | '',
  specialties: [] as Specialty[],
  permissions: [] as Permission[],
  active: true,
});
const busy = ref(false);
const errorMsg = ref('');

const toggleIn = (arr: string[], value: string): void => {
  const idx = arr.indexOf(value);
  if (idx >= 0) arr.splice(idx, 1);
  else arr.push(value);
};

function openEdit(user: UserAccount): void {
  editing.value = user;
  editForm.displayName = user.displayName;
  editForm.role = user.role;
  editForm.organizationId = user.organizationId ?? '';
  editForm.specialties = [...user.specialties];
  editForm.permissions = [...user.permissions];
  editForm.active = user.active;
  errorMsg.value = '';
}

async function saveEdit(): Promise<void> {
  if (!editing.value) return;
  busy.value = true;
  errorMsg.value = '';
  try {
    await updateUser(editing.value.uid, {
      displayName: editForm.displayName.trim(),
      role: editForm.role,
      organizationId: editForm.organizationId || null,
      specialties: editForm.specialties,
      permissions: editForm.permissions,
      active: editForm.active,
    });
    pushToast('success', 'Usuario actualizado', `Los cambios en ${editing.value.email} quedaron auditados.`);
    editing.value = null;
    await usersQuery.reload();
  } catch (err) {
    errorMsg.value = toUserMessage(err);
  } finally {
    busy.value = false;
  }
}

// ─── Alta de usuario (perfil del documento) ──
const creating = ref(false);
const createForm = reactive({
  displayName: '',
  email: '',
  role: 'agente' as Role,
  organizationId: '' as string | '',
  specialties: [] as Specialty[],
  permissions: [] as Permission[],
  active: true,
});

async function createUserSubmit(): Promise<void> {
  busy.value = true;
  errorMsg.value = '';
  try {
    const user = await createUser({
      displayName: createForm.displayName.trim(),
      email: createForm.email.trim(),
      role: createForm.role,
      organizationId: createForm.organizationId || null,
      specialties: createForm.specialties,
      permissions: createForm.permissions,
      active: createForm.active,
    });
    pushToast('success', 'Perfil creado', `${user.email} registrado (sin credenciales de acceso todavía).`);
    creating.value = false;
    await usersQuery.reload();
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
        <h1 class="text-base font-bold text-[#dbe3f4] uppercase tracking-tight">Usuarios, roles y permisos</h1>
        <p class="text-xs text-[#bcc9cd] mt-1 max-w-3xl">
          Asignación de roles, organismo, especialidades y permisos explícitos. Toda modificación queda auditada.
          El alta registra el perfil del documento; la credencial de acceso (Auth) se gestiona por proceso administrativo.
        </p>
      </div>
      <button
        type="button"
        class="flex items-center gap-1.5 bg-[#06b6d4] hover:bg-[#4cd7f6] text-[#00424f] px-3 py-1.5 rounded text-xs font-semibold shrink-0"
        @click="creating = true"
      >
        <span class="material-symbols-outlined text-[16px]">person_add</span> Nuevo perfil
      </button>
    </div>

    <div class="flex flex-wrap gap-2">
      <input
        v-model="search" type="text" placeholder="Buscar por nombre o correo…"
        class="flex-1 min-w-[200px] bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-1.5 text-xs text-[#dbe3f4] placeholder:text-[#869397]"
      />
      <select v-model="roleFilter" class="bg-[#18202c] border border-[#3d494c]/40 rounded px-2 py-1.5 text-xs text-[#dbe3f4] font-mono">
        <option value="ALL">Todos los roles</option>
        <option v-for="(lbl, key) in LABELS.role" :key="key" :value="key">{{ lbl }}</option>
      </select>
    </div>

    <StateMessage :state="usersQuery.state.value" @retry="usersQuery.reload()">
      <template #default="{ data }">
        <div class="overflow-x-auto bg-[#141c28] border border-[#3d494c]/40 rounded-lg">
          <table class="w-full text-left text-xs">
            <thead class="bg-[#070e1a] text-[#869397] font-mono text-[10px] uppercase">
              <tr>
                <th class="p-2.5">Usuario</th>
                <th class="p-2.5">Rol</th>
                <th class="p-2.5">Especialidades</th>
                <th class="p-2.5">Permisos extra</th>
                <th class="p-2.5">Estado</th>
                <th class="p-2.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#3d494c]/20">
              <tr v-for="u in filtered" :key="u.uid" class="hover:bg-[#18202c] transition-colors">
                <td class="p-2.5">
                  <div class="font-semibold text-[#dbe3f4]">{{ u.displayName }}</div>
                  <div class="font-mono text-[10px] text-[#869397]">{{ u.email }}</div>
                </td>
                <td class="p-2.5"><StatusBadge :label="LABELS.role[u.role]" :tone="u.role === 'admin' ? 'warning' : u.role === 'agente' ? 'info' : 'neutral'" /></td>
                <td class="p-2.5 text-[#bcc9cd]">
                  <template v-if="u.specialties.length">{{ u.specialties.map((s) => LABELS.specialty[s]).join(', ') }}</template>
                  <span v-else class="text-[#869397]">—</span>
                </td>
                <td class="p-2.5 font-mono text-[10px] text-[#4cd7f6]">{{ u.permissions.length || '—' }}</td>
                <td class="p-2.5">
                  <StatusBadge :label="u.active ? 'Activo' : 'Desactivado'" :tone="u.active ? 'success' : 'critical'" />
                </td>
                <td class="p-2.5 text-right">
                  <button
                    type="button"
                    :disabled="u.uid === authState.user?.uid && false"
                    class="bg-[#18202c] hover:bg-[#232a37] text-[#4cd7f6] px-2 py-1 rounded text-[11px] font-mono border border-[#3d494c]/40"
                    @click="openEdit(u)"
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
        <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-8 text-center text-sm text-[#bcc9cd]">
          Sin usuarios que coincidan con los filtros.
        </div>
      </template>
    </StateMessage>

    <!-- Modal edición -->
    <ModalDialog :open="editing !== null" :title="`Editar ${editing?.email ?? ''}`" wide @close="editing = null">
      <form v-if="editing" class="space-y-4" @submit.prevent="saveEdit">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="u-name">Nombre</label>
            <input id="u-name" v-model="editForm.displayName" type="text" required class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]" />
          </div>
          <div>
            <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="u-role">Rol</label>
            <select id="u-role" v-model="editForm.role" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]">
              <option v-for="(lbl, key) in LABELS.role" :key="key" :value="key">{{ lbl }}</option>
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="u-org">Organismo</label>
            <select id="u-org" v-model="editForm.organizationId" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]">
              <option value="">Sin organismo</option>
              <template v-if="orgsQuery.state.value.status === 'ok'">
                <option v-for="org in orgsQuery.state.value.data" :key="org.id" :value="org.id">{{ org.name }}</option>
              </template>
            </select>
          </div>
          <div class="flex items-end">
            <label class="flex items-center gap-2 text-xs text-[#bcc9cd]">
              <input v-model="editForm.active" type="checkbox" class="accent-[#4cd7f6]" />
              Cuenta activa
            </label>
          </div>
        </div>

        <div>
          <div class="text-[11px] font-mono text-[#869397] uppercase mb-1.5">Especialidades (agentes)</div>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="spec in SPECIALTIES" :key="spec" type="button"
              :class="['font-mono text-[10px] px-2 py-1 rounded border transition-colors', editForm.specialties.includes(spec) ? 'bg-[#06b6d4]/20 border-[#06b6d4] text-[#4cd7f6]' : 'bg-[#18202c] border-[#3d494c]/30 text-[#869397]']"
              @click="toggleIn(editForm.specialties, spec)"
            >
              {{ LABELS.specialty[spec] }}
            </button>
          </div>
        </div>

        <div>
          <div class="text-[11px] font-mono text-[#869397] uppercase mb-1.5">Permisos explícitos</div>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-1 max-h-48 overflow-y-auto pr-1">
            <button
              v-for="perm in PERMISSIONS" :key="perm" type="button"
              :class="['font-mono text-[9px] px-1.5 py-1 rounded border text-left transition-colors', editForm.permissions.includes(perm) ? 'bg-[#06b6d4]/20 border-[#06b6d4] text-[#4cd7f6]' : 'bg-[#18202c] border-[#3d494c]/30 text-[#869397]']"
              @click="toggleIn(editForm.permissions, perm)"
            >
              {{ perm }}
            </button>
          </div>
          <p class="text-[10px] text-[#869397] mt-1.5 font-mono">
            Los permisos institucionales (alerts:publish, incidents:verify) no se otorgan por defecto a administradores técnicos.
          </p>
        </div>

        <p v-if="errorMsg" class="text-xs text-[#ffb3ad] bg-[#a40217]/20 border border-[#a40217]/40 rounded px-3 py-2">{{ errorMsg }}</p>

        <div class="flex justify-end gap-2">
          <button type="button" class="bg-[#232a37] hover:bg-[#323947] text-[#dbe3f4] px-3 py-1.5 rounded text-xs border border-[#3d494c]/40" @click="editing = null">Cancelar</button>
          <button type="submit" :disabled="busy" class="bg-[#06b6d4] hover:bg-[#4cd7f6] disabled:opacity-50 text-[#00424f] font-bold px-4 py-1.5 rounded text-xs">
            {{ busy ? 'Guardando…' : 'Guardar cambios' }}
          </button>
        </div>
      </form>
    </ModalDialog>

    <!-- Modal creación -->
    <ModalDialog :open="creating" title="Nuevo perfil de usuario" wide @close="creating = false">
      <form class="space-y-3" @submit.prevent="createUserSubmit">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="c-name">Nombre</label>
            <input id="c-name" v-model="createForm.displayName" type="text" required class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]" />
          </div>
          <div>
            <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="c-email">Correo</label>
            <input id="c-email" v-model="createForm.email" type="email" required class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]" />
          </div>
          <div>
            <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="c-role">Rol</label>
            <select id="c-role" v-model="createForm.role" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]">
              <option v-for="(lbl, key) in LABELS.role" :key="key" :value="key">{{ lbl }}</option>
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="c-org">Organismo</label>
            <select id="c-org" v-model="createForm.organizationId" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-sm text-[#dbe3f4]">
              <option value="">Sin organismo</option>
              <template v-if="orgsQuery.state.value.status === 'ok'">
                <option v-for="org in orgsQuery.state.value.data" :key="org.id" :value="org.id">{{ org.name }}</option>
              </template>
            </select>
          </div>
        </div>
        <div>
          <div class="text-[11px] font-mono text-[#869397] uppercase mb-1.5">Especialidades</div>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="spec in SPECIALTIES" :key="spec" type="button"
              :class="['font-mono text-[10px] px-2 py-1 rounded border transition-colors', createForm.specialties.includes(spec) ? 'bg-[#06b6d4]/20 border-[#06b6d4] text-[#4cd7f6]' : 'bg-[#18202c] border-[#3d494c]/30 text-[#869397]']"
              @click="toggleIn(createForm.specialties, spec)"
            >
              {{ LABELS.specialty[spec] }}
            </button>
          </div>
        </div>
        <div>
          <div class="text-[11px] font-mono text-[#869397] uppercase mb-1.5">Permisos explícitos</div>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-1 max-h-40 overflow-y-auto pr-1">
            <button
              v-for="perm in PERMISSIONS" :key="perm" type="button"
              :class="['font-mono text-[9px] px-1.5 py-1 rounded border text-left transition-colors', createForm.permissions.includes(perm) ? 'bg-[#06b6d4]/20 border-[#06b6d4] text-[#4cd7f6]' : 'bg-[#18202c] border-[#3d494c]/30 text-[#869397]']"
              @click="toggleIn(createForm.permissions, perm)"
            >
              {{ perm }}
            </button>
          </div>
        </div>

        <p class="text-[11px] text-[#869397] font-mono leading-relaxed">
          Nota: se registra el perfil del documento. La credencial de acceso (Auth) se habilita por proceso
          administrativo separado; el usuario también puede autoregistrarse como ciudadano desde el login.
        </p>
        <p v-if="errorMsg" class="text-xs text-[#ffb3ad]">{{ errorMsg }}</p>
        <div class="flex justify-end gap-2">
          <button type="button" class="bg-[#232a37] hover:bg-[#323947] text-[#dbe3f4] px-3 py-1.5 rounded text-xs border border-[#3d494c]/40" @click="creating = false">Cancelar</button>
          <button type="submit" :disabled="busy" class="bg-[#06b6d4] hover:bg-[#4cd7f6] disabled:opacity-50 text-[#00424f] font-bold px-4 py-1.5 rounded text-xs">
            {{ busy ? 'Guardando…' : 'Crear perfil' }}
          </button>
        </div>
      </form>
    </ModalDialog>
  </div>
</template>
