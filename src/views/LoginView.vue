<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { authState, homeRouteFor, login, registerCitizen } from '@/services/auth.service';
import { pushToast } from '@/composables/useToast';
import { toUserMessage } from '@/types/states';
import { appConfig } from '@/config/appConfig';
import DemoBadge from '@/components/ui/DemoBadge.vue';

const route = useRoute();
const router = useRouter();

type Mode = 'login' | 'register';
const mode = ref<Mode>('login');
const busy = ref(false);
const errorMsg = ref('');

const form = reactive({
  email: '',
  password: '',
  displayName: '',
});

/** Cuentas demo documentadas (solo visibles en modo demo). */
const demoAccounts = [
  { email: 'ciudadano@demo.yvy', label: 'Ciudadana', desc: 'Alertas, mapa público, reportes' },
  { email: 'bomberos@demo.yvy', label: 'Agente · Bomberos', desc: 'Incidentes, verificación de reportes' },
  { email: 'hidrica@demo.yvy', label: 'Agente · Gestión hídrica', desc: 'Estaciones, sensores, lecturas' },
  { email: 'coordinador@demo.yvy', label: 'Agente · Defensa Civil', desc: 'Todo lo anterior + publicar alertas' },
  { email: 'analista@demo.yvy', label: 'Agente · Analista', desc: 'Historial, escenarios, informes' },
  { email: 'admin@demo.yvy', label: 'Administradora técnica', desc: 'Usuarios, fuentes, configuración' },
];
const demoPassword = 'demo1234';

async function submit(): Promise<void> {
  busy.value = true;
  errorMsg.value = '';
  try {
    if (mode.value === 'login') {
      const user = await login(form.email, form.password);
      pushToast('success', 'Sesión iniciada', `Bienvenida/o, ${user.displayName}.`);
    } else {
      const user = await registerCitizen({ ...form });
      pushToast('success', 'Cuenta creada', `Bienvenida/o, ${user.displayName}.`);
    }
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null;
    await router.push(redirect || homeRouteFor(authState.user));
  } catch (err) {
    errorMsg.value = toUserMessage(err);
  } finally {
    busy.value = false;
  }
}

async function quickLogin(email: string): Promise<void> {
  form.email = email;
  form.password = demoPassword;
  await submit();
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Panel de acceso -->
      <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-xl p-6 shadow-2xl space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded bg-gradient-to-br from-[#06b6d4] to-[#00424f] flex items-center justify-center">
            <svg viewBox="0 0 24 24" class="w-6 h-6 text-white" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <h1 class="text-lg font-bold text-[#dbe3f4] tracking-tight">Yvy Resiliente</h1>
            <p class="text-[11px] text-[#869397] font-mono uppercase tracking-wider">Inteligencia territorial</p>
          </div>
        </div>

        <DemoBadge />

        <!-- Selector de modo -->
        <div class="flex bg-[#070e1a] rounded p-1 border border-[#3d494c]/30">
          <button
            type="button"
            :class="['flex-1 py-1.5 rounded text-xs font-semibold transition-colors', mode === 'login' ? 'bg-[#06b6d4] text-[#00424f]' : 'text-[#869397] hover:text-[#dbe3f4]']"
            @click="mode = 'login'"
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            :class="['flex-1 py-1.5 rounded text-xs font-semibold transition-colors', mode === 'register' ? 'bg-[#06b6d4] text-[#00424f]' : 'text-[#869397] hover:text-[#dbe3f4]']"
            @click="mode = 'register'"
          >
            Crear cuenta ciudadana
          </button>
        </div>

        <form class="space-y-3" @submit.prevent="submit">
          <div v-if="mode === 'register'">
            <label class="block text-[11px] font-mono text-[#869397] uppercase tracking-wider mb-1" for="displayName">Nombre</label>
            <input
              id="displayName"
              v-model="form.displayName"
              type="text"
              required
              autocomplete="name"
              class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-3 py-2 text-sm text-[#dbe3f4] placeholder:text-[#869397] focus:outline-none focus:ring-1 focus:ring-[#4cd7f6]"
              placeholder="Tu nombre"
            />
          </div>

          <div>
            <label class="block text-[11px] font-mono text-[#869397] uppercase tracking-wider mb-1" for="email">Correo</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              autocomplete="email"
              class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-3 py-2 text-sm text-[#dbe3f4] placeholder:text-[#869397] focus:outline-none focus:ring-1 focus:ring-[#4cd7f6]"
              placeholder="tu@correo.com"
            />
          </div>

          <div>
            <label class="block text-[11px] font-mono text-[#869397] uppercase tracking-wider mb-1" for="password">Contraseña</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              minlength="8"
              autocomplete="current-password"
              class="w-full bg-[#18202c] border border-[#3d494c]/40 rounded px-3 py-2 text-sm text-[#dbe3f4] placeholder:text-[#869397] focus:outline-none focus:ring-1 focus:ring-[#4cd7f6]"
              placeholder="••••••••"
            />
            <p v-if="mode === 'register'" class="text-[10px] text-[#869397] mt-1">Mínimo 8 caracteres. Las cuentas ciudadanas reportan y siguen sus propios reportes.</p>
          </div>

          <p v-if="errorMsg" class="text-xs text-[#ffb3ad] bg-[#a40217]/20 border border-[#a40217]/40 rounded px-3 py-2">
            {{ errorMsg }}
          </p>

          <button
            type="submit"
            :disabled="busy"
            class="w-full bg-[#06b6d4] hover:bg-[#4cd7f6] disabled:opacity-50 text-[#00424f] font-semibold py-2 rounded text-sm transition-colors"
          >
            {{ busy ? 'Procesando…' : mode === 'login' ? 'Ingresar' : 'Crear cuenta' }}
          </button>
        </form>

        <router-link to="/ciudadano" class="block text-center text-xs text-[#4cd7f6] hover:underline">
          Continuar como visitante (información pública)
        </router-link>
      </div>

      <!-- Cuentas registradas en la base de datos -->
      <div class="bg-[#0d1522] border border-[#3d494c]/30 rounded-xl p-5 space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-sm font-bold text-[#dbe3f4] uppercase tracking-tight">Perfiles territoriales</h2>
            <p class="text-[11px] text-[#869397] mt-1 leading-relaxed">
              Cuentas y roles registrados en la base de datos Firestore. Podés ingresar directamente con cualquiera de ellas.
            </p>
          </div>
          <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-[#00424f] text-[#acedff] border border-[#06b6d4]/40">
            Firestore DB
          </span>
        </div>
        <div class="space-y-2">
          <button
            v-for="acc in demoAccounts"
            :key="acc.email"
            type="button"
            class="w-full flex items-center justify-between gap-2 bg-[#141c28] hover:bg-[#232a37] border border-[#3d494c]/30 rounded-lg px-3 py-2 text-left transition-colors"
            @click="quickLogin(acc.email)"
          >
            <span class="min-w-0">
              <span class="block text-xs font-semibold text-[#dbe3f4]">{{ acc.label }}</span>
              <span class="block text-[10px] text-[#869397] font-mono truncate">{{ acc.email }} · {{ acc.desc }}</span>
            </span>
            <span class="material-symbols-outlined text-[16px] text-[#4cd7f6] shrink-0">login</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
