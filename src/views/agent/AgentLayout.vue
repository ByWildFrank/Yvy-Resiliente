<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { authState, can, logout } from '@/services/auth.service';
import { LABELS } from '@/config/labels';
import { pushToast } from '@/composables/useToast';
import DemoBadge from '@/components/ui/DemoBadge.vue';
import type { Permission } from '@/types/domain';

const route = useRoute();
const router = useRouter();
const sidebarOpen = ref(false);

interface NavEntry {
  to: string;
  label: string;
  icon: string;
  permission?: Permission;
}

const sections: Array<{ title: string; items: NavEntry[] }> = [
  {
    title: 'Operación',
    items: [
      { to: '/agente', label: 'Dashboard', icon: 'dashboard', exact: true },
      { to: '/agente/mapa', label: 'Mapa técnico', icon: 'map' },
      { to: '/agente/incidentes', label: 'Incidentes', icon: 'local_fire_department', permission: 'incidents:read' },
      { to: '/agente/reportes', label: 'Verificación de reportes', icon: 'fact_check', permission: 'reports:read' },
      { to: '/agente/alertas', label: 'Alertas', icon: 'notifications' },
    ],
  },
  {
    title: 'Monitoreo',
    items: [
      { to: '/agente/hidrologia', label: 'Hidrología', icon: 'waves', permission: 'hydrology:read' },
      { to: '/agente/sensores', label: 'Sensores', icon: 'sensors', permission: 'sensors:read' },
      { to: '/agente/fuentes', label: 'Fuentes de información', icon: 'database' },
    ],
  },
  {
    title: 'Análisis',
    items: [
      { to: '/agente/escenarios', label: 'Escenarios', icon: 'model_training', permission: 'scenarios:run' },
      { to: '/agente/historial', label: 'Historial', icon: 'history', permission: 'history:read' },
      { to: '/agente/informes', label: 'Informes', icon: 'description', permission: 'informes:generate' },
      { to: '/agente/perfil', label: 'Perfil y organización', icon: 'person' },
    ],
  },
];

const visibleSections = computed(() =>
  sections
    .map((s) => ({ ...s, items: s.items.filter((i) => !i.permission || can(i.permission)) }))
    .filter((s) => s.items.length > 0),
);

const user = computed(() => authState.user);
const roleLabel = computed(() => (user.value ? LABELS.role[user.value.role] : ''));

const isActive = (item: { to: string; exact?: boolean }): boolean =>
  item.exact ? route.path === item.to : route.path.startsWith(item.to);

async function handleLogout(): Promise<void> {
  await logout();
  pushToast('info', 'Sesión cerrada', 'Sesión finalizada correctamente.');
  await router.push('/ciudadano');
}
</script>

<template>
  <div class="min-h-screen flex">
    <!-- Sidebar agente -->
    <aside
      :class="[
        'fixed lg:sticky top-0 left-0 h-screen w-64 bg-[#070e1a] z-50 flex flex-col border-r border-[#3d494c]/40 transition-transform duration-200 shrink-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      ]"
    >
      <div class="h-14 px-3 flex items-center justify-between bg-[#141c28] shrink-0 border-b border-[#3d494c]/30">
        <router-link to="/agente" class="flex items-center gap-2 min-w-0">
          <div class="w-2.5 h-2.5 rounded-full bg-[#4cd7f6] animate-pulse shrink-0"></div>
          <span class="font-mono text-[11px] font-semibold text-[#4cd7f6] uppercase tracking-wider truncate">
            YVY · CONSOLA AGENTE
          </span>
        </router-link>
        <button type="button" class="lg:hidden text-[#869397] p-1" @click="sidebarOpen = false" aria-label="Cerrar menú">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <nav class="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        <div v-for="section in visibleSections" :key="section.title" class="space-y-1">
          <div class="px-2 font-mono text-[10px] text-[#869397] uppercase tracking-widest font-semibold">
            {{ section.title }}
          </div>
          <router-link
            v-for="item in section.items"
            :key="item.to"
            :to="item.to"
            :class="[
              'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded transition-all text-left text-xs font-medium',
              isActive(item)
                ? 'bg-[#06b6d4] text-[#00424f] font-semibold'
                : 'text-[#bcc9cd] hover:bg-[#18202c] hover:text-[#dbe3f4]',
            ]"
            @click="sidebarOpen = false"
          >
            <span class="material-symbols-outlined text-[18px] shrink-0">{{ item.icon }}</span>
            <span class="truncate">{{ item.label }}</span>
          </router-link>
        </div>
      </nav>

      <div class="p-2 bg-[#141c28] shrink-0 border-t border-[#3d494c]/30">
        <div v-if="user" class="flex items-center justify-between gap-2 px-1">
          <div class="min-w-0">
            <div class="text-xs text-[#dbe3f4] font-medium truncate">{{ user.displayName }}</div>
            <div class="font-mono text-[10px] text-[#869397] truncate">
              {{ roleLabel }}<template v-if="user.specialties.length"> · {{ LABELS.specialty[user.specialties[0]] }}</template>
            </div>
          </div>
          <button type="button" class="text-[#869397] hover:text-[#ffb4ab] p-1" title="Cerrar sesión" @click="handleLogout">
            <span class="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </div>
    </aside>

    <div v-if="sidebarOpen" class="fixed inset-0 bg-black/50 z-40 lg:hidden" @click="sidebarOpen = false"></div>

    <!-- Contenido -->
    <div class="flex-1 min-w-0 flex flex-col">
      <header class="sticky top-0 z-30 h-14 bg-[#070e1a]/95 backdrop-blur-md border-b border-[#3d494c]/40 flex items-center justify-between px-3 gap-3">
        <button type="button" class="lg:hidden text-[#bcc9cd] p-1.5" @click="sidebarOpen = true" aria-label="Abrir menú">
          <span class="material-symbols-outlined">menu</span>
        </button>
        <div class="font-mono text-[11px] text-[#869397] uppercase tracking-widest truncate hidden sm:block">
          Centro de operaciones · Corrientes y Chaco
        </div>
        <div class="flex items-center gap-2">
          <DemoBadge compact />
          <span
            v-if="user && user.specialties.length"
            class="hidden md:inline-flex font-mono text-[10px] text-[#4cd7f6] border border-[#06b6d4]/40 bg-[#06b6d4]/10 rounded px-2 py-0.5 uppercase tracking-wide"
          >
            {{ user.specialties.map((s) => LABELS.specialty[s]).join(' · ') }}
          </span>
        </div>
      </header>

      <main class="flex-1 p-3 w-full max-w-[1600px] mx-auto">
        <router-view />
      </main>
    </div>
  </div>
</template>
