<script setup lang="ts">
import { reactive, ref } from 'vue';
import { authState, can } from '@/services/auth.service';
import { updateOwnDisplayName } from '@/services/admin.service';
import { getMyOrganization } from '@/services/admin.service';
import { pushToast } from '@/composables/useToast';
import { toUserMessage } from '@/types/states';
import { LABELS } from '@/config/labels';
import { PERMISSIONS } from '@/types/domain';

const user = authState.user;
const busy = ref(false);
const errorMsg = ref('');

const form = reactive({ displayName: user?.displayName ?? '' });

// Organismo del agente (si pertenece a uno)
const org = ref<Awaited<ReturnType<typeof getMyOrganization>> | null>(null);
const orgLoaded = ref(false);
const orgError = ref('');

if (user?.organizationId) {
  getMyOrganization()
    .then((o) => { org.value = o; })
    .catch((err) => { orgError.value = toUserMessage(err); })
    .finally(() => { orgLoaded.value = true; });
}

const myPermissions = (user?.permissions ?? []).slice().sort();

async function save(): Promise<void> {
  busy.value = true;
  errorMsg.value = '';
  try {
    await updateOwnDisplayName(form.displayName);
    pushToast('success', 'Perfil actualizado', 'Tu nombre de presentación fue guardado.');
  } catch (err) {
    errorMsg.value = toUserMessage(err);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-4">
    <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3">
      <h1 class="text-base font-bold text-[#dbe3f4] uppercase tracking-tight">Perfil y organización</h1>
    </div>

    <div v-if="user" class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <!-- Datos personales -->
      <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-xl p-4 space-y-3">
        <h2 class="text-xs font-bold text-[#dbe3f4] uppercase font-mono tracking-wide">Datos personales</h2>
        <div class="font-mono text-[11px] text-[#869397] space-y-0.5">
          <div>Correo: <span class="text-[#bcc9cd]">{{ user.email }}</span></div>
          <div>Rol: <span class="text-[#bcc9cd]">{{ LABELS.role[user.role] }}</span></div>
          <div v-if="user.specialties.length">
            Especialidades: <span class="text-[#bcc9cd]">{{ user.specialties.map((s) => LABELS.specialty[s]).join(', ') }}</span>
          </div>
        </div>
        <form class="space-y-2" @submit.prevent="save">
          <label class="block text-[11px] font-mono text-[#869397] uppercase" for="displayName">Nombre de presentación</label>
          <input
            id="displayName"
            v-model="form.displayName"
            type="text" required minlength="2"
            class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-3 py-2 text-sm text-[#dbe3f4]"
          />
          <p v-if="errorMsg" class="text-xs text-[#ffb3ad]">{{ errorMsg }}</p>
          <button type="submit" :disabled="busy" class="bg-[#06b6d4] hover:bg-[#4cd7f6] disabled:opacity-50 text-[#00424f] font-semibold px-4 py-1.5 rounded text-xs">
            {{ busy ? 'Guardando…' : 'Guardar' }}
          </button>
        </form>
      </div>

      <!-- Organización -->
      <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-xl p-4 space-y-2">
        <h2 class="text-xs font-bold text-[#dbe3f4] uppercase font-mono tracking-wide">Organismo</h2>
        <div v-if="!user.organizationId" class="text-xs text-[#869397]">
          No pertenecés a ningún organismo registrado. La asignación la realiza el administrador.
        </div>
        <div v-else-if="org" class="space-y-1 text-xs">
          <div class="text-sm font-semibold text-[#dbe3f4]">{{ org.name }}</div>
          <div class="font-mono text-[11px] text-[#869397]">{{ LABELS.orgType[org.type] }} · {{ org.territory }}</div>
          <div v-if="org.contact" class="font-mono text-[11px] text-[#bcc9cd]">Contacto: {{ org.contact }}</div>
          <StatusBadge :label="org.active ? 'Activo' : 'Inactivo'" :tone="org.active ? 'success' : 'neutral'" />
        </div>
        <div v-else-if="orgError" class="text-xs text-[#ffb3ad]">{{ orgError }}</div>
        <div v-else-if="!orgLoaded" class="text-xs text-[#869397] font-mono">Consultando organismo…</div>

        <!-- Permisos explícitos -->
        <div class="pt-2 border-t border-[#3d494c]/20">
          <h3 class="text-[11px] font-bold text-[#dbe3f4] uppercase font-mono tracking-wide mb-1.5">Permisos asignados</h3>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="p in myPermissions"
              :key="p"
              class="font-mono text-[9px] bg-[#06b6d4]/10 text-[#4cd7f6] border border-[#06b6d4]/30 rounded px-1.5 py-0.5"
            >
              {{ p }}
            </span>
            <span v-if="myPermissions.length === 0" class="text-[11px] text-[#869397]">Sin permisos adicionales a los del rol.</span>
          </div>
          <p class="text-[10px] text-[#869397] mt-2 font-mono">
            Los permisos los asigna el administrador y los aplica el backend en cada operación.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
