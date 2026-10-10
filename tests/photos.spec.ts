/**
 * Tests — validación de adjuntos (fotos de reportes) y mensajes de error.
 * Política: solo imágenes JPEG/PNG/WebP, máximo 5 MB. Se aplica igual en storage.rules.
 */
import { describe, expect, it } from 'vitest';
import { validatePhoto } from '@/services/reports.service';
import { toUserMessage } from '@/types/states';

describe('validatePhoto', () => {
  it('acepta una imagen válida dentro del límite', () => {
    const file = new File(['x'.repeat(1024)], 'foto.jpg', { type: 'image/jpeg' });
    expect(validatePhoto(file)).toBeNull();
  });

  it('rechaza tipos no permitidos (aunque se declaren imagen)', () => {
    const gif = new File(['x'.repeat(10)], 'anim.gif', { type: 'image/gif' });
    expect(validatePhoto(gif)).toContain('Formato no permitido');
    const svg = new File(['<svg/>'], 'trazo.svg', { type: 'image/svg+xml' });
    expect(validatePhoto(svg)).toContain('Formato no permitido');
  });

  it('rechaza archivos de otros tipos', () => {
    const pdf = new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' });
    expect(validatePhoto(pdf)).toContain('Formato no permitido');
  });

  it('rechaza imágenes que superan 5 MB', () => {
    // 6 MB de contenido
    const big = new File([new Uint8Array(6 * 1024 * 1024)], 'pesada.png', { type: 'image/png' });
    expect(validatePhoto(big)).toContain('5 MB');
  });
});

describe('toUserMessage', () => {
  it('traduce errores de permisos del backend a mensajes de UI', () => {
    expect(toUserMessage(new Error('permission-denied: missing perms'))).toContain('permisos');
  });

  it('traduce falta de autenticación', () => {
    expect(toUserMessage(new Error('unauthenticated request'))).toContain('iniciar sesión');
  });

  it('no expone stacktraces ni detalles internos', () => {
    const msg = toUserMessage({ weird: true });
    expect(msg).toBe('Ocurrió un error inesperado. Reintentá en unos momentos.');
  });
});
