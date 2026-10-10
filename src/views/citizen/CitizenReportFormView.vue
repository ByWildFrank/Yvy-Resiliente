<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { createReport, validatePhoto } from '@/services/reports.service';
import { pushToast } from '@/composables/useToast';
import { toUserMessage } from '@/types/states';
import { LABELS } from '@/config/labels';
import { REPORT_TYPES, type ReportType } from '@/types/domain';
import DemoBadge from '@/components/ui/DemoBadge.vue';
import TerritorialMap from '@/components/map/TerritorialMap.vue';

const router = useRouter();

const form = reactive({
  type: 'incendio' as ReportType,
  description: '',
  lat: '-27.46920',
  lng: '-58.83440',
  label: '',
});
const photo = ref<File | null>(null);
const photoError = ref('');
const busy = ref(false);
const errorMsg = ref('');
const created = ref<{ code: string; id: string } | null>(null);

function onMapPick(loc: { lat: number; lng: number; label?: string }): void {
  form.lat = loc.lat.toFixed(5);
  form.lng = loc.lng.toFixed(5);
  if (loc.label && !form.label) {
    form.label = loc.label;
  }
}

function onPhotoChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0] ?? null;
  photoError.value = '';
  if (!file) { photo.value = null; return; }
  const invalid = validatePhoto(file);
  if (invalid) {
    photo.value = null;
    photoError.value = invalid;
    input.value = '';
    return;
  }
  photo.value = file;
}

function useMyLocation(): void {
  if (!('geolocation' in navigator)) {
    photoError.value = '';
    errorMsg.value = 'Tu navegador no permite geolocalización.';
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      form.lat = pos.coords.latitude.toFixed(5);
      form.lng = pos.coords.longitude.toFixed(5);
      pushToast('info', 'Ubicación GPS detectada', 'El punto se fijó con precisión de tu dispositivo.');
    },
    () => { errorMsg.value = 'No se pudo obtener tu ubicación. Marcá el punto en el mapa.'; },
    { enableHighAccuracy: true, timeout: 8000 },
  );
}

async function submit(): Promise<void> {
  errorMsg.value = '';
  const lat = Number(form.lat.replace(',', '.'));
  const lng = Number(form.lng.replace(',', '.'));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    errorMsg.value = 'Indicá la ubicación exacta del incidente en el mapa.';
    return;
  }
  if (form.description.trim().length < 10) {
    errorMsg.value = 'Contanos qué está pasando (al menos 10 caracteres).';
    return;
  }
  busy.value = true;
  try {
    const report = await createReport({
      type: form.type,
      description: form.description,
      location: { lat, lng, label: form.label.trim() || undefined },
    }, photo.value);
    created.value = { code: report.code, id: report.id };
    pushToast('success', 'Reporte registrado', `Guardado en base de datos con código ${report.code}.`);
  } catch (err) {
    errorMsg.value = toUserMessage(err);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-4">
    <!-- Confirmación con identificador real -->
    <div v-if="created" class="bg-[#141c28] border border-[#06b6d4]/50 rounded-xl p-6 text-center space-y-3 shadow-2xl">
      <span class="material-symbols-outlined text-4xl text-[#4cd7f6]">mark_email_read</span>
      <h1 class="text-lg font-bold text-[#dbe3f4]">Punto de notificación registrado</h1>
      <p class="text-sm text-[#bcc9cd]">Tu reporte se guardó exitosamente en la base de datos con el identificador:</p>
      <div class="font-mono text-2xl font-bold text-[#4cd7f6] tracking-widest">{{ created.code }}</div>
      <p class="text-xs text-[#869397] max-w-md mx-auto">
        El punto quedó fijado geográficamente en el mapa operativo. Un agente autorizado lo verificará.
        Podés hacer seguimiento continuo desde "Mis reportes".
      </p>
      <div class="flex items-center justify-center gap-2 pt-1">
        <router-link :to="`/ciudadano/mis-reportes/${created.id}`" class="bg-[#06b6d4] hover:bg-[#4cd7f6] text-[#00424f] px-4 py-2 rounded text-sm font-semibold transition-colors">
          Ver mi reporte
        </router-link>
        <router-link to="/ciudadano/mapa" class="bg-[#232a37] hover:bg-[#323947] text-[#dbe3f4] px-4 py-2 rounded text-sm border border-[#3d494c]/40 transition-colors">
          Ver en el mapa
        </router-link>
      </div>
    </div>

    <template v-else>
      <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-4">
        <div class="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 class="text-base font-bold text-[#dbe3f4] uppercase tracking-tight">Notificar un incidente territorial</h1>
            <p class="text-xs text-[#bcc9cd] mt-1 max-w-xl">
              Seleccioná el tipo y marcá en el mapa interactivo el punto exacto donde ocurre la amenaza o anomalía.
              Tu reporte se guarda con coordenadas de alta precisión georreferenciadas.
            </p>
          </div>
          <DemoBadge compact />
        </div>
      </div>

      <form class="bg-[#141c28] border border-[#3d494c]/40 rounded-xl p-4 space-y-4" @submit.prevent="submit">
        <!-- Tipo -->
        <fieldset>
          <legend class="text-xs font-bold text-[#dbe3f4] uppercase font-mono tracking-wide mb-2">1 · ¿Qué estás observando?</legend>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              v-for="t in REPORT_TYPES"
              :key="t"
              type="button"
              :class="[
                'p-2.5 rounded-lg border text-xs font-semibold transition-all text-left',
                form.type === t
                  ? 'bg-[#06b6d4]/20 border-[#06b6d4] text-[#4cd7f6]'
                  : 'bg-[#18202c] border-[#3d494c]/30 text-[#bcc9cd] hover:border-[#3d494c]',
              ]"
              @click="form.type = t"
            >
              <span class="block">{{ LABELS.reportType[t] }}</span>
            </button>
          </div>
        </fieldset>

        <!-- Ubicación Cartográfica Precisa -->
        <fieldset>
          <div class="flex items-center justify-between mb-2">
            <legend class="text-xs font-bold text-[#dbe3f4] uppercase font-mono tracking-wide">
              2 · Punto de notificación en el mapa (Fijo y Preciso)
            </legend>
            <button
              type="button"
              class="flex items-center gap-1 bg-[#232a37] hover:bg-[#323947] text-[#4cd7f6] px-2.5 py-1 rounded text-xs font-mono border border-[#4cd7f6]/30 transition-colors"
              @click="useMyLocation"
            >
              <span class="material-symbols-outlined text-[15px]">my_location</span> Usar mi GPS
            </button>
          </div>

          <!-- Mapa Selector Interactivo -->
          <div class="mb-3">
            <TerritorialMap
              picker-mode
              height-class="h-[300px]"
              :initial-center="[Number(form.lat) || -27.4692, Number(form.lng) || -58.8344]"
              :initial-zoom="11"
              @update:location="onMapPick"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="lat">Latitud fija</label>
              <input
                id="lat" v-model="form.lat" type="text" inputmode="decimal" required
                class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-3 py-2 text-sm text-[#dbe3f4] font-mono focus:outline-none focus:ring-1 focus:ring-[#4cd7f6]"
              />
            </div>
            <div>
              <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="lng">Longitud fija</label>
              <input
                id="lng" v-model="form.lng" type="text" inputmode="decimal" required
                class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-3 py-2 text-sm text-[#dbe3f4] font-mono focus:outline-none focus:ring-1 focus:ring-[#4cd7f6]"
              />
            </div>
          </div>
          <div class="mt-2">
            <label class="block text-[11px] font-mono text-[#869397] uppercase mb-1" for="label">Referencia del lugar (calle, paraje, ruta y kilómetro)</label>
            <input
              id="label" v-model="form.label" type="text" placeholder="Ej. Costanera Norte y Don Bosco, Corrientes"
              class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-3 py-2 text-sm text-[#dbe3f4] focus:outline-none focus:ring-1 focus:ring-[#4cd7f6]"
            />
          </div>
        </fieldset>

        <!-- Descripción -->
        <fieldset>
          <legend class="text-xs font-bold text-[#dbe3f4] uppercase font-mono tracking-wide mb-2">3 · Describí la situación</legend>
          <textarea
            v-model="form.description" rows="4" required
            placeholder="Qué se ve, magnitud observada, hacia dónde avanza, si hay personas o infraestructura afectada…"
            class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-3 py-2 text-sm text-[#dbe3f4] placeholder:text-[#869397] focus:outline-none focus:ring-1 focus:ring-[#4cd7f6] resize-y"
          ></textarea>
        </fieldset>

        <!-- Foto -->
        <fieldset>
          <legend class="text-xs font-bold text-[#dbe3f4] uppercase font-mono tracking-wide mb-2">4 · Fotografía testimonial (opcional)</legend>
          <input
            type="file" accept="image/jpeg,image/png,image/webp"
            class="block w-full text-xs text-[#bcc9cd] file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-[#232a37] file:text-[#4cd7f6] file:text-xs file:font-mono hover:file:bg-[#323947]"
            @change="onPhotoChange"
          />
          <p class="text-[10px] text-[#869397] mt-1">Imágenes JPG, PNG o WebP de hasta 5 MB.</p>
          <p v-if="photoError" class="text-xs text-[#ffb3ad] mt-1">{{ photoError }}</p>
        </fieldset>

        <p v-if="errorMsg" class="text-xs text-[#ffb3ad] bg-[#a40217]/20 border border-[#a40217]/40 rounded px-3 py-2">
          {{ errorMsg }}
        </p>

        <div class="flex items-center justify-between gap-3 flex-wrap pt-2">
          <p class="text-[11px] text-[#869397] font-mono max-w-xs">
            Al enviar aceptás que este reporte será verificado por un organismo autorizado de emergencias.
          </p>
          <button
            type="submit"
            :disabled="busy"
            class="bg-[#06b6d4] hover:bg-[#4cd7f6] disabled:opacity-50 text-[#00424f] font-bold px-6 py-2.5 rounded text-sm transition-colors shadow-lg"
          >
            {{ busy ? 'Guardando en base de datos…' : 'Enviar punto de notificación' }}
          </button>
        </div>
      </form>
    </template>
  </div>
</template>
