/**
 * SERVICIO DE AUTENTICACIÓN Y SESIÓN.
 * Expone estado reactivo global, verificación de permisos y operaciones de sesión.
 */
import { reactive } from 'vue';
import { getBackend } from '@/repositories';
import { effectivePermissions, type Permission, type Role, type UserAccount } from '@/types/domain';

export class PermissionError extends Error {
  constructor(public required: Permission | 'session') {
    super(required === 'session'
      ? 'Necesitás iniciar sesión para esta acción.'
      : 'No tenés permisos para esta acción.');
    this.name = 'PermissionError';
  }
}

// ─── Estado reactivo de sesión (singleton de módulo) ─────────────────────────

interface AuthState {
  initialized: boolean;
  user: UserAccount | null;
}

const state = reactive<AuthState>({ initialized: false, user: null });
let permissionSet = new Set<Permission>();

function setUser(user: UserAccount | null): void {
  state.user = user;
  permissionSet = user ? effectivePermissions(user) : new Set();
}

/** Fachada de solo lectura y reactiva del estado de sesión. */
export const authState: { readonly initialized: boolean; readonly user: UserAccount | null } = {
  get initialized() { return state.initialized; },
  get user() { return state.user; },
};

/** Inicializa la sesión restaurando la sesión persistida (Auth o demo). */
export async function initAuth(): Promise<void> {
  if (state.initialized) return;
  try {
    const user = await getBackend().auth.restoreSession();
    setUser(user);
  } catch (err) {
    console.error('[yvy] Error restaurando sesión:', err);
    setUser(null);
  } finally {
    state.initialized = true;
  }
}

/** ¿El usuario tiene el permiso dado (incluye permisos base del rol)? */
export function can(permission: Permission): boolean {
  return state.user !== null && permissionSet.has(permission);
}

export function canAny(permissions: Permission[]): boolean {
  return permissions.some((p) => permissionSet.has(p));
}

export function isRole(...roles: Role[]): boolean {
  return state.user !== null && roles.includes(state.user.role);
}

export function isAuthenticated(): boolean {
  return state.user !== null;
}

export function requireSession(): UserAccount {
  if (!state.user) throw new PermissionError('session');
  return state.user;
}

export function requirePermission(permission: Permission): UserAccount {
  const user = requireSession();
  if (!permissionSet.has(permission)) throw new PermissionError(permission);
  return user;
}

// ─── Operaciones de sesión ──────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<UserAccount> {
  const user = await getBackend().auth.signIn(email, password);
  setUser(user);
  return user;
}

export async function logout(): Promise<void> {
  await getBackend().auth.signOut();
  setUser(null);
}

export async function registerCitizen(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<UserAccount> {
  if (!/^\S+@\S+\.\S+$/.test(input.email)) throw new Error('El correo no es válido.');
  if (input.password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');
  if (input.displayName.trim().length < 2) throw new Error('Ingresá tu nombre.');
  const user = await getBackend().auth.registerCitizen(input);
  setUser(user);
  return user;
}

/** Ruta inicial según el rol (usada por `/` y tras el login). */
export function homeRouteFor(user: UserAccount | null): string {
  if (!user) return '/ciudadano';
  switch (user.role) {
    case 'admin': return '/admin';
    case 'agente': return '/agente';
    default: return '/ciudadano';
  }
}
