/**
 * SERVICIO DE REPORTES CIUDADANOS.
 * Ciudadanos: crean y consultan los propios. Agentes: verifican y resuelven.
 * El estado nunca lo cambia el ciudadano.
 */
import { getBackend } from '@/repositories';
import { authState, can, requirePermission, PermissionError } from '@/services/auth.service';
import { recordAudit } from '@/services/audit.service';
import { appConfig } from '@/config/appConfig';
import {
  AUDIT_ACTIONS, canTransitionReport, isValidLocation,
  type CitizenReport, type IncidentType, type ReportCreateInput,
  type ReportStatus, type ReportType,
} from '@/types/domain';

/** Mapa reporte → incidente (regla de derivación). */
const REPORT_TYPE_TO_INCIDENT: Record<ReportType, IncidentType> = {
  incendio: 'incendio',
  humo: 'humo',
  inundacion: 'inundacion',
  anegamiento: 'anegamiento',
  camino_bloqueado: 'otro',
  otro: 'otro',
};

export function validatePhoto(file: File): string | null {
  if (!appConfig.photos.acceptedTypes.includes(file.type as (typeof appConfig.photos.acceptedTypes)[number])) {
    return 'Formato no permitido. Usá JPG, PNG o WebP.';
  }
  if (file.size > appConfig.photos.maxBytes) {
    return 'La imagen supera el máximo de 5 MB.';
  }
  return null;
}

/** Crea un reporte (cualquier usuario autenticado; política: reportar requiere sesión). */
export async function createReport(input: ReportCreateInput, photo?: File | null): Promise<CitizenReport> {
  const user = authState.user;
  if (!user) throw new PermissionError('session');
  if (input.description.trim().length < 10) {
    throw new Error('Contanos qué está pasando (al menos 10 caracteres).');
  }
  if (!isValidLocation(input.location)) throw new Error('Ubicación inválida.');
  let photoUrl: string | null = null;
  if (photo) {
    const invalid = validatePhoto(photo);
    if (invalid) throw new Error(invalid);
    photoUrl = await getBackend().photos.uploadReportPhoto(user.uid, photo);
  }
  const report = await getBackend().reports.create({ ...input, photoUrl }, user);
  await recordAudit({
    action: AUDIT_ACTIONS.reportCreated,
    targetType: 'report',
    targetId: report.code,
    details: `Reporte ${report.code} (${report.type}) recibido.`,
    visibility: 'operativo',
  });
  return report;
}

/** Reportes del ciudadano actual (solo los propios). */
export async function listMyReports(): Promise<CitizenReport[]> {
  const user = authState.user;
  if (!user) throw new PermissionError('session');
  return getBackend().reports.list({ createdBy: user.uid });
}

/** Puntos de notificación ciudadana para el mapa público. */
export async function listPublicNotificationPoints(): Promise<CitizenReport[]> {
  const backend = getBackend();
  const user = authState.user;
  if (user) {
    if (can('reports:read')) {
      return backend.reports.list({ limit: 50 });
    }
    const my = await backend.reports.list({ createdBy: user.uid, limit: 30 });
    const others = await backend.reports.list({ limit: 30 });
    const map = new Map<string, CitizenReport>();
    for (const r of [...my, ...others]) map.set(r.id, r);
    return Array.from(map.values());
  }
  return backend.reports.list({ limit: 30 });
}

export async function getMyReport(id: string): Promise<CitizenReport | null> {
  const user = authState.user;
  if (!user) throw new PermissionError('session');
  const report = await getBackend().reports.get(id);
  if (!report || report.createdBy !== user.uid) return null; // aislamiento horizontal
  return report;
}

/** Retira un reporte propio mientras esté en `recibido`. */
export async function withdrawMyReport(id: string): Promise<void> {
  const user = authState.user;
  if (!user) throw new PermissionError('session');
  await getBackend().reports.cancelByAuthor(id, user);
  await recordAudit({
    action: AUDIT_ACTIONS.reportClosed,
    targetType: 'report',
    targetId: id,
    details: 'Reporte retirado por su autor.',
    visibility: 'operativo',
  });
}

/** Listado operativo para agentes (permiso `reports:read`). */
export async function listReportsForAgents(filter?: { status?: ReportStatus; limit?: number }): Promise<CitizenReport[]> {
  requirePermission('reports:read');
  return getBackend().reports.list(filter);
}

async function transitionReport(
  report: CitizenReport,
  to: ReportStatus,
  note: string | undefined,
  patch: Partial<CitizenReport>,
): Promise<void> {
  const backend = getBackend();
  const actor = requirePermission('reports:verify');
  if (!canTransitionReport(report.status, to)) {
    throw new Error(`Transición inválida: ${report.status} → ${to}.`);
  }
  const at = new Date().toISOString();
  await backend.reports.addTimeline(
    report.id,
    { at, actorId: actor.uid, actorName: actor.displayName, status: to, note: note?.trim() || undefined },
    patch,
  );
}

/** Pasa el reporte a `en_verificacion` (toma de la operación). */
export async function startReportVerification(id: string): Promise<void> {
  const report = await getBackend().reports.get(id);
  if (!report) throw new Error('Reporte no encontrado.');
  await transitionReport(report, 'en_verificacion', 'En verificación por operativo', {
    status: 'en_verificacion',
  });
}

/**
 * Resuelve un reporte: confirma (opcionalmente derivando a incidente) o descarta.
 * Requiere `reports:verify`; para derivar a incidente, además `incidents:create`.
 */
export async function resolveReport(input: {
  id: string;
  decision: 'confirmado' | 'descartado';
  note?: string;
  createIncident?: boolean;
}): Promise<{ report: CitizenReport; incidentId: string | null }> {
  const backend = getBackend();
  const report = await backend.reports.get(input.id);
  if (!report) throw new Error('Reporte no encontrado.');

  let incidentId: string | null = report.incidentId;
  if (input.decision === 'confirmado' && input.createIncident && !incidentId) {
    if (!can('incidents:create')) {
      throw new Error('No tenés permiso para crear incidentes; confirmá sin derivar o derivá a un agente autorizado.');
    }
    const actor = authState.user!;
    const incident = await backend.incidents.create(
      {
        type: REPORT_TYPE_TO_INCIDENT[report.type],
        description: report.description,
        location: report.location,
        sourceType: 'reporte_ciudadano',
        sourceRef: report.code,
        priority: 'media',
      },
      actor,
    );
    incidentId = incident.id;
    await recordAudit({
      action: AUDIT_ACTIONS.incidentCreated,
      targetType: 'incident',
      targetId: incident.code,
      details: `Incidente derivado del reporte ${report.code}.`,
      visibility: 'operativo',
    });
  }

  const patch: Partial<CitizenReport> = {
    status: input.decision,
    incidentId,
    resolutionNote: input.note?.trim() || (input.decision === 'confirmado' ? 'Confirmado por operativo.' : 'Descartado por operativo.'),
  };
  if (input.decision === 'confirmado') {
    const actor = authState.user!;
    patch.verifiedBy = actor.uid;
    patch.verifiedAt = new Date().toISOString();
  }
  await transitionReport(report, input.decision, input.note, patch);

  await recordAudit({
    action: input.decision === 'confirmado' ? AUDIT_ACTIONS.reportVerified : AUDIT_ACTIONS.reportDiscarded,
    targetType: 'report',
    targetId: report.code,
    details: `${report.status} → ${input.decision}${input.note ? ` (${input.note})` : ''}${incidentId ? ' · derivado a incidente' : ''}`,
    visibility: 'operativo',
  });

  const updated = await backend.reports.get(input.id);
  return { report: updated ?? report, incidentId };
}

/** Cierra un reporte confirmado (follow-up de la operación). */
export async function closeReport(id: string, note?: string): Promise<void> {
  const report = await getBackend().reports.get(id);
  if (!report) throw new Error('Reporte no encontrado.');
  await transitionReport(report, 'cerrado', note, { status: 'cerrado', resolutionNote: note?.trim() ?? report.resolutionNote });
  await recordAudit({
    action: AUDIT_ACTIONS.reportClosed,
    targetType: 'report',
    targetId: report.code,
    details: `Reporte cerrado${note ? ` (${note})` : ''}`,
    visibility: 'operativo',
  });
}
