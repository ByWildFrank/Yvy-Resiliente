<script setup lang="ts">
import { useAsyncData } from '@/composables/useAsyncData';
import { listSources } from '@/services/monitoring.service';
import { appConfig, isFirebaseConfigured } from '@/config/appConfig';
import { formatTimeAgo } from '@/config/labels';
import StateMessage from '@/components/ui/StateMessage.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import type { InfoSource } from '@/types/domain';

const sourcesQuery = useAsyncData<InfoSource[]>(() => listSources(), { isEmpty: () => false });

const backendIntegrations = [
  {
    name: 'Firebase Authentication',
    desc: 'Autenticación de usuarios (correo/contraseña) y sesión persistida.',
    status: isFirebaseConfigured ? 'conectada' : 'pendiente',
    requires: 'VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID',
  },
  {
    name: 'Cloud Firestore',
    desc: 'Almacén de datos operativos con reglas de seguridad (firestore.rules).',
    status: isFirebaseConfigured ? 'conectada' : 'pendiente',
    requires: 'Variables VITE_FIREBASE_* + VITE_DATA_MODE=firebase',
  },
  {
    name: 'Cloud Storage (adjuntos)',
    desc: 'Fotos de reportes con validación de tipo/tamaño (storage.rules).',
    status: isFirebaseConfigured ? 'conectada' : 'pendiente',
    requires: 'VITE_FIREBASE_STORAGE_BUCKET',
  },
];
</script>

<template>
  <div class="space-y-3">
    <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3">
      <h1 class="text-base font-bold text-[#dbe3f4] uppercase tracking-tight">Estado de integraciones</h1>
      <p class="text-xs text-[#bcc9cd] mt-1 max-w-3xl">
        Estado REAL de las integraciones de la plataforma según el entorno. Ninguna integración se
        muestra como conectada sin estarlo. Modo de datos activo:
        <span class="font-mono text-[#ffb77d]">{{ appConfig.dataMode }}</span>.
      </p>
    </div>

    <!-- Backend -->
    <section class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <article
        v-for="intg in backendIntegrations"
        :key="intg.name"
        :class="[
          'bg-[#141c28] border rounded-lg p-3 space-y-1.5',
          intg.status === 'conectada' ? 'border-[#06b6d4]/40' : 'border-[#f48c24]/40',
        ]"
      >
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-sm font-semibold text-[#dbe3f4]">{{ intg.name }}</h2>
          <StatusBadge :label="intg.status === 'conectada' ? 'Conectada' : 'Pendiente'" :tone="intg.status === 'conectada' ? 'success' : 'warning'" />
        </div>
        <p class="text-[11px] text-[#bcc9cd] leading-relaxed">{{ intg.desc }}</p>
        <p v-if="intg.status !== 'conectada'" class="font-mono text-[10px] text-[#ffb77d]">Requiere: {{ intg.requires }}</p>
      </article>
    </section>

    <!-- Registro de fuentes externas -->
    <section>
      <h2 class="text-sm font-bold text-[#dbe3f4] uppercase tracking-tight mb-2">Fuentes externas registradas</h2>
      <StateMessage :state="sourcesQuery.state.value" @retry="sourcesQuery.reload()">
        <template #default="{ data }">
          <div class="overflow-x-auto bg-[#141c28] border border-[#3d494c]/40 rounded-lg">
            <table class="w-full text-left text-xs">
              <thead class="bg-[#070e1a] text-[#869397] font-mono text-[10px] uppercase">
                <tr>
                  <th class="p-2.5">Fuente</th>
                  <th class="p-2.5">Proveedor</th>
                  <th class="p-2.5">Estado</th>
                  <th class="p-2.5">Última sync</th>
                  <th class="p-2.5">Variables de entorno requeridas</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#3d494c]/20">
                <tr v-for="src in data" :key="src.id">
                  <td class="p-2.5 text-[#dbe3f4] font-medium">{{ src.name }}</td>
                  <td class="p-2.5 text-[#bcc9cd]">{{ src.provider }}</td>
                  <td class="p-2.5">
                    <StatusBadge
                      :label="src.status === 'conectada' ? 'Conectada' : src.status === 'pendiente' ? 'Pendiente' : src.status"
                      :tone="src.status === 'conectada' ? 'success' : src.status === 'pendiente' ? 'warning' : 'neutral'"
                    />
                  </td>
                  <td class="p-2.5 font-mono text-[10px] text-[#869397]">{{ src.lastSyncAt ? formatTimeAgo(src.lastSyncAt) : '—' }}</td>
                  <td class="p-2.5 font-mono text-[10px] text-[#ffb77d]">{{ src.requiresEnv.join(', ') || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </StateMessage>
    </section>

    <!-- Qué falta para producción -->
    <section class="bg-[#0d1522] border border-[#f48c24]/40 rounded-lg p-4 space-y-2">
      <h2 class="text-xs font-bold text-[#ffb77d] uppercase font-mono tracking-wide">Pendientes para producción</h2>
      <ol class="list-decimal list-inside text-[11px] text-[#bcc9cd] space-y-1">
        <li>Crear el proyecto Firebase y configurar las variables <code class="text-[#ffb77d]">VITE_FIREBASE_*</code> con <code class="text-[#ffb77d]">VITE_DATA_MODE=firebase</code>.</li>
        <li>Publicar las reglas: <code class="text-[#ffb77d]">firebase deploy --only firestore:rules,storage</code>.</li>
        <li>Gestionar credenciales de los proveedores externos (FIRMS, SMN, red hidrométrica) y desarrollar sus adaptadores.</li>
        <li>Sembrar catálogos (settings, especialidades) y usuarios institucionales.</li>
        <li>Configurar App Check para endurecer el acceso desde clientes no autorizados.</li>
      </ol>
      <p class="text-[11px] text-[#869397] font-mono">Ver docs/INTEGRATIONS.md para el detalle del contrato de adaptadores.</p>
    </section>
  </div>
</template>
