/**
 * SERVICIO ADMINISTRATIVO — usuarios, organismos y configuración.
 * Todas las operaciones requieren permisos explícitos y quedan auditadas.
 */
import { getBackend } from '@/repositories';
import { requirePermission, requireSession } from '@/services/auth.service';
import { recordAudit } from '@/services/audit.service';
import { AUDIT_ACTIONS, type AppSettings, type Organization, type UserAccount } from '@/types/domain';

// ─── Usuarios ────────────────────────────────────────────────────────────────

export async function listUsers(): Promise<UserAccount[]> {
  requirePermission('users:read');
  return getBackend().users.list();
}

export async function getUser(uid: string): Promise<UserAccount | null> {
  requirePermission('users:read');
  return getBackend().users.get(uid);
}

export async function createUser(input: Omit<UserAccount, 'uid' | 'createdAt' | 'updatedAt'>): Promise<UserAccount> {
  requirePermission('users:manage');
  if (input.role !== 'ciudadano' && input.role !== 'agente' && input.role !== 'admin') {
    throw new Error('Rol inválido.');
  }
  const user = await getBackend().users.create(input);
  await recordAudit({
    action: AUDIT_ACTIONS.userCreated,
    targetType: 'user',
    targetId: user.email,
    details: `Usuario ${user.email} creado con rol ${user.role}.`,
    visibility: 'admin',
  });
  return user;
}

/**
 * Actualiza un usuario (rol, permisos, organismo, especialidades, estado).
 * Los campos críticos solo cambian con `users:manage` (regla Firestore también lo exige).
 */
export async function updateUser(
  uid: string,
  patch: Partial<Pick<UserAccount, 'displayName' | 'role' | 'organizationId' | 'specialties' | 'permissions' | 'active'>>,
): Promise<void> {
  const actor = requirePermission('users:manage');
  const target = await getBackend().users.get(uid);
  if (!target) throw new Error('Usuario no encontrado.');
  if (target.uid === actor.uid && patch.active === false) {
    throw new Error('No podés desactivar tu propia cuenta.');
  }
  await getBackend().users.update(uid, patch);
  await recordAudit({
    action: AUDIT_ACTIONS.userUpdated,
    targetType: 'user',
    targetId: target.email,
    details: `Campos: ${Object.keys(patch).join(', ')}.`,
    visibility: 'admin',
  });
}

/** El propio usuario edita su nombre de presentación (sin permisos). */
export async function updateOwnDisplayName(displayName: string): Promise<void> {
  const actor = requireSession();
  if (displayName.trim().length < 2) throw new Error('El nombre es demasiado corto.');
  await getBackend().users.update(actor.uid, { displayName: displayName.trim() });
}

// ─── Organismos ──────────────────────────────────────────────────────────────

export async function listOrganizations(): Promise<Organization[]> {
  requireSession(); // cualquier usuario autenticado puede consultar el directorio
  return getBackend().organizations.list();
}

export async function getMyOrganization(): Promise<Organization | null> {
  const actor = requireSession();
  if (!actor.organizationId) return null;
  return getBackend().organizations.get(actor.organizationId);
}

export async function createOrganization(input: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Promise<Organization> {
  requirePermission('orgs:manage');
  const org = await getBackend().organizations.create(input);
  await recordAudit({
    action: AUDIT_ACTIONS.orgChanged,
    targetType: 'organization',
    targetId: org.name,
    details: `Organismo ${org.name} creado.`,
    visibility: 'admin',
  });
  return org;
}

export async function updateOrganization(id: string, patch: Partial<Organization>): Promise<void> {
  requirePermission('orgs:manage');
  const org = await getBackend().organizations.get(id);
  if (!org) throw new Error('Organismo no encontrado.');
  await getBackend().organizations.update(id, patch);
  await recordAudit({
    action: AUDIT_ACTIONS.orgChanged,
    targetType: 'organization',
    targetId: org.name,
    details: `Campos: ${Object.keys(patch).join(', ')}.`,
    visibility: 'admin',
  });
}

// ─── Configuración ───────────────────────────────────────────────────────────

export async function getSettings(): Promise<AppSettings | null> {
  return getBackend().settings.get();
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<void> {
  requirePermission('settings:manage');
  await getBackend().settings.update(patch);
  await recordAudit({
    action: AUDIT_ACTIONS.settingsChanged,
    targetType: 'settings',
    targetId: 'general',
    details: `Campos: ${Object.keys(patch).join(', ')}.`,
    visibility: 'admin',
  });
}
