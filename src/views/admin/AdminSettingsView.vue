<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { useAsyncData } from '@/composables/useAsyncData';
import { getSettings, updateSettings } from '@/services/admin.service';
import { can } from '@/services/auth.service';
import { pushToast } from '@/composables/useToast';
import { toUserMessage } from '@/types/states';
import { formatDateTime } from '@/config/labels';
import StateMessage from '@/components/ui/StateMessage.vue';
import type { AppSettings } from '@/types/domain';

const settingsQuery = useAsyncData<AppSettings | null>(() => getSettings());
const canManage = can('settings:manage');

const form = reactive({ appName: '', regionLabel: '', defaultTerritory: '', demoBannerEnabled: true });
const busy = ref(false);
const errorMsg = ref('');

watch(
  () => settingsQuery.state.value,
  (st) => {
    if (st.status === 'ok' && st.data) {
      form.appName = st.data.appName;
      form.regionLabel = st.data.regionLabel;
      form.defaultTerritory = st.data.defaultTerritory;
      form.demoBannerEnabled = st.data.demoBannerEnabled;
    }
  },
  { immediate: true },
);

async function save(): Promise<void> {
  busy.value = true;
  errorMsg.value = '';
  try {
    await updateSettings({
      appName: form.appName.trim(),
      regionLabel: form.regionLabel.trim(),
      defaultTerritory: form.defaultTerritory.trim(),
      demoBannerEnabled: form.demoBannerEnabled,
    });
    pushToast('success', 'Configuración guardada', 'Los cambios quedaron auditados.');
    await settingsQuery.reload();
  } catch (err) {
    errorMsg.value = toUserMessage(err);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-3">
    <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3">
      <h1 class="text-base font-bold text-[#dbe3f4] uppercase tracking-tight">Configuración general</h1>
      <p class="text-xs text-[#bcc9cd] mt-1">Parámetros de la plataforma. Toda modificación queda auditada.</p>
    </div>

    <StateMessage :state="settingsQuery.state.value" @retry="settingsQuery.reload()">
      <template #default="{ data }">
        <form class="bg-[#141c28] border border-[#3d494c]/40 rounded-xl p-4 space-y-3" @submit.prevent="save">
          <div v-if="data">
            <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="cfg-app">Nombre de la aplicación</label>
            <input id="cfg-app" v-model="form.appName" type="text" required :disabled="!canManage" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-3 py-2 text-sm text-[#dbe3f4] disabled:opacity-50" />
          </div>
          <div v-if="data">
            <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="cfg-region">Etiqueta de región operativa</label>
            <input id="cfg-region" v-model="form.regionLabel" type="text" required :disabled="!canManage" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-3 py-2 text-sm text-[#dbe3f4] disabled:opacity-50" />
          </div>
          <div v-if="data">
            <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="cfg-territory">Territorio por defecto</label>
            <input id="cfg-territory" v-model="form.defaultTerritory" type="text" required :disabled="!canManage" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-3 py-2 text-sm text-[#dbe3f4] disabled:opacity-50" />
          </div>
          <label v-if="data" class="flex items-center gap-2 text-xs text-[#bcc9cd]">
            <input v-model="form.demoBannerEnabled" type="checkbox" :disabled="!canManage" class="accent-[#4cd7f6]" />
            Mostrar aviso de modo demo cuando esté activo
          </label>

          <div class="font-mono text-[10px] text-[#869397] border-t border-[#3d494c]/20 pt-2">
            Última actualización: {{ data ? formatDateTime(data.updatedAt) : '—' }}
          </div>

          <p v-if="errorMsg" class="text-xs text-[#ffb3ad]">{{ errorMsg }}</p>

          <div v-if="canManage" class="flex justify-end">
            <button type="submit" :disabled="busy" class="bg-[#06b6d4] hover:bg-[#4cd7f6] disabled:opacity-50 text-[#00424f] font-bold px-4 py-2 rounded text-xs">
              {{ busy ? 'Guardando…' : 'Guardar configuración' }}
            </button>
          </div>
          <p v-else class="text-[11px] text-[#869397] font-mono">Tu perfil puede consultar la configuración pero no modificarla (requiere settings:manage).</p>
        </form>
      </template>
      <template #empty>
        <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-6 text-center">
          <p class="text-sm text-[#bcc9cd]">No existe configuración inicial (documento settings/general).</p>
          <button
            v-if="canManage"
            type="button"
            class="mt-3 bg-[#06b6d4] hover:bg-[#4cd7f6] text-[#00424f] font-semibold px-4 py-1.5 rounded text-xs"
            @click="save"
          >
            Crear configuración inicial
          </button>
        </div>
      </template>
    </StateMessage>
  </div>
</template>
