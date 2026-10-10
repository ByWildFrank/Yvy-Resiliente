<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { createIncident } from '@/services/incidents.service';
import { pushToast } from '@/composables/useToast';
import { toUserMessage } from '@/types/states';
import { LABELS } from '@/config/labels';
import { INCIDENT_TYPES, type IncidentType, type Priority } from '@/types/domain';
import TerritorialMap from '@/components/map/TerritorialMap.vue';

const router = useRouter();

const form = reactive({
  type: 'incendio' as IncidentType,
  priority: 'media' as Priority,
  sourceType: 'operador' as 'satelital' | 'reporte_ciudadano' | 'sensor' | 'operador',
  description: '',
  lat: '-27.46920',
  lng: '-58.83440',
  label: '',
  areaHa: '',
  levelM: '',
});

const busy = ref(false);
const errorMsg = ref('');

function onMapPick(loc: { lat: number; lng: number; label?: string }): void {
  form.lat = loc.lat.toFixed(5);
  form.lng = loc.lng.toFixed(5);
  if (loc.label && !form.label) {
    form.label = loc.label;
  }
}

async function submit(): Promise<void> {
  errorMsg.value = '';
  const lat = Number(form.lat.replace(',', '.'));
  const lng = Number(form.lng.replace(',', '.'));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    errorMsg.value = 'Ingresá una ubicación válida en el mapa (lat/lng).';
    return;
  }
  if (form.description.trim().length < 10) {
    errorMsg.value = 'La descripción debe tener al menos 10 caracteres.';
    return;
  }
  busy.value = true;
  try {
    const incident = await createIncident({
      type: form.type,
      priority: form.priority,
      description: form.description,
      location: { lat, lng, label: form.label.trim() || undefined },
      sourceType: form.sourceType,
      areaHa: form.areaHa ? Number(form.areaHa) : null,
      levelM: form.levelM ? Number(form.levelM) : null,
    });
    pushToast('success', 'Incidente registrado', `${incident.code} quedó guardado en la base de datos.`);
    await router.push(`/agente/incidentes/${incident.id}`);
  } catch (err) {
    errorMsg.value = toUserMessage(err);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-3">
    <router-link to="/agente/incidentes" class="inline-flex items-center gap-1 text-xs text-[#4cd7f6] hover:underline">
      <span class="material-symbols-outlined text-[14px]">arrow_back</span> Volver a incidentes
    </router-link>

    <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3">
      <h1 class="text-base font-bold text-[#dbe3f4] uppercase tracking-tight">Registrar incidente territorial</h1>
      <p class="text-xs text-[#bcc9cd] mt-1">
        Fijá el punto geográfico en el mapa cartográfico interactivo y completá los datos operativos.
        El incidente se almacena en Firestore con trazabilidad de origen y coordenadas precisas.
      </p>
    </div>

    <form class="bg-[#141c28] border border-[#3d494c]/40 rounded-xl p-4 space-y-4 shadow-xl" @submit.prevent="submit">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="type">Tipo</label>
          <select id="type" v-model="form.type" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-3 py-2 text-sm text-[#dbe3f4]">
            <option v-for="(lbl, key) in LABELS.incidentType" :key="key" :value="key">{{ lbl }}</option>
          </select>
        </div>
        <div>
          <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="priority">Prioridad</label>
          <select id="priority" v-model="form.priority" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-3 py-2 text-sm text-[#dbe3f4]">
            <option v-for="(lbl, key) in LABELS.priority" :key="key" :value="key">{{ lbl }}</option>
          </select>
        </div>
        <div>
          <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="sourceType">Origen</label>
          <select id="sourceType" v-model="form.sourceType" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-3 py-2 text-sm text-[#dbe3f4]">
            <option value="operador">Operador</option>
            <option value="satelital">Satelital (NASA FIRMS)</option>
            <option value="reporte_ciudadano">Reporte ciudadano</option>
            <option value="sensor">Sensor telemétrico</option>
          </select>
        </div>
      </div>

      <!-- Selector de Ubicación en el Mapa Real -->
      <div>
        <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1">
          Punto geográfico preciso (Hacé clic en el mapa para posicionar)
        </label>
        <div class="mb-2">
          <TerritorialMap
            picker-mode
            height-class="h-[260px]"
            :initial-center="[Number(form.lat) || -27.4692, Number(form.lng) || -58.8344]"
            :initial-zoom="11"
            @update:location="onMapPick"
          />
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="lat">Latitud</label>
            <input id="lat" v-model="form.lat" type="text" inputmode="decimal" required class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-3 py-2 text-sm text-[#dbe3f4] font-mono" />
          </div>
          <div>
            <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="lng">Longitud</label>
            <input id="lng" v-model="form.lng" type="text" inputmode="decimal" required class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-3 py-2 text-sm text-[#dbe3f4] font-mono" />
          </div>
        </div>
      </div>

      <div>
        <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="label">Referencia de ubicación</label>
        <input id="label" v-model="form.label" type="text" placeholder="Paraje, ruta y km, barrio, localidad…" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-3 py-2 text-sm text-[#dbe3f4]" />
      </div>

      <div>
        <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="description">Descripción operativa</label>
        <textarea id="description" v-model="form.description" rows="4" required class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-3 py-2 text-sm text-[#dbe3f4] resize-y" placeholder="Situación observada, avance, elementos expuestos, medios requeridos…"></textarea>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="areaHa">Superficie estimada (ha, opcional)</label>
          <input id="areaHa" v-model="form.areaHa" type="number" min="0" step="0.1" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-3 py-2 text-sm text-[#dbe3f4]" />
        </div>
        <div>
          <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="levelM">Nivel de agua (m, opcional)</label>
          <input id="levelM" v-model="form.levelM" type="number" min="0" step="0.01" class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-3 py-2 text-sm text-[#dbe3f4]" />
        </div>
      </div>

      <p v-if="errorMsg" class="text-xs text-[#ffb3ad] bg-[#a40217]/20 border border-[#a40217]/40 rounded px-3 py-2">{{ errorMsg }}</p>

      <div class="flex justify-end pt-2">
        <button type="submit" :disabled="busy" class="bg-[#06b6d4] hover:bg-[#4cd7f6] disabled:opacity-50 text-[#00424f] font-bold px-6 py-2.5 rounded text-sm shadow-lg transition-colors">
          {{ busy ? 'Guardando en base de datos…' : 'Registrar incidente' }}
        </button>
      </div>
    </form>
  </div>
</template>
