<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { authState, logout } from '@/services/auth.service';
import { pushToast } from '@/composables/useToast';
import DemoBadge from '@/components/ui/DemoBadge.vue';

const route = useRoute();
const router = useRouter();

const navItems = [
  { to: '/ciudadano', label: 'Inicio', icon: 'home', exact: true },
  { to: '/ciudadano/mapa', label: 'Mapa', icon: 'map', exact: false },
  { to: '/ciudadano/alertas', label: 'Alertas', icon: 'notifications', exact: false },
  { to: '/ciudadano/ambiente', label: 'Ambiente', icon: 'water_drop', exact: false },
];

const user = computed(() => authState.user);
const isCitizen = computed(() => user.value?.role === 'ciudadano');

const isActive = (item: { to: string; exact: boolean }): boolean =>
  item.exact ? route.path === item.to : route.path.startsWith(item.to);

async function handleLogout(): Promise<void> {
  await logout();
  pushToast('info', 'Sesión cerrada', 'Volvé cuando quieras.');
  await router.push('/ciudadano');
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Barra superior ciudadana -->
    <header class="sticky top-0 z-40 bg-[#070e1a]/95 backdrop-blur-md border-b border-[#3d494c]/40">
      <div class="max-w-6xl mx-auto px-3 h-14 flex items-center justify-between gap-3">
        <router-link to="/ciudadano" class="flex items-center gap-2 shrink-0">
          <div class="w-8 h-8 rounded bg-gradient-to-br from-[#06b6d4] to-[#00424f] flex items-center justify-center">
            <svg viewBox="0 0 24 24" class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span class="hidden sm:block font-bold text-sm text-[#dbe3f4] tracking-tight">Yvy Resiliente</span>
        </router-link>

        <nav class="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <router-link
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            :class="[
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors',
              isActive(item) ? 'bg-[#06b6d4] text-[#00424f] font-semibold' : 'text-[#bcc9cd] hover:bg-[#18202c] hover:text-[#dbe3f4]',
            ]"
          >
            <span class="material-symbols-outlined text-[16px]">{{ item.icon }}</span>
            <span class="hidden md:inline">{{ item.label }}</span>
          </router-link>
        </nav>

        <div class="flex items-center gap-2 shrink-0">
          <DemoBadge compact />
          <router-link
            to="/ciudadano/reportar"
            class="flex items-center gap-1 bg-[#a40217] hover:bg-[#c2182c] text-[#ffdad6] px-3 py-1.5 rounded text-xs font-semibold transition-colors"
          >
            <span class="material-symbols-outlined text-[16px]">emergency</span>
            <span class="hidden sm:inline">Reportar</span>
          </router-link>

          <template v-if="user">
            <router-link
              v-if="isCitizen"
              to="/ciudadano/mis-reportes"
              class="flex items-center gap-1.5 text-xs text-[#bcc9cd] hover:text-[#dbe3f4] px-2 py-1"
              title="Mis reportes"
            >
              <span class="material-symbols-outlined text-[18px]">assignment</span>
              <span class="hidden lg:inline">Mis reportes</span>
            </router-link>
            <router-link
              to="/ciudadano/perfil"
              class="w-8 h-8 rounded bg-[#4cd7f6] flex items-center justify-center text-[#003640] shrink-0"
              :title="user.displayName"
            >
              <span class="material-symbols-outlined text-[18px]">person</span>
            </router-link>
            <button
              type="button"
              class="text-[#869397] hover:text-[#dbe3f4] p-1"
              title="Cerrar sesión"
              @click="handleLogout"
            >
              <span class="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </template>
          <router-link
            v-else
            to="/login"
            class="flex items-center gap-1 bg-[#232a37] hover:bg-[#323947] text-[#dbe3f4] px-3 py-1.5 rounded text-xs font-semibold border border-[#3d494c]/40 transition-colors"
          >
            <span class="material-symbols-outlined text-[16px]">login</span>
            Ingresar
          </router-link>
        </div>
      </div>
    </header>

    <main class="flex-1">
      <div class="max-w-6xl mx-auto px-3 py-4">
        <router-view />
      </div>
    </main>

    <footer class="border-t border-[#3d494c]/30 bg-[#070e1a] mt-6">
      <div class="max-w-6xl mx-auto px-3 py-4 text-[11px] text-[#869397] space-y-1">
        <p>
          Yvy Resiliente — plataforma de apoyo a la gestión de riesgos ambientales.
          Información de referencia: ante emergencias reales, seguí siempre las indicaciones
          de las autoridades oficiales.
        </p>
        <p class="font-mono">
          Los reportes ciudadanos son información sin verificar hasta su confirmación por un organismo autorizado.
        </p>
      </div>
    </footer>
  </div>
</template>
