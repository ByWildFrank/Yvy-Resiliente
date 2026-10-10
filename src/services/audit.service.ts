/**
 * SERVICIO DE AUDITORÍA — trazabilidad de acciones privilegiadas.
 * Las lecturas ordinarias no se auditan; sí las operaciones de negocio y administrativas.
 */
import { getBackend } from '@/repositories';
import { authState } from '@/services/auth.service';
import type { AuditEntry } from '@/types/domain';

export async function recordAudit(input: {
  action: AuditEntry['action'];
  targetType: string;
  targetId: string;
  details: string;
  visibility: AuditEntry['visibility'];
}): Promise<void> {
  const user = authState.user;
  if (!user) return; // las acciones auditables siempre ocurren con sesión activa
  try {
    await getBackend().audit.create({
      at: new Date().toISOString(),
      actorId: user.uid,
      actorName: user.displayName,
      ...input,
    });
  } catch (err) {
    // La auditoría no debe romper la operación de negocio, pero se registra el fallo.
    console.error('[yvy] No se pudo registrar auditoría:', err);
  }
}

export async function listOperationalActivity(limit = 20): Promise<AuditEntry[]> {
  return getBackend().audit.list({ visibility: 'operativo', limit });
}

export async function listAdminAudit(limit = 200): Promise<AuditEntry[]> {
  return getBackend().audit.list({ limit });
}
