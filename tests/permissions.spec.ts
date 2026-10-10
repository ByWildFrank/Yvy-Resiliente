/**
 * Tests — reglas de permisos RBAC.
 * Ver docs/PERMISSIONS_MATRIX.md.
 */
import { describe, expect, it } from 'vitest';
import { effectivePermissions, ROLE_BASE_PERMISSIONS } from '@/types/domain';

describe('effectivePermissions', () => {
  it('el ciudadano solo recibe los permisos base del rol', () => {
    const perms = effectivePermissions({ role: 'ciudadano', permissions: [] });
    expect([...perms]).toEqual(['alerts:read']);
  });

  it('el agente suma los permisos explícitos a los base', () => {
    const perms = effectivePermissions({
      role: 'agente',
      permissions: ['incidents:read', 'alerts:publish'],
    });
    expect(perms.has('alerts:read')).toBe(true);       // base
    expect(perms.has('history:read')).toBe(true);      // base
    expect(perms.has('alerts:publish')).toBe(true);    // explícito
    expect(perms.has('incidents:read')).toBe(true);    // explícito
    expect(perms.has('incidents:verify')).toBe(false); // no otorgado
  });

  it('el admin técnico NO recibe permisos institucionales por defecto', () => {
    // Requisito del producto: administrar la plataforma no implica publicar
    // alertas oficiales ni verificar emergencias.
    const base = effectivePermissions({ role: 'admin', permissions: [] });
    expect(base.has('alerts:publish')).toBe(false);
    expect(base.has('incidents:verify')).toBe(false);
    expect(base.has('reports:verify')).toBe(false);
    expect(base.has('audit:read')).toBe(true); // base del admin técnico
    expect(base.has('integrations:read')).toBe(true);
  });

  it('los permisos base están correctamente definidos por rol', () => {
    expect(ROLE_BASE_PERMISSIONS.ciudadano).not.toContain('incidents:read');
    expect(ROLE_BASE_PERMISSIONS.agente).toContain('alerts:read');
    expect(ROLE_BASE_PERMISSIONS.admin).not.toContain('alerts:publish');
  });
});
