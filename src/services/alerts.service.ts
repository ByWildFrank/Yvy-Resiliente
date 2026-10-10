/**
 * SERVICIO DE ALERTAS.
 * Público: alertas publicadas de ámbito público (sin sesión).
 * Agentes con `alerts:publish`: gestión y publicación (acción institucional auditada).
 */
import { getBackend } from '@/repositories';
import { authState, requirePermission } from '@/services/auth.service';
import { recordAudit } from '@/services/audit.service';
import { AUDIT_ACTIONS, type Alert, type AlertCreateInput } from '@/types/domain';

/** Alertas visibles por el público (sin sesión). */
export async function listPublicAlerts(): Promise<Alert[]> {
  return getBackend().alerts.list({ scope: 'publico', status: 'publicada' });
}

export async function getPublicAlert(id: string): Promise<Alert | null> {
  const alert = await getBackend().alerts.get(id);
  if (!alert) return null;
  if (alert.scope !== 'publico' || alert.status !== 'publicada') return null;
  return alert;
}

/** Todas las alertas (incluye borradores) para operadores con sesión. */
export async function listOperationalAlerts(): Promise<Alert[]> {
  if (!authState.user) {
    return listPublicAlerts();
  }
  return getBackend().alerts.list();
}

export async function createAlert(input: AlertCreateInput): Promise<Alert> {
  requirePermission('alerts:publish');
  if (input.title.trim().length < 6) throw new Error('El título es demasiado corto.');
  if (input.message.trim().length < 20) throw new Error('El mensaje debe describir la situación (al menos 20 caracteres).');
  return getBackend().alerts.create(input, authState.user!);
}

/** Publicación oficial — acción institucional auditada. */
export async function publishAlert(id: string): Promise<void> {
  const actor = requirePermission('alerts:publish');
  const alert = await getBackend().alerts.get(id);
  if (!alert) throw new Error('Alerta no encontrada.');
  if (alert.status !== 'borrador') throw new Error('Solo se publican borradores.');
  const at = new Date().toISOString();
  await getBackend().alerts.update(id, {
    status: 'publicada',
    validFrom: at,
    publishedBy: actor.uid,
    publishedAt: at,
  });
  await recordAudit({
    action: AUDIT_ACTIONS.alertPublished,
    targetType: 'alert',
    targetId: alert.code,
    details: `Alerta ${alert.code} (${alert.severity}) publicada para ámbito ${alert.scope}.`,
    visibility: 'operativo',
  });
}

export async function cancelAlert(id: string): Promise<void> {
  const actor = requirePermission('alerts:publish');
  const alert = await getBackend().alerts.get(id);
  if (!alert) throw new Error('Alerta no encontrada.');
  await getBackend().alerts.update(id, { status: 'cancelada' });
  await recordAudit({
    action: AUDIT_ACTIONS.alertCanceled,
    targetType: 'alert',
    targetId: alert.code,
    details: `Alerta ${alert.code} cancelada por ${actor.displayName}.`,
    visibility: 'operativo',
  });
}

export async function updateAlert(id: string, patch: Partial<Alert>): Promise<void> {
  requirePermission('alerts:publish');
  const alert = await getBackend().alerts.get(id);
  if (!alert) throw new Error('Alerta no encontrada.');
  if (alert.status === 'publicada') throw new Error('Una alerta publicada no se edita: cancelala y creá una nueva.');
  await getBackend().alerts.update(id, patch);
}
