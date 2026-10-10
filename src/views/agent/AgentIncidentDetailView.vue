<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useAsyncData } from '@/composables/useAsyncData';
import { getIncident, setIncidentPublicViewable, transitionIncident } from '@/services/incidents.service';
import { can } from '@/services/auth.service';
import { pushToast } from '@/composables/useToast';
import { toUserMessage } from '@/types/states';
import { LABELS, formatDateTime, formatTimeAgo } from '@/config/labels';
import { INCIDENT_TRANSITIONS, type Incident, type IncidentStatus } from '@/types/domain';
import StateMessage from '@/components/ui/StateMessage.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import TerritorialMap from '@/components/map/TerritorialMap.vue';

const route = useRoute();
const incidentQuery = useAsyncData<Incident | null>(() => getIncident(String(route.params.id)), { isEmpty: (d) => d === null });

const busy = ref(false);
const transitionNote = ref('');
const errorMsg = ref('');

const incident = computed(() => (incidentQuery.state.value.status === 'ok' ? incidentQuery.state.value.data : null));
const nextStates = computed<IncidentStatus[]>(() => (incident.value ? INCIDENT_TRANSITIONS[incident.value.status] : []));

const canVerify = can('incidents:verify');

const transitionForm = reactive<{ to: IncidentStatus | '' }>({ to: '' });

async function applyTransition(): Promise<void> {
  if (!incident.value || !transitionForm.to) return;
  busy.value = true;
  errorMsg.value = '';
  try {
    await transitionIncident(incident.value.id, transitionForm.to, transitionNote.value || undefined);
    pushToast('success', 'Estado actualizado', `El incidente pasó a "${LABELS.incidentStatus[transitionForm.to]}". Quedó registrado en el historial.`);
    transitionForm.to = '';
    transitionNote.value = '';
    await incidentQuery.reload();
  } catch (err) {
    errorMsg.value = toUserMessage(err);
    pushToast('error', 'Transición rechazada', toUserMessage(err));
  } finally {
    busy.value = false;
  }
}

async function togglePublic(): Promise<void> {
  if (!incident.value) return;
  busy.value = true;
  errorMsg.value = '';
  try {
    await setIncidentPublicViewable(incident.value.id, !incident.value.publicViewable);
    pushToast('success', incident.value.publicViewable ? 'Difusión retirada' : 'Difusión habilitada', 'La decisión quedó auditada.');
    await incidentQuery.reload();
  } catch (err) {
    errorMsg.value = toUserMessage(err);
    pushToast('error', 'No se pudo cambiar la difusión', toUserMessage(err));
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="space-y-3 max-w-6xl">
    <router-link to="/agente/incidentes" class="inline-flex items-center gap-1 text-xs text-[#4cd7f6] hover:underline">
      <span class="material-symbols-outlined text-[14px]">arrow_back</span> Volver a incidentes
    </router-link>

    <StateMessage :state="incidentQuery.state.value" @retry="incidentQuery.reload()">
      <template #default="{ data }">
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-3">
          <!-- Ficha -->
          <div class="xl:col-span-2 space-y-3">
            <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-xl p-4 space-y-3">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-base font-bold text-[#4cd7f6]">{{ data.code }}</span>
                  <StatusBadge :label="LABELS.incidentStatus[data.status]" tone="info" />
                </div>
                <div class="flex items-center gap-2">
                  <StatusBadge :label="LABELS.incidentType[data.type]" :tone="data.type === 'incendio' || data.type === 'humo' ? 'critical' : 'info'" />
                  <StatusBadge :label="LABELS.priority[data.priority]" :tone="data.priority === 'critica' ? 'critical' : data.priority === 'alta' ? 'warning' : 'neutral'" />
                </div>
              </div>

              <p class="text-sm text-[#bcc9cd] leading-relaxed">{{ data.description }}</p>

              <dl class="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs font-mono">
                <div class="bg-[#18202c] rounded p-2 border border-[#3d494c]/30">
                  <dt class="text-[#869397] text-[10px] uppercase">Ubicación</dt>
                  <dd class="text-[#dbe3f4] mt-0.5 truncate">{{ data.location.label ?? '—' }}</dd>
                </div>
                <div class="bg-[#18202c] rounded p-2 border border-[#3d494c]/30">
                  <dt class="text-[#869397] text-[10px] uppercase">Coordenadas</dt>
                  <dd class="text-[#dbe3f4] mt-0.5">{{ data.location.lat.toFixed(4) }}, {{ data.location.lng.toFixed(4) }}</dd>
                </div>
                <div class="bg-[#18202c] rounded p-2 border border-[#3d494c]/30">
                  <dt class="text-[#869397] text-[10px] uppercase">Origen</dt>
                  <dd class="text-[#dbe3f4] mt-0.5">{{ data.sourceType }}{{ data.sourceRef ? ` · ${data.sourceRef}` : '' }}</dd>
                </div>
                <div class="bg-[#18202c] rounded p-2 border border-[#3d494c]/30">
                  <dt class="text-[#869397] text-[10px] uppercase">Superficie / nivel</dt>
                  <dd class="text-[#dbe3f4] mt-0.5">{{ data.areaHa ? `${data.areaHa} ha` : data.levelM ? `${data.levelM} m` : '—' }}</dd>
                </div>
                <div class="bg-[#18202c] rounded p-2 border border-[#3d494c]/30">
                  <dt class="text-[#869397] text-[10px] uppercase">Creado</dt>
                  <dd class="text-[#dbe3f4] mt-0.5">{{ formatDateTime(data.createdAt) }}</dd>
                </div>
                <div class="bg-[#18202c] rounded p-2 border border-[#3d494c]/30">
                  <dt class="text-[#869397] text-[10px] uppercase">Actualizado</dt>
                  <dd class="text-[#dbe3f4] mt-0.5">{{ formatTimeAgo(data.updatedAt) }}</dd>
                </div>
              </dl>
            </div>

            <!-- Historial (trazabilidad real) -->
            <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-xl p-4">
              <h2 class="text-xs font-bold text-[#dbe3f4] uppercase font-mono tracking-wide mb-3">Historial del incidente</h2>
              <ol class="space-y-2.5">
                <li v-for="(entry, idx) in [...data.history].reverse()" :key="idx" class="flex gap-2.5">
                  <span class="w-2 h-2 rounded-full bg-[#4cd7f6] mt-1.5 shrink-0"></span>
                  <div class="min-w-0">
                    <div class="text-xs text-[#dbe3f4]">
                      <template v-if="entry.from">{{ LABELS.incidentStatus[entry.from] }} → </template>{{ LABELS.incidentStatus[entry.to] }}
                    </div>
                    <div class="font-mono text-[10px] text-[#869397]">{{ formatDateTime(entry.at) }} · {{ entry.actorName }}</div>
                    <p v-if="entry.note" class="text-[11px] text-[#bcc9cd] mt-0.5">{{ entry.note }}</p>
                  </div>
                </li>
              </ol>
            </div>
          </div>

          <!-- Panel de operaciones -->
          <div class="space-y-3">
            <div v-if="canVerify" class="bg-[#141c28] border border-[#3d494c]/40 rounded-xl p-4 space-y-3">
              <h2 class="text-xs font-bold text-[#dbe3f4] uppercase font-mono tracking-wide">Transición de estado</h2>

              <div v-if="nextStates.length === 0" class="text-xs text-[#869397]">
                El incidente está en un estado final. No admite más transiciones.
              </div>

              <template v-else>
                <div class="grid grid-cols-2 gap-1.5">
                  <button
                    v-for="st in nextStates"
                    :key="st"
                    type="button"
                    :class="[
                      'p-2 rounded text-[11px] font-mono font-semibold border transition-colors',
                      transitionForm.to === st ? 'bg-[#06b6d4] text-[#00424f] border-[#06b6d4]' : 'bg-[#18202c] text-[#bcc9cd] border-[#3d494c]/30 hover:border-[#4cd7f6]/40',
                    ]"
                    @click="transitionForm.to = st"
                  >
                    {{ LABELS.incidentStatus[st] }}
                  </button>
                </div>

                <textarea
                  v-model="transitionNote"
                  rows="2"
                  placeholder="Nota de la transición (opcional)"
                  class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-2.5 py-2 text-xs text-[#dbe3f4] resize-y"
                ></textarea>

                <p v-if="errorMsg" class="text-xs text-[#ffb3ad]">{{ errorMsg }}</p>

                <button
                  type="button"
                  :disabled="busy || !transitionForm.to"
                  class="w-full bg-[#06b6d4] hover:bg-[#4cd7f6] disabled:opacity-40 text-[#00424f] font-bold py-2 rounded text-xs"
                  @click="applyTransition"
                >
                  {{ busy ? 'Aplicando…' : 'Aplicar transición' }}
                </button>
              </template>
            </div>

            <div v-if="canVerify" class="bg-[#141c28] border border-[#3d494c]/40 rounded-xl p-4 space-y-2">
              <h2 class="text-xs font-bold text-[#dbe3f4] uppercase font-mono tracking-wide">Difusión pública</h2>
              <p class="text-[11px] text-[#869397] leading-relaxed">
                Los incidentes difundidos aparecen en el mapa y las pantallas ciudadanas.
                Solo se difunden estados verificados.
              </p>
              <StatusBadge
                :label="data.publicViewable ? 'Difundido' : 'No difundido'"
                :tone="data.publicViewable ? 'success' : 'neutral'"
              />
              <button
                type="button"
                :disabled="busy"
                class="w-full bg-[#232a37] hover:bg-[#323947] text-[#dbe3f4] py-2 rounded text-xs font-mono border border-[#3d494c]/40 disabled:opacity-40"
                @click="togglePublic"
              >
                {{ data.publicViewable ? 'Retirar difusión' : 'Habilitar difusión' }}
              </button>
            </div>

            <TerritorialMap
              :incidents="[data]"
              mode="tecnico"
              height-class="h-[220px]"
              :selected-id="data.id"
            />
          </div>
        </div>
      </template>
      <template #empty>
        <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-8 text-center">
          <span class="material-symbols-outlined text-3xl text-[#ffb4ab]">search_off</span>
          <p class="text-sm text-[#bcc9cd] mt-2">El incidente no existe o no es accesible para tu perfil.</p>
        </div>
      </template>
    </StateMessage>
  </div>
</template>
