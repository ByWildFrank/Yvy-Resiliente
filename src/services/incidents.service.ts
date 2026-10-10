/**
 * SERVICIO DE INCIDENTES — casos de uso con verificación de permisos,
 * máquina de estados y trazabilidad.
 */
import { getBackend } from '@/repositories';
import {
  can, authState, requirePermission,
} from '@/services/auth.service';
import { recordAudit } from '@/services/audit.service';
import {
  ACTIVE_INCIDENT_STATUSES, AUDIT_ACTIONS, canTransitionIncident,
  type Incident, type IncidentCreateInput, type IncidentStatus,
} from '@/types/domain';
import type { IncidentFilter } from '@/repositories/contracts';

/**
 * Listado con ámbito: los agentes con permiso ven todo;
 * el público/ciudadano solo los difundibles.
 */
export async function listIncidents(filter?: IncidentFilter): Promise<Incident[]> {
  const backend = getBackend();
  if (can('incidents:read')) return backend.incidents.list(filter);
  return backend.incidents.list({ ...filter, publicOnly: true });
}

export async function getIncident(id: string): Promise<Incident | null> {
  const incident = await getBackend().incidents.get(id);
  if (!incident) return null;
  if (!incident.publicViewable && !can('incidents:read')) return null;
  return incident;
}

export async function createIncident(input: IncidentCreateInput): Promise<Incident> {
  const actor = requirePermission('incidents:create');
  if (input.description.trim().length < 10) {
    throw new Error('La descripción debe tener al menos 10 caracteres.');
  }
  const incident = await getBackend().incidents.create(input, actor);
  await recordAudit({
    action: AUDIT_ACTIONS.incidentCreated,
    targetType: 'incident',
    targetId: incident.code,
    details: `Incidente ${incident.code} (${incident.type}) creado con prioridad ${incident.priority}.`,
    visibility: 'operativo',
  });
  return incident;
}

/** Transición de estado verificada (requiere `incidents:verify`). */
export async function transitionIncident(
  id: string,
  to: IncidentStatus,
  note?: string,
): Promise<void> {
  const actor = requirePermission('incidents:verify');
  const incident = await getBackend().incidents.get(id);
  if (!incident) throw new Error('Incidente no encontrado.');
  if (!canTransitionIncident(incident.status, to)) {
    throw new Error(`Transición inválida: ${incident.status} → ${to}.`);
  }
  const at = new Date().toISOString();
  await getBackend().incidents.addHistory(id, {
    at,
    actorId: actor.uid,
    actorName: actor.displayName,
    from: incident.status,
    to,
    note: note?.trim() || undefined,
  });
  await recordAudit({
    action: AUDIT_ACTIONS.incidentStatusChanged,
    targetType: 'incident',
    targetId: incident.code,
    details: `${incident.status} → ${to}${note ? ` (${note})` : ''}`,
    visibility: 'operativo',
  });
}

/** Marca un incidente como difundible al mapa ciudadano (requiere verificación). */
export async function setIncidentPublicViewable(id: string, publicViewable: boolean): Promise<void> {
  const actor = requirePermission('incidents:verify');
  const incident = await getBackend().incidents.get(id);
  if (!incident) throw new Error('Incidente no encontrado.');
  if (publicViewable && !['confirmado', 'en_gestion', 'controlado', 'cerrado'].includes(incident.status)) {
    throw new Error('Solo incidentes verificados pueden difundirse.');
  }
  await getBackend().incidents.updateFields(id, { publicViewable });
  await recordAudit({
    action: AUDIT_ACTIONS.incidentStatusChanged,
    targetType: 'incident',
    targetId: incident.code,
    details: `Difusión pública: ${publicViewable ? 'habilitada' : 'retirada'}`,
    visibility: 'operativo',
  });
  void actor;
}

/** Edición de campos operativos (requiere permiso de verificación). */
export async function updateIncidentFields(
  id: string,
  patch: Partial<Pick<Incident, 'description' | 'priority' | 'areaHa' | 'levelM' | 'assignedTo' | 'organizationId'>>,
): Promise<void> {
  requirePermission('incidents:verify');
  const incident = await getBackend().incidents.get(id);
  if (!incident) throw new Error('Incidente no encontrado.');
  await getBackend().incidents.updateFields(id, patch);
}

export function countActiveIncidents(incidents: Incident[]): number {
  return incidents.filter((i) => ACTIVE_INCIDENT_STATUSES.includes(i.status)).length;
}

/** ¿El usuario actual puede operar sobre incidentes? (para UI de agentes) */
export function canViewInternalIncidents(): boolean {
  return can('incidents:read') && authState.user !== null;
}
