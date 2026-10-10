/**
 * CONTRATOS DE REPOSITORIO — interfaz backend-agnóstica.
 * Dos implementaciones: demo (localStorage) y firebase (Firestore).
 * Los servicios de aplicación consumen exclusivamente estos contratos.
 */
import type {
  Alert, AlertCreateInput, AppSettings, AuditEntry, CitizenReport, HydroStation,
  Incident, IncidentCreateInput, IncidentHistoryEntry, InfoSource, Organization,
  ReportCreateInput, ReportTimelineEntry, ScenarioRun, UserAccount,
} from '@/types/domain';
import type { DataMode } from '@/types/states';

export interface IncidentFilter {
  status?: string;
  type?: string;
  publicOnly?: boolean;
  limit?: number;
}
export interface ReportFilter {
  status?: string;
  createdBy?: string;
  limit?: number;
}
export interface AlertFilter {
  scope?: 'publico' | 'operativo';
  status?: string;
  type?: string;
  limit?: number;
}

export interface Backend {
  readonly mode: DataMode;

  // ── Autenticación ──
  auth: {
    /** Restaura la sesión persistida (si existe). Resuelve null si no hay sesión. */
    restoreSession(): Promise<UserAccount | null>;
    signIn(email: string, password: string): Promise<UserAccount>;
    signOut(): Promise<void>;
    /** Registro de ciudadanos. Los roles institucionales los crea un admin. */
    registerCitizen(input: { email: string; password: string; displayName: string }): Promise<UserAccount>;
    changePassword?(uid: string, currentPassword: string, newPassword: string): Promise<void>;
  };

  // ── Usuarios (admin) ──
  users: {
    list(): Promise<UserAccount[]>;
    get(uid: string): Promise<UserAccount | null>;
    create(input: Omit<UserAccount, 'uid' | 'createdAt' | 'updatedAt'>): Promise<UserAccount>;
    update(uid: string, patch: Partial<UserAccount>): Promise<void>;
  };

  // ── Organismos ──
  organizations: {
    list(): Promise<Organization[]>;
    get(id: string): Promise<Organization | null>;
    create(input: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Promise<Organization>;
    update(id: string, patch: Partial<Organization>): Promise<void>;
  };

  // ── Incidentes ──
  incidents: {
    list(filter?: IncidentFilter): Promise<Incident[]>;
    get(id: string): Promise<Incident | null>;
    create(input: IncidentCreateInput, actor: UserAccount): Promise<Incident>;
    updateFields(id: string, patch: Partial<Incident>): Promise<void>;
    addHistory(id: string, entry: IncidentHistoryEntry): Promise<void>;
  };

  // ── Reportes ciudadanos ──
  reports: {
    list(filter?: ReportFilter): Promise<CitizenReport[]>;
    get(id: string): Promise<CitizenReport | null>;
    create(input: ReportCreateInput, actor: UserAccount): Promise<CitizenReport>;
    addTimeline(id: string, entry: ReportTimelineEntry, patch: Partial<CitizenReport>): Promise<void>;
    /** Solo para el propio autor, mientras esté en `recibido`. */
    cancelByAuthor(id: string, actor: UserAccount): Promise<void>;
  };

  // ── Alertas ──
  alerts: {
    list(filter?: AlertFilter): Promise<Alert[]>;
    get(id: string): Promise<Alert | null>;
    create(input: AlertCreateInput, actor: UserAccount): Promise<Alert>;
    update(id: string, patch: Partial<Alert>): Promise<void>;
  };

  // ── Sensores ──
  sensors: {
    list(): Promise<import('@/types/domain').Sensor[]>;
    get(id: string): Promise<import('@/types/domain').Sensor | null>;
    create(input: Omit<import('@/types/domain').Sensor, 'id' | 'createdAt' | 'updatedAt'>): Promise<import('@/types/domain').Sensor>;
    update(id: string, patch: Partial<import('@/types/domain').Sensor>): Promise<void>;
  };

  // ── Estaciones hidrométricas ──
  stations: {
    list(): Promise<HydroStation[]>;
    get(id: string): Promise<HydroStation | null>;
    /** Actualización manual (la vía `adaptador` queda para integraciones). */
    update(id: string, patch: Partial<HydroStation>): Promise<void>;
  };

  // ── Fuentes de información ──
  sources: {
    list(): Promise<InfoSource[]>;
    get(id: string): Promise<InfoSource | null>;
    create(input: Omit<InfoSource, 'id' | 'createdAt' | 'updatedAt'>): Promise<InfoSource>;
    update(id: string, patch: Partial<InfoSource>): Promise<void>;
  };

  // ── Auditoría ──
  audit: {
    list(filter?: { visibility?: 'operativo' | 'admin'; limit?: number }): Promise<AuditEntry[]>;
    create(entry: Omit<AuditEntry, 'id'>): Promise<AuditEntry>;
  };

  // ── Escenarios ──
  scenarios: {
    list(limit?: number): Promise<ScenarioRun[]>;
    create(run: Omit<ScenarioRun, 'id'>): Promise<ScenarioRun>;
  };

  // ── Configuración ──
  settings: {
    get(): Promise<AppSettings | null>;
    update(patch: Partial<AppSettings>): Promise<void>;
  };

  // ── Adjuntos ──
  photos: {
    /** Devuelve una URL persistible para el reporte (dataURL en demo; Storage en firebase). */
    uploadReportPhoto(uid: string, file: File): Promise<string>;
  };
}
