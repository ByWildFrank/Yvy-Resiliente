<script setup lang="ts">
import { reactive, ref } from 'vue';
import { authState } from '@/services/auth.service';
import { updateOwnDisplayName } from '@/services/admin.service';
import { pushToast } from '@/composables/useToast';
import { toUserMessage } from '@/types/states';
import { LABELS } from '@/config/labels';

const user = authState.user;

const form = reactive({
  displayName: user?.displayName ?? '',
});
const busy = ref(false);
const errorMsg = ref('');

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
  <div class="max-w-xl mx-auto space-y-4">
    <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3">
      <h1 class="text-base font-bold text-[#dbe3f4] uppercase tracking-tight">Mi perfil</h1>
      <p class="text-xs text-[#bcc9cd] mt-1">Datos de tu cuenta en Yvy.</p>
    </div>

    <div v-if="user" class="bg-[#141c28] border border-[#3d494c]/40 rounded-xl p-4 space-y-4">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-full bg-[#4cd7f6] flex items-center justify-center text-[#003640]">
          <span class="material-symbols-outlined text-2xl">person</span>
        </div>
        <div>
          <div class="text-sm font-semibold text-[#dbe3f4]">{{ user.displayName }}</div>
          <div class="font-mono text-[11px] text-[#869397]">{{ user.email }}</div>
        </div>
      </div>

      <dl class="grid grid-cols-2 gap-2 text-xs font-mono">
        <div class="bg-[#18202c] rounded p-2 border border-[#3d494c]/30">
          <dt class="text-[#869397] text-[10px] uppercase">Rol</dt>
          <dd class="text-[#dbe3f4] mt-0.5">{{ LABELS.role[user.role] }}</dd>
        </div>
        <div class="bg-[#18202c] rounded p-2 border border-[#3d494c]/30">
          <dt class="text-[#869397] text-[10px] uppercase">Miembro desde</dt>
          <dd class="text-[#dbe3f4] mt-0.5">{{ new Date(user.createdAt).toLocaleDateString('es-AR') }}</dd>
        </div>
      </dl>

      <form class="space-y-2 border-t border-[#3d494c]/20 pt-3" @submit.prevent="save">
        <label class="block text-[11px] font-mono text-[#869397] uppercase tracking-wider" for="displayName">
          Nombre de presentación
        </label>
        <input
          id="displayName"
          v-model="form.displayName"
          type="text"
          required
          minlength="2"
          class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-3 py-2 text-sm text-[#dbe3f4] focus:outline-none focus:ring-1 focus:ring-[#4cd7f6]"
        />
        <p v-if="errorMsg" class="text-xs text-[#ffb3ad]">{{ errorMsg }}</p>
        <button
          type="submit"
          :disabled="busy"
          class="bg-[#06b6d4] hover:bg-[#4cd7f6] disabled:opacity-50 text-[#00424f] font-semibold px-4 py-1.5 rounded text-xs"
        >
          {{ busy ? 'Guardando…' : 'Guardar cambios' }}
        </button>
      </form>

      <p class="text-[11px] text-[#869397] font-mono border-t border-[#3d494c]/20 pt-3">
        El rol y los permisos los administra el equipo de la plataforma. Si necesitás operar como
        agente de un organismo, contactá al administrador.
      </p>
    </div>
  </div>
</template>
