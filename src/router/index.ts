/**
 * ROUTER — árboles de rutas por rol (/ciudadano, /agente, /admin) con guards.
 * Los guards replican la matriz de permisos para UX; en producción la frontera
 * real sigue siendo firestore.rules.
 */
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { authState, can, initAuth, isRole } from '@/services/auth.service';
import { homeRouteFor } from '@/services/auth.service';
import { pushToast } from '@/composables/useToast';
import { appConfig } from '@/config/appConfig';

export interface RouteMeta {
  title?: string;
  requiresAuth?: boolean;
  roles?: Array<'ciudadano' | 'agente' | 'admin'>;
  permission?: import('@/types/domain').Permission;
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: () => homeRouteFor(authState.user),
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: 'Iniciar sesión' },
  },

  // ─── CIUDADANO ───────────────────────────────────────────────────────────
  {
    path: '/ciudadano',
    component: () => import('@/views/citizen/CitizenLayout.vue'),
    children: [
      { path: '', name: 'citizen-home', component: () => import('@/views/citizen/CitizenHomeView.vue'), meta: { title: 'Inicio — Yvy' } },
      { path: 'mapa', name: 'citizen-map', component: () => import('@/views/citizen/CitizenMapView.vue'), meta: { title: 'Mapa público — Yvy' } },
      { path: 'alertas', name: 'citizen-alerts', component: () => import('@/views/citizen/CitizenAlertsView.vue'), meta: { title: 'Alertas — Yvy' } },
      { path: 'alertas/:id', name: 'citizen-alert-detail', component: () => import('@/views/citizen/CitizenAlertDetailView.vue'), meta: { title: 'Detalle de alerta — Yvy' } },
      { path: 'ambiente', name: 'citizen-environment', component: () => import('@/views/citizen/CitizenEnvironmentView.vue'), meta: { title: 'Información ambiental — Yvy' } },
      { path: 'reportar', name: 'citizen-report', component: () => import('@/views/citizen/CitizenReportFormView.vue'), meta: { title: 'Reportar incidente — Yvy', requiresAuth: true } },
      { path: 'mis-reportes', name: 'citizen-my-reports', component: () => import('@/views/citizen/CitizenMyReportsView.vue'), meta: { title: 'Mis reportes — Yvy', requiresAuth: true } },
      { path: 'mis-reportes/:id', name: 'citizen-report-detail', component: () => import('@/views/citizen/CitizenReportDetailView.vue'), meta: { title: 'Reporte — Yvy', requiresAuth: true } },
      { path: 'perfil', name: 'citizen-profile', component: () => import('@/views/citizen/CitizenProfileView.vue'), meta: { title: 'Mi perfil — Yvy', requiresAuth: true } },
    ],
  },

  // ─── AGENTE ──────────────────────────────────────────────────────────────
  {
    path: '/agente',
    component: () => import('@/views/agent/AgentLayout.vue'),
    meta: { requiresAuth: true, roles: ['agente'] },
    children: [
      { path: '', name: 'agent-dashboard', component: () => import('@/views/agent/AgentDashboardView.vue'), meta: { title: 'Dashboard operativo — Yvy' } },
      { path: 'mapa', name: 'agent-map', component: () => import('@/views/agent/AgentMapView.vue'), meta: { title: 'Mapa técnico — Yvy' } },
      { path: 'incidentes', name: 'agent-incidents', component: () => import('@/views/agent/AgentIncidentsView.vue'), meta: { title: 'Incidentes — Yvy', permission: 'incidents:read' } },
      { path: 'incidentes/nuevo', name: 'agent-incident-new', component: () => import('@/views/agent/AgentIncidentNewView.vue'), meta: { title: 'Nuevo incidente — Yvy', permission: 'incidents:create' } },
      { path: 'incidentes/:id', name: 'agent-incident-detail', component: () => import('@/views/agent/AgentIncidentDetailView.vue'), meta: { title: 'Detalle de incidente — Yvy', permission: 'incidents:read' } },
      { path: 'reportes', name: 'agent-reports', component: () => import('@/views/agent/AgentReportsVerificationView.vue'), meta: { title: 'Verificación de reportes — Yvy', permission: 'reports:read' } },
      { path: 'alertas', name: 'agent-alerts', component: () => import('@/views/agent/AgentAlertsView.vue'), meta: { title: 'Alertas — Yvy' } },
      { path: 'hidrologia', name: 'agent-hydrology', component: () => import('@/views/agent/AgentHydrologyView.vue'), meta: { title: 'Hidrología — Yvy', permission: 'hydrology:read' } },
      { path: 'sensores', name: 'agent-sensors', component: () => import('@/views/agent/AgentSensorsView.vue'), meta: { title: 'Sensores — Yvy', permission: 'sensors:read' } },
      { path: 'fuentes', name: 'agent-sources', component: () => import('@/views/agent/AgentSourcesView.vue'), meta: { title: 'Fuentes de información — Yvy' } },
      { path: 'escenarios', name: 'agent-scenarios', component: () => import('@/views/agent/AgentScenariosView.vue'), meta: { title: 'Escenarios — Yvy', permission: 'scenarios:run' } },
      { path: 'historial', name: 'agent-history', component: () => import('@/views/agent/AgentHistoryView.vue'), meta: { title: 'Historial — Yvy', permission: 'history:read' } },
      { path: 'informes', name: 'agent-informes', component: () => import('@/views/agent/AgentInformesView.vue'), meta: { title: 'Informes — Yvy', permission: 'informes:generate' } },
      { path: 'perfil', name: 'agent-profile', component: () => import('@/views/agent/AgentProfileView.vue'), meta: { title: 'Perfil — Yvy' } },
    ],
  },

  // ─── ADMIN ───────────────────────────────────────────────────────────────
  {
    path: '/admin',
    component: () => import('@/views/admin/AdminLayout.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
    children: [
      { path: '', name: 'admin-dashboard', component: () => import('@/views/admin/AdminDashboardView.vue'), meta: { title: 'Administración — Yvy' } },
      { path: 'usuarios', name: 'admin-users', component: () => import('@/views/admin/AdminUsersView.vue'), meta: { title: 'Usuarios — Yvy', permission: 'users:read' } },
      { path: 'organismos', name: 'admin-organizations', component: () => import('@/views/admin/AdminOrganizationsView.vue'), meta: { title: 'Organismos — Yvy', permission: 'orgs:manage' } },
      { path: 'fuentes', name: 'admin-sources', component: () => import('@/views/admin/AdminSourcesView.vue'), meta: { title: 'Fuentes — Yvy', permission: 'sources:manage' } },
      { path: 'sensores', name: 'admin-sensors', component: () => import('@/views/admin/AdminSensorsView.vue'), meta: { title: 'Sensores — Yvy', permission: 'sensors:manage' } },
      { path: 'auditoria', name: 'admin-audit', component: () => import('@/views/admin/AdminAuditView.vue'), meta: { title: 'Auditoría — Yvy', permission: 'audit:read' } },
      { path: 'integraciones', name: 'admin-integrations', component: () => import('@/views/admin/AdminIntegrationsView.vue'), meta: { title: 'Integraciones — Yvy', permission: 'integrations:read' } },
      { path: 'configuracion', name: 'admin-settings', component: () => import('@/views/admin/AdminSettingsView.vue'), meta: { title: 'Configuración — Yvy', permission: 'settings:read' } },
    ],
  },

  { path: '/:pathMatch(.*)*', redirect: '/' },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  await initAuth();
  const meta = (to.meta as RouteMeta) ?? {};
  const user = authState.user;

  // Auth requerida
  if (meta.requiresAuth && !user) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }

  // Restricción por rol (se hereda de rutas padre)
  const matchedRoles = to.matched.map((m) => (m.meta as RouteMeta).roles).filter(Boolean).flat();
  if (user && matchedRoles.length > 0 && !matchedRoles.includes(user.role)) {
    pushToast('warning', 'Acceso restringido', 'Tu rol no tiene acceso a esa sección.');
    return { path: homeRouteFor(user) };
  }

  // Restricción por permiso
  if (meta.permission && !can(meta.permission)) {
    pushToast('warning', 'Permiso insuficiente', 'No tenés el permiso necesario para esa sección.');
    return { path: homeRouteFor(user) };
  }

  // Ya autenticado no vuelve al login
  if (to.path === '/login' && user) {
    return { path: homeRouteFor(user) };
  }

  document.title = meta.title ?? 'Yvy Resiliente';
  return true;
});

/** Marca de modo demo para referencia en layouts (badge global). */
export const dataMode = appConfig.dataMode;

// Helper para guards de plantilla en vistas
export function routeRoles(to: unknown): Array<string> {
  const route = to as { meta?: RouteMeta };
  return route?.meta?.roles ?? [];
}

export function isAgent(): boolean {
  return isRole('agente');
}
