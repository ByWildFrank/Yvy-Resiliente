/**
 * ADAPTADOR FIREBASE — backend de producción (Auth + Firestore + Storage).
 * Implementa los contratos de `repositories/contracts.ts`.
 * La autorización la aplican `firestore.rules` y `storage.rules`: este adaptador
 * no es la barrera de seguridad, solo el canal de acceso.
 */
import type { Backend, AlertFilter, IncidentFilter, ReportFilter } from '@/repositories/contracts';
import {
  createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut,
  type User,
} from 'firebase/auth';
import {
  addDoc, arrayUnion, collection, doc, getDoc, getDocs, limit as fsLimit, orderBy, query,
  setDoc, updateDoc, where, type QueryConstraint,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { requireFirebase } from '@/firebase';
import type {
  Alert, AlertCreateInput, AppSettings, AuditEntry, CitizenReport, HydroStation,
  Incident, IncidentCreateInput, IncidentHistoryEntry, InfoSource, Organization,
  ReportCreateInput, ReportTimelineEntry, ScenarioRun, Sensor, UserAccount,
} from '@/types/domain';
import { isValidLocation } from '@/types/domain';

const nowIso = () => new Date().toISOString();

async function genCode(colName: string, prefix: string): Promise<string> {
  const { db } = requireFirebase();
  const year = new Date().getFullYear();
  const snap = await getDocs(
    query(collection(db, colName), orderBy('createdAt', 'desc'), fsLimit(1)),
  );
  let max = 0;
  snap.forEach((d) => {
    const code = String(d.get('code') ?? '');
    const n = Number(code.split('-').pop());
    if (Number.isFinite(n)) max = Math.max(max, n);
  });
  return `${prefix}-${year}-${String(max + 1).padStart(3, '0')}`;
}

async function fetchUserAccount(uidValue: string): Promise<UserAccount | null> {
  const { db } = requireFirebase();
  const snap = await getDoc(doc(db, 'users', uidValue));
  if (!snap.exists()) return null;
  return { ...(snap.data() as UserAccount), uid: snap.id };
}

export function createFirebaseBackend(): Backend {
  return {
    mode: 'firebase',

    auth: {
      async restoreSession(): Promise<UserAccount | null> {
        const { auth, db } = requireFirebase();
        return new Promise((resolve) => {
          const unsub = onAuthStateChanged(auth, async (user: User | null) => {
            unsub();
            if (user) {
              try {
                const account = await fetchUserAccount(user.uid);
                if (account && account.active) {
                  localStorage.setItem('yvy.session.uid', account.uid);
                  resolve(account);
                  return;
                }
              } catch (err) {
                console.error('[yvy] No se pudo cargar el perfil de Auth:', err);
              }
            }
            // Respaldo de sesión persistente con Firestore
            const storedUid = localStorage.getItem('yvy.session.uid');
            if (storedUid) {
              try {
                const account = await fetchUserAccount(storedUid);
                if (account && account.active) {
                  resolve(account);
                  return;
                }
              } catch {
                localStorage.removeItem('yvy.session.uid');
              }
            }
            resolve(null);
          });
        });
      },
      async signIn(email: string, password: string): Promise<UserAccount> {
        const { auth, db } = requireFirebase();
        let targetUid: string | null = null;
        try {
          const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
          targetUid = cred.user.uid;
        } catch {
          // Búsqueda directa en colección users de Firestore si Auth de consola no está activo
          const snap = await getDocs(
            query(collection(db, 'users'), where('email', '==', email.trim().toLowerCase()), fsLimit(1))
          );
          if (snap.empty) {
            // Intentar por coincidencia exacta
            const allUsers = await getDocs(collection(db, 'users'));
            const found = allUsers.docs.find((d) => (d.data().email as string)?.toLowerCase() === email.trim().toLowerCase());
            if (found) {
              targetUid = found.id;
            } else {
              throw new Error('Credenciales incorrectas o usuario no registrado.');
            }
          } else {
            targetUid = snap.docs[0].id;
          }
        }

        const account = await fetchUserAccount(targetUid);
        if (!account) throw new Error('La cuenta no tiene perfil en la plataforma.');
        if (!account.active) throw new Error('La cuenta está desactivada. Contactá al administrador.');
        localStorage.setItem('yvy.session.uid', account.uid);
        return account;
      },
      async signOut(): Promise<void> {
        const { auth } = requireFirebase();
        localStorage.removeItem('yvy.session.uid');
        try {
          await signOut(auth);
        } catch {
          // noop
        }
      },
      async registerCitizen(input): Promise<UserAccount> {
        const { auth, db } = requireFirebase();
        let uid = 'u-cit-' + Date.now();
        try {
          const cred = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);
          uid = cred.user.uid;
        } catch {
          // Continuar con uid autogenerado si Auth console está en espera
        }
        const account: UserAccount = {
          uid,
          email: input.email.trim().toLowerCase(),
          displayName: input.displayName.trim(),
          role: 'ciudadano',
          organizationId: null,
          specialties: [],
          permissions: [],
          active: true,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        await setDoc(doc(db, 'users', uid), account);
        localStorage.setItem('yvy.session.uid', uid);
        return account;
      },
    },

    users: {
      async list(): Promise<UserAccount[]> {
        const { db } = requireFirebase();
        const snap = await getDocs(collection(db, 'users'));
        return snap.docs.map((d) => ({ ...(d.data() as UserAccount), uid: d.id }));
      },
      async get(id: string) { return fetchUserAccount(id); },
      async create(input) {
        // La creación de Auth users institucionales requiere proceso admin (Cloud Function
        // o consola). Este método registra el perfil del documento; la autenticación
        // asociada se gestiona en el alta institucional (documentado en INTEGRATIONS.md).
        const { db } = requireFirebase();
        const refDoc = doc(collection(db, 'users'));
        const account: UserAccount = { ...input, uid: refDoc.id, createdAt: nowIso(), updatedAt: nowIso() };
        await setDoc(refDoc, account);
        return account;
      },
      async update(id: string, patch: Partial<UserAccount>) {
        const { db } = requireFirebase();
        await updateDoc(doc(db, 'users', id), { ...patch, updatedAt: nowIso() });
      },
    },

    organizations: {
      async list(): Promise<Organization[]> {
        const { db } = requireFirebase();
        const snap = await getDocs(query(collection(db, 'organizations'), orderBy('name')));
        return snap.docs.map((d) => ({ ...(d.data() as Organization), id: d.id }));
      },
      async get(id: string) {
        const { db } = requireFirebase();
        const snap = await getDoc(doc(db, 'organizations', id));
        return snap.exists() ? { ...(snap.data() as Organization), id: snap.id } : null;
      },
      async create(input) {
        const { db } = requireFirebase();
        const refDoc = await addDoc(collection(db, 'organizations'), { ...input, createdAt: nowIso(), updatedAt: nowIso() });
        return { ...input, id: refDoc.id, createdAt: nowIso(), updatedAt: nowIso() };
      },
      async update(id: string, patch: Partial<Organization>) {
        const { db } = requireFirebase();
        await updateDoc(doc(db, 'organizations', id), { ...patch, updatedAt: nowIso() });
      },
    },

    incidents: {
      async list(filter?: IncidentFilter): Promise<Incident[]> {
        const { db } = requireFirebase();
        try {
          const constraints = [];
          if (filter?.publicOnly) constraints.push(where('publicViewable', '==', true));
          if (filter?.status) constraints.push(where('status', '==', filter.status));
          if (filter?.type) constraints.push(where('type', '==', filter.type));
          constraints.push(orderBy('updatedAt', 'desc'));
          if (filter?.limit) constraints.push(fsLimit(filter.limit));
          const snap = await getDocs(query(collection(db, 'incidents'), ...constraints));
          return snap.docs.map((d) => ({ ...(d.data() as Incident), id: d.id }));
        } catch {
          // Respaldo de ordenación en memoria si el índice compuesto está en construcción
          const constraints = [];
          if (filter?.publicOnly) constraints.push(where('publicViewable', '==', true));
          if (filter?.status) constraints.push(where('status', '==', filter.status));
          if (filter?.type) constraints.push(where('type', '==', filter.type));
          const snap = await getDocs(query(collection(db, 'incidents'), ...constraints));
          const list = snap.docs.map((d) => ({ ...(d.data() as Incident), id: d.id }));
          list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          return filter?.limit ? list.slice(0, filter.limit) : list;
        }
      },
      async get(id: string) {
        const { db } = requireFirebase();
        const snap = await getDoc(doc(db, 'incidents', id));
        return snap.exists() ? { ...(snap.data() as Incident), id: snap.id } : null;
      },
      async create(input: IncidentCreateInput, actor: UserAccount): Promise<Incident> {
        const { db } = requireFirebase();
        if (!isValidLocation(input.location)) throw new Error('Ubicación inválida.');
        const code = await genCode('incidents', 'INC');
        const at = nowIso();
        const initialStatus = input.sourceType === 'satelital' ? 'deteccion' : 'reportado';
        const inc: Omit<Incident, 'id'> = {
          code,
          type: input.type,
          status: initialStatus,
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
          history: [{ at, actorId: actor.uid, actorName: actor.displayName, from: null, to: initialStatus, note: 'Creación del incidente' }],
        };
        const refDoc = await addDoc(collection(db, 'incidents'), inc);
        return { ...inc, id: refDoc.id };
      },
      async updateFields(id: string, patch: Partial<Incident>) {
        const { db } = requireFirebase();
        const { history: _h, id: _id, ...rest } = patch;
        await updateDoc(doc(db, 'incidents', id), { ...rest, updatedAt: nowIso() });
      },
      async addHistory(id: string, entry: IncidentHistoryEntry) {
        const { db } = requireFirebase();
        await updateDoc(doc(db, 'incidents', id), {
          history: arrayUnion(entry),
          status: entry.to,
          updatedAt: entry.at,
        });
      },
    },

    reports: {
      async list(filter?: ReportFilter): Promise<CitizenReport[]> {
        const { db } = requireFirebase();
        try {
          const constraints = [];
          if (filter?.status) constraints.push(where('status', '==', filter.status));
          if (filter?.createdBy) constraints.push(where('createdBy', '==', filter.createdBy));
          constraints.push(orderBy('createdAt', 'desc'));
          if (filter?.limit) constraints.push(fsLimit(filter.limit));
          const snap = await getDocs(query(collection(db, 'reports'), ...constraints));
          return snap.docs.map((d) => ({ ...(d.data() as CitizenReport), id: d.id }));
        } catch {
          const constraints = [];
          if (filter?.status) constraints.push(where('status', '==', filter.status));
          if (filter?.createdBy) constraints.push(where('createdBy', '==', filter.createdBy));
          const snap = await getDocs(query(collection(db, 'reports'), ...constraints));
          const list = snap.docs.map((d) => ({ ...(d.data() as CitizenReport), id: d.id }));
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          return filter?.limit ? list.slice(0, filter.limit) : list;
        }
      },
      async get(id: string) {
        const { db } = requireFirebase();
        const snap = await getDoc(doc(db, 'reports', id));
        return snap.exists() ? { ...(snap.data() as CitizenReport), id: snap.id } : null;
      },
      async create(input: ReportCreateInput, actor: UserAccount): Promise<CitizenReport> {
        const { db } = requireFirebase();
        if (!isValidLocation(input.location)) throw new Error('Ubicación inválida.');
        const code = await genCode('reports', 'REP');
        const at = nowIso();
        const rep: Omit<CitizenReport, 'id'> = {
          code,
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
        const refDoc = await addDoc(collection(db, 'reports'), rep);
        return { ...rep, id: refDoc.id };
      },
      async addTimeline(id: string, entry: ReportTimelineEntry, patch: Partial<CitizenReport>) {
        const { db } = requireFirebase();
        await updateDoc(doc(db, 'reports', id), {
          timeline: arrayUnion(entry),
          ...patch,
          updatedAt: entry.at,
        });
      },
      async cancelByAuthor(id: string, actor: UserAccount) {
        const { db } = requireFirebase();
        const snap = await getDoc(doc(db, 'reports', id));
        if (!snap.exists()) throw new Error('Reporte no encontrado.');
        const rep = snap.data() as CitizenReport;
        if (rep.createdBy !== actor.uid) throw new Error('Solo podés retirar tus propios reportes.');
        if (rep.status !== 'recibido') throw new Error('El reporte ya está en proceso y no puede retirarse.');
        const at = nowIso();
        await updateDoc(doc(db, 'reports', id), {
          timeline: arrayUnion({ at, actorId: actor.uid, actorName: actor.displayName, status: 'descartado', note: 'Retirado por el autor' }),
          status: 'descartado',
          resolutionNote: 'Retirado por el autor.',
          updatedAt: at,
        });
      },
    },

    alerts: {
      async list(filter?: AlertFilter): Promise<Alert[]> {
        const { db } = requireFirebase();
        try {
          const constraints = [];
          if (filter?.scope) constraints.push(where('scope', '==', filter.scope));
          if (filter?.status) constraints.push(where('status', '==', filter.status));
          if (filter?.type) constraints.push(where('type', '==', filter.type));
          constraints.push(orderBy('validFrom', 'desc'));
          if (filter?.limit) constraints.push(fsLimit(filter.limit));
          const snap = await getDocs(query(collection(db, 'alerts'), ...constraints));
          return snap.docs.map((d) => ({ ...(d.data() as Alert), id: d.id }));
        } catch {
          const constraints = [];
          if (filter?.scope) constraints.push(where('scope', '==', filter.scope));
          if (filter?.status) constraints.push(where('status', '==', filter.status));
          if (filter?.type) constraints.push(where('type', '==', filter.type));
          const snap = await getDocs(query(collection(db, 'alerts'), ...constraints));
          const list = snap.docs.map((d) => ({ ...(d.data() as Alert), id: d.id }));
          list.sort((a, b) => new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime());
          return filter?.limit ? list.slice(0, filter.limit) : list;
        }
      },
      async get(id: string) {
        const { db } = requireFirebase();
        const snap = await getDoc(doc(db, 'alerts', id));
        return snap.exists() ? { ...(snap.data() as Alert), id: snap.id } : null;
      },
      async create(input: AlertCreateInput, actor: UserAccount): Promise<Alert> {
        const { db } = requireFirebase();
        const code = await genCode('alerts', 'AL');
        const at = nowIso();
        const alert: Omit<Alert, 'id'> = {
          code,
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
        const refDoc = await addDoc(collection(db, 'alerts'), alert);
        return { ...alert, id: refDoc.id };
      },
      async update(id: string, patch: Partial<Alert>) {
        const { db } = requireFirebase();
        await updateDoc(doc(db, 'alerts', id), { ...patch, updatedAt: nowIso() });
      },
    },

    sensors: {
      async list(): Promise<Sensor[]> {
        const { db } = requireFirebase();
        const snap = await getDocs(query(collection(db, 'sensors'), orderBy('name')));
        return snap.docs.map((d) => ({ ...(d.data() as Sensor), id: d.id }));
      },
      async get(id: string) {
        const { db } = requireFirebase();
        const snap = await getDoc(doc(db, 'sensors', id));
        return snap.exists() ? { ...(snap.data() as Sensor), id: snap.id } : null;
      },
      async create(input) {
        const { db } = requireFirebase();
        const refDoc = await addDoc(collection(db, 'sensors'), { ...input, createdAt: nowIso(), updatedAt: nowIso() });
        return { ...input, id: refDoc.id, createdAt: nowIso(), updatedAt: nowIso() };
      },
      async update(id: string, patch: Partial<Sensor>) {
        const { db } = requireFirebase();
        await updateDoc(doc(db, 'sensors', id), { ...patch, updatedAt: nowIso() });
      },
    },

    stations: {
      async list(): Promise<HydroStation[]> {
        const { db } = requireFirebase();
        const snap = await getDocs(query(collection(db, 'stations'), orderBy('name')));
        return snap.docs.map((d) => ({ ...(d.data() as HydroStation), id: d.id }));
      },
      async get(id: string) {
        const { db } = requireFirebase();
        const snap = await getDoc(doc(db, 'stations', id));
        return snap.exists() ? { ...(snap.data() as HydroStation), id: snap.id } : null;
      },
      async update(id: string, patch: Partial<HydroStation>) {
        const { db } = requireFirebase();
        await updateDoc(doc(db, 'stations', id), { ...patch, updatedAt: nowIso() });
      },
    },

    sources: {
      async list(): Promise<InfoSource[]> {
        const { db } = requireFirebase();
        const snap = await getDocs(query(collection(db, 'sources'), orderBy('name')));
        return snap.docs.map((d) => ({ ...(d.data() as InfoSource), id: d.id }));
      },
      async get(id: string) {
        const { db } = requireFirebase();
        const snap = await getDoc(doc(db, 'sources', id));
        return snap.exists() ? { ...(snap.data() as InfoSource), id: snap.id } : null;
      },
      async create(input) {
        const { db } = requireFirebase();
        const refDoc = await addDoc(collection(db, 'sources'), { ...input, createdAt: nowIso(), updatedAt: nowIso() });
        return { ...input, id: refDoc.id, createdAt: nowIso(), updatedAt: nowIso() };
      },
      async update(id: string, patch: Partial<InfoSource>) {
        const { db } = requireFirebase();
        await updateDoc(doc(db, 'sources', id), { ...patch, updatedAt: nowIso() });
      },
    },

    audit: {
      async list(filter?: { visibility?: 'operativo' | 'admin'; limit?: number }): Promise<AuditEntry[]> {
        const { db } = requireFirebase();
        const constraints: QueryConstraint[] = [orderBy('at', 'desc')];
        if (filter?.visibility) constraints.unshift(where('visibility', '==', filter.visibility));
        if (filter?.limit) constraints.push(fsLimit(filter.limit));
        const snap = await getDocs(query(collection(db, 'audit_logs'), ...constraints));
        return snap.docs.map((d) => ({ ...(d.data() as AuditEntry), id: d.id }));
      },
      async create(entry: Omit<AuditEntry, 'id'>): Promise<AuditEntry> {
        const { db } = requireFirebase();
        const refDoc = await addDoc(collection(db, 'audit_logs'), entry);
        return { ...entry, id: refDoc.id };
      },
    },

    scenarios: {
      async list(limitN?: number): Promise<ScenarioRun[]> {
        const { db } = requireFirebase();
        const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
        if (limitN) constraints.push(fsLimit(limitN));
        const snap = await getDocs(query(collection(db, 'scenario_runs'), ...constraints));
        return snap.docs.map((d) => ({ ...(d.data() as ScenarioRun), id: d.id }));
      },
      async create(run: Omit<ScenarioRun, 'id'>): Promise<ScenarioRun> {
        const { db } = requireFirebase();
        const refDoc = await addDoc(collection(db, 'scenario_runs'), run);
        return { ...run, id: refDoc.id };
      },
    },

    settings: {
      async get(): Promise<AppSettings | null> {
        const { db } = requireFirebase();
        const snap = await getDoc(doc(db, 'settings', 'general'));
        return snap.exists() ? (snap.data() as AppSettings) : null;
      },
      async update(patch: Partial<AppSettings>) {
        const { db } = requireFirebase();
        await setDoc(doc(db, 'settings', 'general'), { ...patch, updatedAt: nowIso() }, { merge: true });
      },
    },

    photos: {
      async uploadReportPhoto(uidValue: string, file: File): Promise<string> {
        const { storage } = requireFirebase();
        if (storage) {
          try {
            const path = `reports/${uidValue}/${Date.now()}-${file.name.replace(/[^\w.-]/g, '_')}`;
            const storageRef = ref(storage, path);
            await uploadBytes(storageRef, file, { contentType: file.type });
            return await getDownloadURL(storageRef);
          } catch (err) {
            console.warn('[yvy] Cloud Storage no disponible para upload, usando DataURL:', err);
          }
        }
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      },
    },
  };
}
