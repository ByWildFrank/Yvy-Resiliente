/**
 * ADAPTADOR DEMO — almacén local (localStorage) con fixtures etiquetados.
 *
 * Implementa los mismos contratos que el adaptador Firebase. Es un entorno de
 * desarrollo/demostación: los datos persisten entre recargas, no se mezclan
 * con datos operativos y la UI declara "MODO DEMO" permanentemente.
 */
import type { Backend, AlertFilter, IncidentFilter, ReportFilter } from '@/repositories/contracts';
import {
  demoAlerts, demoAudit, demoIncidents, demoOrganizations, demoReports, demoSensors,
  demoSettings, demoSources, demoStations, demoUsers,
  type DemoStoreShape, type DemoUserAccount,
} from '@/repositories/demo/fixtures';
import type {
  Alert, AlertCreateInput, AppSettings, AuditEntry, CitizenReport, HydroStation,
  Incident, IncidentCreateInput, IncidentHistoryEntry, InfoSource, Organization,
  ReportCreateInput, ReportTimelineEntry, ScenarioRun, Sensor, UserAccount,
} from '@/types/domain';
import { isValidLocation } from '@/types/domain';

const STORAGE_KEY = 'yvy.demo.v1';

type Store = DemoStoreShape;

function seedStore(): Store {
  return {
    version: 1,
    seededAt: new Date().toISOString(),
    users: structuredClone(demoUsers),
    organizations: structuredClone(demoOrganizations),
    incidents: structuredClone(demoIncidents),
    reports: structuredClone(demoReports),
    alerts: structuredClone(demoAlerts),
    sensors: structuredClone(demoSensors),
    stations: structuredClone(demoStations),
    sources: structuredClone(demoSources),
    auditLogs: structuredClone(demoAudit),
    scenarioRuns: [],
    settings: structuredClone(demoSettings),
    session: null,
  };
}

function load(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fresh = seedStore();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }
    const parsed = JSON.parse(raw) as Store;
    if (parsed.version !== 1) {
      const fresh = seedStore();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }
    return parsed;
  } catch {
    const fresh = seedStore();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh)); } catch { /* modo sin storage */ }
    return fresh;
  }
}

function save(store: Store): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.warn('[yvy demo] No se pudo persistir el almacén demo:', err);
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

function genCode(prefix: string, existing: { code: string }[]): string {
  const year = new Date().getFullYear();
  const max = existing
    .map((e) => Number(e.code.split('-').pop()))
    .filter((n) => Number.isFinite(n))
    .reduce((a, b) => Math.max(a, b), 0);
  return `${prefix}-${year}-${String(max + 1).padStart(3, '0')}`;
}

function uid(prefix: string, store: Store): string {
  let n = 1;
  while (true) {
    const candidate = `${prefix}-${String(n).padStart(3, '0')}`;
    const exists = (collection: { id: string }[]) => collection.some((x) => x.id === candidate);
    if (
      !exists(store.incidents) && !exists(store.reports) && !exists(store.alerts) &&
      !exists(store.sensors) && !exists(store.sources) && !exists(store.organizations) &&
      !exists(store.auditLogs) && !exists(store.scenarioRuns)
    ) return candidate;
    n++;
  }
}

function requireUser(store: Store, uidValue: string): UserAccount {
  const u = store.users.find((x) => x.uid === uidValue);
  if (!u) throw new Error('Sesión no válida.');
  const { password: _pw, ...account } = u;
  return account as UserAccount;
}

// ─────────────────────────────────────────────────────────────────────────────

export function createDemoBackend(): Backend {
  let store = load();

  const persist = () => save(store);

  return {
    mode: 'demo',

    auth: {
      async restoreSession(): Promise<UserAccount | null> {
        store = load();
        if (!store.session) return null;
        try {
          return requireUser(store, store.session.uid);
        } catch {
          store.session = null;
          persist();
          return null;
        }
      },
      async signIn(email: string, password: string): Promise<UserAccount> {
        const u = store.users.find(
          (x) => x.email.toLowerCase() === email.trim().toLowerCase() && x.active,
        );
        if (!u || u.password !== password) {
          throw new Error('Credenciales incorrectas.');
        }
        store.session = { uid: u.uid };
        persist();
        const { password: _pw, ...account } = u;
        return account as UserAccount;
      },
      async signOut(): Promise<void> {
        store.session = null;
        persist();
      },
      async registerCitizen(input: { email: string; password: string; displayName: string }): Promise<UserAccount> {
        const exists = store.users.some((x) => x.email.toLowerCase() === input.email.trim().toLowerCase());
        if (exists) throw new Error('Ya existe una cuenta con ese correo.');
        const u: DemoUserAccount = {
          uid: `u-${crypto.randomUUID().slice(0, 8)}`,
          email: input.email.trim(),
          displayName: input.displayName.trim(),
          role: 'ciudadano',
          organizationId: null,
          specialties: [],
          permissions: [],
          active: true,
          createdAt: nowIso(),
          updatedAt: nowIso(),
          password: input.password,
        };
        store.users.push(u);
        store.session = { uid: u.uid };
        persist();
        const { password: _pw, ...account } = u;
        return account as UserAccount;
      },
    },

    users: {
      async list() {
        store = load();
        return store.users.map(({ password: _pw, ...a }) => a as UserAccount);
      },
      async get(id: string) {
        store = load();
        const u = store.users.find((x) => x.uid === id);
        return u ? (({ password: _pw, ...a }) => a as UserAccount)(u) : null;
      },
      async create(input) {
        store = load();
        const u: DemoUserAccount = { ...input, uid: `u-${crypto.randomUUID().slice(0, 8)}`, password: 'demo1234', createdAt: nowIso(), updatedAt: nowIso() };
        store.users.push(u);
        persist();
        const { password: _pw, ...account } = u;
        return account as UserAccount;
      },
      async update(id: string, patch: Partial<UserAccount>) {
        store = load();
        const u = store.users.find((x) => x.uid === id);
        if (!u) throw new Error('Usuario no encontrado.');
        Object.assign(u, patch, { updatedAt: nowIso() });
        persist();
      },
    },

    organizations: {
      async list() { store = load(); return [...store.organizations].sort((a, b) => a.name.localeCompare(b.name)); },
      async get(id: string) { store = load(); return store.organizations.find((o) => o.id === id) ?? null; },
      async create(input) {
        store = load();
        const org: Organization = { ...input, id: uid('org', store), createdAt: nowIso(), updatedAt: nowIso() };
        store.organizations.push(org);
        persist();
        return org;
      },
      async update(id: string, patch: Partial<Organization>) {
        store = load();
        const org = store.organizations.find((o) => o.id === id);
        if (!org) throw new Error('Organismo no encontrado.');
        Object.assign(org, patch, { updatedAt: nowIso() });
        persist();
      },
    },

    incidents: {
      async list(filter?: IncidentFilter) {
        store = load();
        let out = [...store.incidents];
        if (filter?.publicOnly) out = out.filter((i) => i.publicViewable);
        if (filter?.status) out = out.filter((i) => i.status === filter.status);
        if (filter?.type) out = out.filter((i) => i.type === filter.type);
        out.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
        return filter?.limit ? out.slice(0, filter.limit) : out;
      },
      async get(id: string) { store = load(); return store.incidents.find((i) => i.id === id) ?? null; },
      async create(input: IncidentCreateInput, actor: UserAccount): Promise<Incident> {
        store = load();
        if (!isValidLocation(input.location)) throw new Error('Ubicación inválida.');
        const at = nowIso();
        const inc: Incident = {
          id: uid('inc', store),
          code: genCode('INC', store.incidents),
          type: input.type,
          status: input.sourceType === 'satelital' ? 'deteccion' : 'reportado',
          priority: input.priority,
          description: input.description.trim(),
          location: input.location,
          sourceType: input.sourceType,
          sourceRef: input.sourceRef ?? null,
          areaHa: input.areaHa ?? null,
          levelM: input.levelM ?? null,
          organizationId: input.organizationId ?? actor.organizationId ?? null,
          assignedTo: null,
          createdBy: actor.uid,
          createdAt: at,
          observedAt: input.observedAt ?? at,
          updatedAt: at,
          publicViewable: false,
          history: [{ at, actorId: actor.uid, actorName: actor.displayName, from: null, to: input.sourceType === 'satelital' ? 'deteccion' : 'reportado', note: 'Creación del incidente' }],
        };
        store.incidents.push(inc);
        persist();
        return inc;
      },
      async updateFields(id: string, patch: Partial<Incident>) {
        store = load();
        const inc = store.incidents.find((i) => i.id === id);
        if (!inc) throw new Error('Incidente no encontrado.');
        const { history: _h, id: _id, ...rest } = patch;
        Object.assign(inc, rest, { updatedAt: nowIso() });
        persist();
      },
      async addHistory(id: string, entry: IncidentHistoryEntry) {
        store = load();
        const inc = store.incidents.find((i) => i.id === id);
        if (!inc) throw new Error('Incidente no encontrado.');
        inc.history.push(entry);
        inc.status = entry.to;
        inc.updatedAt = entry.at;
        persist();
      },
    },

    reports: {
      async list(filter?: ReportFilter) {
        store = load();
        let out = [...store.reports];
        if (filter?.status) out = out.filter((r) => r.status === filter.status);
        if (filter?.createdBy) out = out.filter((r) => r.createdBy === filter.createdBy);
        out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
        return filter?.limit ? out.slice(0, filter.limit) : out;
      },
      async get(id: string) { store = load(); return store.reports.find((r) => r.id === id) ?? null; },
      async create(input: ReportCreateInput, actor: UserAccount): Promise<CitizenReport> {
        store = load();
        if (!isValidLocation(input.location)) throw new Error('Ubicación inválida.');
        const at = nowIso();
        const rep: CitizenReport = {
          id: uid('rep', store),
          code: genCode('REP', store.reports),
          type: input.type,
          description: input.description.trim(),
          location: input.location,
          photoUrl: input.photoUrl ?? null,
          status: 'recibido',
          createdBy: actor.uid,
          createdByName: actor.displayName,
          incidentId: null,
          resolutionNote: null,
          createdAt: at,
          updatedAt: at,
          verifiedBy: null,
          verifiedAt: null,
          timeline: [{ at, actorId: actor.uid, actorName: actor.displayName, status: 'recibido' }],
        };
        store.reports.push(rep);
        persist();
        return rep;
      },
      async addTimeline(id: string, entry: ReportTimelineEntry, patch: Partial<CitizenReport>) {
        store = load();
        const rep = store.reports.find((r) => r.id === id);
        if (!rep) throw new Error('Reporte no encontrado.');
        rep.timeline.push(entry);
        Object.assign(rep, patch, { updatedAt: entry.at });
        persist();
      },
      async cancelByAuthor(id: string, actor: UserAccount) {
        store = load();
        const rep = store.reports.find((r) => r.id === id);
        if (!rep) throw new Error('Reporte no encontrado.');
        if (rep.createdBy !== actor.uid) throw new Error('Solo podés retirar tus propios reportes.');
        if (rep.status !== 'recibido') throw new Error('El reporte ya está en proceso y no puede retirarse.');
        const at = nowIso();
        rep.timeline.push({ at, actorId: actor.uid, actorName: actor.displayName, status: 'descartado', note: 'Retirado por el autor' });
        rep.status = 'descartado';
        rep.resolutionNote = 'Retirado por el autor.';
        rep.updatedAt = at;
        persist();
      },
    },

    alerts: {
      async list(filter?: AlertFilter) {
        store = load();
        let out = [...store.alerts];
        if (filter?.scope) out = out.filter((a) => a.scope === filter.scope);
        if (filter?.status) out = out.filter((a) => a.status === filter.status);
        if (filter?.type) out = out.filter((a) => a.type === filter.type);
        out.sort((a, b) => (a.validFrom < b.validFrom ? 1 : -1));
        return filter?.limit ? out.slice(0, filter.limit) : out;
      },
      async get(id: string) { store = load(); return store.alerts.find((a) => a.id === id) ?? null; },
      async create(input: AlertCreateInput, actor: UserAccount): Promise<Alert> {
        store = load();
        const at = nowIso();
        const alert: Alert = {
          id: uid('al', store),
          code: genCode('AL', store.alerts),
          type: input.type,
          severity: input.severity,
          title: input.title.trim(),
          message: input.message.trim(),
          instructions: input.instructions ?? null,
          scope: input.scope,
          status: 'borrador',
          territory: input.territory.trim(),
          source: actor.displayName,
          validFrom: at,
          validUntil: input.validUntil ?? null,
          publishedBy: null,
          publishedAt: null,
          createdAt: at,
          updatedAt: at,
        };
        store.alerts.push(alert);
        persist();
        return alert;
      },
      async update(id: string, patch: Partial<Alert>) {
        store = load();
        const alert = store.alerts.find((a) => a.id === id);
        if (!alert) throw new Error('Alerta no encontrada.');
        Object.assign(alert, patch, { updatedAt: nowIso() });
        persist();
      },
    },

    sensors: {
      async list() { store = load(); return [...store.sensors].sort((a, b) => a.name.localeCompare(b.name)); },
      async get(id: string) { store = load(); return store.sensors.find((s) => s.id === id) ?? null; },
      async create(input) {
        store = load();
        const s: Sensor = { ...input, id: uid('sen', store), createdAt: nowIso(), updatedAt: nowIso() };
        store.sensors.push(s);
        persist();
        return s;
      },
      async update(id: string, patch: Partial<Sensor>) {
        store = load();
        const s = store.sensors.find((x) => x.id === id);
        if (!s) throw new Error('Sensor no encontrado.');
        Object.assign(s, patch, { updatedAt: nowIso() });
        persist();
      },
    },

    stations: {
      async list() { store = load(); return [...store.stations].sort((a, b) => a.name.localeCompare(b.name)); },
      async get(id: string) { store = load(); return store.stations.find((s) => s.id === id) ?? null; },
      async update(id: string, patch: Partial<HydroStation>) {
        store = load();
        const s = store.stations.find((x) => x.id === id);
        if (!s) throw new Error('Estación no encontrada.');
        Object.assign(s, patch, { updatedAt: nowIso() });
        persist();
      },
    },

    sources: {
      async list() { store = load(); return [...store.sources].sort((a, b) => a.name.localeCompare(b.name)); },
      async get(id: string) { store = load(); return store.sources.find((s) => s.id === id) ?? null; },
      async create(input) {
        store = load();
        const src: InfoSource = { ...input, id: uid('src', store), createdAt: nowIso(), updatedAt: nowIso() };
        store.sources.push(src);
        persist();
        return src;
      },
      async update(id: string, patch: Partial<InfoSource>) {
        store = load();
        const src = store.sources.find((x) => x.id === id);
        if (!src) throw new Error('Fuente no encontrada.');
        Object.assign(src, patch, { updatedAt: nowIso() });
        persist();
      },
    },

    audit: {
      async list(filter?: { visibility?: 'operativo' | 'admin'; limit?: number }) {
        store = load();
        let out = [...store.auditLogs];
        if (filter?.visibility) out = out.filter((a) => a.visibility === filter.visibility);
        out.sort((a, b) => (a.at < b.at ? 1 : -1));
        return filter?.limit ? out.slice(0, filter.limit) : out;
      },
      async create(entry: Omit<AuditEntry, 'id'>): Promise<AuditEntry> {
        store = load();
        const full: AuditEntry = { ...entry, id: uid('aud', store) };
        store.auditLogs.push(full);
        persist();
        return full;
      },
    },

    scenarios: {
      async list(limit?: number) {
        store = load();
        const out = [...store.scenarioRuns].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
        return limit ? out.slice(0, limit) : out;
      },
      async create(run: Omit<ScenarioRun, 'id'>): Promise<ScenarioRun> {
        store = load();
        const full: ScenarioRun = { ...run, id: uid('scn', store) };
        store.scenarioRuns.push(full);
        persist();
        return full;
      },
    },

    settings: {
      async get() { store = load(); return store.settings; },
      async update(patch: Partial<AppSettings>) {
        store = load();
        Object.assign(store.settings, patch, { updatedAt: nowIso() });
        persist();
      },
    },

    photos: {
      async uploadReportPhoto(_uidValue: string, file: File): Promise<string> {
        // Demo: dataURL local. El tamaño/tipo ya fue validado por el servicio.
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
          reader.readAsDataURL(file);
        });
      },
    },
  };
}
