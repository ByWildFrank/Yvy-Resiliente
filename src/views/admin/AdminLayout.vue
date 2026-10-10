<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { authState, logout } from '@/services/auth.service';
import { pushToast } from '@/composables/useToast';
import DemoBadge from '@/components/ui/DemoBadge.vue';

const route = useRoute();
const router = useRouter();
const sidebarOpen = ref(false);

const sections = [
  {
    title: 'Gestión',
    items: [
      { to: '/admin', label: 'Dashboard', icon: 'dashboard', exact: true },
      { to: '/admin/usuarios', label: 'Usuarios', icon: 'group' },
      { to: '/admin/organismos', label: 'Organismos', icon: 'account_balance' },
    ],
  },
  {
    title: 'Plataforma',
    items: [
      { to: '/admin/fuentes', label: 'Fuentes de información', icon: 'database' },
      { to: '/admin/sensores', label: 'Sensores', icon: 'sensors' },
      { to: '/admin/integraciones', label: 'Integraciones', icon: 'cable' },
      { to: '/admin/configuracion', label: 'Configuración', icon: 'settings' },
    ],
  },
  {
    title: 'Trazabilidad',
    items: [
      { to: '/admin/auditoria', label: 'Auditoría', icon: 'history_edu' },
    ],
  },
];

const user = computed(() => authState.user);

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
    <aside
      :class="[
        'fixed lg:sticky top-0 left-0 h-screen w-64 bg-[#070e1a] z-50 flex flex-col border-r border-[#3d494c]/40 transition-transform duration-200 shrink-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      ]"
    >
      <div class="h-14 px-3 flex items-center justify-between bg-[#141c28] shrink-0 border-b border-[#3d494c]/30">
        <router-link to="/admin" class="flex items-center gap-2 min-w-0">
          <div class="w-2.5 h-2.5 rounded-full bg-[#ffb77d] shrink-0"></div>
          <span class="font-mono text-[11px] font-semibold text-[#ffb77d] uppercase tracking-wider truncate">
            YVY · ADMINISTRACIÓN
          </span>
        </router-link>
        <button type="button" class="lg:hidden text-[#869397] p-1" @click="sidebarOpen = false" aria-label="Cerrar menú">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <nav class="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        <div v-for="section in sections" :key="section.title" class="space-y-1">
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
                ? 'bg-[#ffb77d] text-[#3d2400] font-semibold'
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
            <div class="font-mono text-[10px] text-[#869397]">Administrador técnico</div>
          </div>
          <button type="button" class="text-[#869397] hover:text-[#ffb4ab] p-1" title="Cerrar sesión" @click="handleLogout">
            <span class="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </div>
    </aside>

    <div v-if="sidebarOpen" class="fixed inset-0 bg-black/50 z-40 lg:hidden" @click="sidebarOpen = false"></div>

    <div class="flex-1 min-w-0 flex flex-col">
      <header class="sticky top-0 z-30 h-14 bg-[#070e1a]/95 backdrop-blur-md border-b border-[#3d494c]/40 flex items-center justify-between px-3 gap-3">
        <button type="button" class="lg:hidden text-[#bcc9cd] p-1.5" @click="sidebarOpen = true" aria-label="Abrir menú">
          <span class="material-symbols-outlined">menu</span>
        </button>
        <div class="font-mono text-[11px] text-[#869397] uppercase tracking-widest truncate hidden sm:block">
          Administración de la plataforma
        </div>
        <div class="flex items-center gap-2">
          <DemoBadge compact />
        </div>
      </header>

      <main class="flex-1 p-3 w-full max-w-6xl mx-auto">
        <router-view />
      </main>
    </div>
  </div>
</template>
