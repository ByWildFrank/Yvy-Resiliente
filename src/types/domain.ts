/**
 * YVY RESILIENTE — Tipos de dominio y reglas de negocio centrales.
 * Fuente de verdad compartida por servicios, repositorios, reglas Firestore y tests.
 */

// ─── Roles, especialidades y permisos ────────────────────────────────────────

export type Role = 'ciudadano' | 'agente' | 'admin';

export type Specialty =
  | 'meteorologia'
  | 'bomberos'
  | 'hidrica_ambiental'
  | 'gobierno_defensa'
  | 'analista';

export const SPECIALTIES: readonly Specialty[] = [
  'meteorologia',
  'bomberos',
  'hidrica_ambiental',
  'gobierno_defensa',
  'analista',
];

export const PERMISSIONS = [
  'incidents:read',
  'incidents:create',
  'incidents:verify',
  'incidents:manage',
  'reports:read',
  'reports:verify',
  'alerts:read',
  'alerts:publish',
  'sensors:read',
  'sensors:manage',
  'sources:read',
  'sources:manage',
  'hydrology:read',
  'history:read',
  'scenarios:run',
  'informes:generate',
  'users:read',
  'users:manage',
  'orgs:read',
  'orgs:manage',
  'audit:read',
  'settings:read',
  'settings:manage',
  'integrations:read',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export interface UserAccount {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  organizationId: string | null;
  specialties: Specialty[];
  permissions: Permission[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Permisos implícitos de cada rol (además de los explícitos asignables). */
export const ROLE_BASE_PERMISSIONS: Record<Role, Permission[]> = {
  ciudadano: ['alerts:read'],
  agente: ['alerts:read', 'history:read', 'integrations:read'],
  admin: ['integrations:read', 'settings:read', 'audit:read'],
};

export function effectivePermissions(user: Pick<UserAccount, 'role' | 'permissions'>): Set<Permission> {
  return new Set<Permission>([...ROLE_BASE_PERMISSIONS[user.role], ...user.permissions]);
}

// ─── Geografía ──────────────────────────────────────────────────────────────

export interface GeoLocation {
  lat: number;
  lng: number;
  label?: string;
}

/** Coordenadas válidas dentro de la región operativa (Corrientes/Chaco y alrededores). */
export function isValidLocation(loc: GeoLocation): boolean {
  return (
    Number.isFinite(loc.lat) && Number.isFinite(loc.lng) &&
    loc.lat > -56 && loc.lat < 12 && loc.lng > -74 && loc.lng < -53
  );
}

// ─── Incidentes ─────────────────────────────────────────────────────────────

export type IncidentType = 'incendio' | 'inundacion' | 'anegamiento' | 'humo' | 'otro';
export type IncidentStatus =
  | 'deteccion'
  | 'reportado'
  | 'en_verificacion'
  | 'confirmado'
  | 'en_gestion'
  | 'controlado'
  | 'cerrado'
  | 'descartado';
export type Priority = 'baja' | 'media' | 'alta' | 'critica';
export type IncidentSourceType = 'satelital' | 'reporte_ciudadano' | 'sensor' | 'operador';

export const INCIDENT_TYPES: readonly IncidentType[] = ['incendio', 'inundacion', 'anegamiento', 'humo', 'otro'];
export const INCIDENT_STATUSES: readonly IncidentStatus[] = [
  'deteccion', 'reportado', 'en_verificacion', 'confirmado', 'en_gestion', 'controlado', 'cerrado', 'descartado',
];

/** Máquina de estados de incidentes (regla de negocio). */
export const INCIDENT_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  deteccion: ['en_verificacion', 'confirmado', 'descartado'],
  reportado: ['en_verificacion', 'confirmado', 'descartado'],
  en_verificacion: ['confirmado', 'descartado'],
  confirmado: ['en_gestion', 'cerrado', 'descartado'],
  en_gestion: ['controlado', 'cerrado'],
  controlado: ['cerrado'],
  cerrado: [],
  descartado: [],
};

export function canTransitionIncident(from: IncidentStatus, to: IncidentStatus): boolean {
  return INCIDENT_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Estados considerados "activos" para indicadores operativos. */
export const ACTIVE_INCIDENT_STATUSES: readonly IncidentStatus[] = [
  'deteccion', 'reportado', 'en_verificacion', 'confirmado', 'en_gestion', 'controlado',
];

export interface IncidentHistoryEntry {
  at: string;
  actorId: string;
  actorName: string;
  from: IncidentStatus | null;
  to: IncidentStatus;
  note?: string;
}

export interface Incident {
  id: string;
  code: string;
  type: IncidentType;
  status: IncidentStatus;
  priority: Priority;
  description: string;
  location: GeoLocation;
  sourceType: IncidentSourceType;
  sourceRef: string | null;
  areaHa: number | null;
  levelM: number | null;
  organizationId: string | null;
  assignedTo: string | null;
  createdBy: string;
  createdAt: string;
  observedAt: string | null;
  updatedAt: string;
  /** Difundible en el mapa/listado ciudadano. */
  publicViewable: boolean;
  history: IncidentHistoryEntry[];
}

export type IncidentCreateInput = Pick<
  Incident,
  'type' | 'description' | 'location' | 'sourceType' | 'priority'
> & {
  sourceRef?: string | null;
  areaHa?: number | null;
  levelM?: number | null;
  organizationId?: string | null;
  observedAt?: string | null;
  publicViewable?: boolean;
};

// ─── Reportes ciudadanos ────────────────────────────────────────────────────

export type ReportType =
  | 'incendio'
  | 'humo'
  | 'inundacion'
  | 'anegamiento'
  | 'camino_bloqueado'
  | 'otro';
export type ReportStatus = 'recibido' | 'en_verificacion' | 'confirmado' | 'descartado' | 'cerrado';

export const REPORT_TYPES: readonly ReportType[] = [
  'incendio', 'humo', 'inundacion', 'anegamiento', 'camino_bloqueado', 'otro',
];

export const REPORT_STATUSES: readonly ReportStatus[] = [
  'recibido', 'en_verificacion', 'confirmado', 'descartado', 'cerrado',
];

/** Máquina de estados de reportes (regla de negocio). */
export const REPORT_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  recibido: ['en_verificacion', 'descartado'],
  en_verificacion: ['confirmado', 'descartado'],
  confirmado: ['cerrado'],
  descartado: [],
  cerrado: [],
};

export function canTransitionReport(from: ReportStatus, to: ReportStatus): boolean {
  return REPORT_TRANSITIONS[from]?.includes(to) ?? false;
}

export interface ReportTimelineEntry {
  at: string;
  actorId: string;
  actorName: string;
  status: ReportStatus;
  note?: string;
}

export interface CitizenReport {
  id: string;
  code: string;
  type: ReportType;
  description: string;
  location: GeoLocation;
  photoUrl: string | null;
  status: ReportStatus;
  createdBy: string;
  createdByName: string;
  incidentId: string | null;
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string;
  verifiedBy: string | null;
  verifiedAt: string | null;
  timeline: ReportTimelineEntry[];
}

export type ReportCreateInput = {
  type: ReportType;
  description: string;
  location: GeoLocation;
  photoUrl?: string | null;
};

// ─── Alertas ────────────────────────────────────────────────────────────────

export type AlertType = 'incendio' | 'hidrica' | 'meteorologica' | 'general';
export type AlertSeverity = 'info' | 'aviso' | 'alerta' | 'emergencia';
export type AlertScope = 'publico' | 'operativo';
export type AlertStatus = 'borrador' | 'publicada' | 'cancelada' | 'expirada';

export const ALERT_SEVERITIES: readonly AlertSeverity[] = ['info', 'aviso', 'alerta', 'emergencia'];
export const ALERT_TYPES: readonly AlertType[] = ['incendio', 'hidrica', 'meteorologica', 'general'];

export interface Alert {
  id: string;
  code: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  instructions: string | null;
  scope: AlertScope;
  status: AlertStatus;
  territory: string;
  source: string;
  validFrom: string;
  validUntil: string | null;
  publishedBy: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AlertCreateInput = Pick<Alert, 'type' | 'severity' | 'title' | 'message' | 'scope' | 'territory'> & {
  instructions?: string | null;
  validUntil?: string | null;
};

// ─── Sensores y estaciones ──────────────────────────────────────────────────

export type SensorType = 'hidrometrico' | 'pluvio' | 'meteo' | 'humedad_suelo' | 'otro';
export type SensorStatus = 'online' | 'advertencia' | 'silente' | 'mantenimiento';

export interface Sensor {
  id: string;
  code: string;
  name: string;
  type: SensorType;
  variable: string;
  unit: string;
  protocol: string | null;
  status: SensorStatus;
  battery: number | null;
  rssi: number | null;
  lastPayloadAt: string | null;
  location: GeoLocation;
  organizationId: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HydroStation {
  id: string;
  code: string;
  name: string;
  river: string;
  province: string;
  location: GeoLocation;
  currentLevelM: number;
  alertLevelM: number;
  evacLevelM: number;
  trendCmPerHour: number | null;
  sourceType: 'manual' | 'adaptador';
  sourceRef: string | null;
  updatedAt: string;
  active: boolean;
}

export type StationState = 'normal' | 'aviso' | 'alerta' | 'evacuacion';

/**
 * Estado derivado de una estación según sus umbrales.
 * Regla documentada: evacuación ≥ cota evacuación; alerta ≥ cota alerta;
 * aviso cuando el nivel se aproxima a la cota de alerta (margen de 0,50 m).
 */
export function stationState(s: Pick<HydroStation, 'currentLevelM' | 'alertLevelM' | 'evacLevelM'>): StationState {
  if (s.currentLevelM >= s.evacLevelM) return 'evacuacion';
  if (s.currentLevelM >= s.alertLevelM) return 'alerta';
  if (s.currentLevelM >= s.alertLevelM - 0.5) return 'aviso';
  return 'normal';
}

// ─── Fuentes de información ──────────────────────────────────────────────────

export type SourceType = 'satelital' | 'meteorologica' | 'hidrologica' | 'sensorial' | 'oficial';
export type SourceStatus = 'conectada' | 'pendiente' | 'error' | 'desactivada';

export interface InfoSource {
  id: string;
  code: string;
  name: string;
  provider: string;
  type: SourceType;
  status: SourceStatus;
  coverage: string | null;
  variables: string[];
  units: string | null;
  lastSyncAt: string | null;
  notes: string | null;
  requiresEnv: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Organismos ─────────────────────────────────────────────────────────────

export type OrganizationType =
  | 'bomberos'
  | 'defensa_civil'
  | 'municipalidad'
  | 'provincial'
  | 'hidrica'
  | 'ambiental'
  | 'otro';

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  territory: string;
  contact: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Auditoría ──────────────────────────────────────────────────────────────

export const AUDIT_ACTIONS = {
  reportVerified: 'report.verified',
  reportDiscarded: 'report.discarded',
  reportClosed: 'report.closed',
  reportCreated: 'report.created',
  incidentCreated: 'incident.created',
  incidentStatusChanged: 'incident.status_changed',
  alertPublished: 'alert.published',
  alertCanceled: 'alert.canceled',
  userUpdated: 'admin.user_updated',
  userCreated: 'admin.user_created',
  orgChanged: 'admin.org_changed',
  sourceChanged: 'admin.source_changed',
  sensorChanged: 'admin.sensor_changed',
  settingsChanged: 'admin.settings_changed',
  scenarioRun: 'scenario.run',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export interface AuditEntry {
  id: string;
  at: string;
  actorId: string;
  actorName: string;
  action: AuditAction | string;
  targetType: string;
  targetId: string;
  details: string;
  visibility: 'operativo' | 'admin';
}

// ─── Escenarios ────────────────────────────────────────────────────────────

export type ScenarioMode = 'incendio' | 'hidrologico';

export interface FireScenarioInput {
  windSpeedKmh: number;
  windDirection: string;
  relativeHumidityPct: number;
  horizonHours: number;
}

export interface HydroScenarioInput {
  stationCode: string;
  climbRateCmPerHour: number;
  horizonHours: number;
}

export interface ScenarioResults {
  headline: Record<string, string>;
  notes: string[];
}

export interface ScenarioRun {
  id: string;
  mode: ScenarioMode;
  inputs: FireScenarioInput | HydroScenarioInput;
  results: ScenarioResults;
  assumptions: string[];
  limitations: string[];
  engine: string;
  runBy: string;
  runByName: string;
  createdAt: string;
}

// ─── Configuración ──────────────────────────────────────────────────────────

export interface AppSettings {
  appName: string;
  regionLabel: string;
  demoBannerEnabled: boolean;
  defaultTerritory: string;
  updatedAt: string;
}
