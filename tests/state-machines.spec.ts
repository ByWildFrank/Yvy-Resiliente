/**
 * Tests — máquinas de estado de incidentes y reportes, y umbrales de estaciones.
 * Regla de negocio central: los estados solo avanzan por las transiciones definidas.
 */
import { describe, expect, it } from 'vitest';
import {
  canTransitionIncident, canTransitionReport, stationState,
  ACTIVE_INCIDENT_STATUSES, isValidLocation,
} from '@/types/domain';

describe('machine de estados de incidentes', () => {
  it('permite el flujo completo de verificación de un incendio', () => {
    expect(canTransitionIncident('reportado', 'en_verificacion')).toBe(true);
    expect(canTransitionIncident('en_verificacion', 'confirmado')).toBe(true);
    expect(canTransitionIncident('confirmado', 'en_gestion')).toBe(true);
    expect(canTransitionIncident('en_gestion', 'controlado')).toBe(true);
    expect(canTransitionIncident('controlado', 'cerrado')).toBe(true);
  });

  it('permite descartar desde estados tempranos y de confirmación', () => {
    expect(canTransitionIncident('deteccion', 'descartado')).toBe(true);
    expect(canTransitionIncident('reportado', 'descartado')).toBe(true);
    expect(canTransitionIncident('en_verificacion', 'descartado')).toBe(true);
    expect(canTransitionIncident('confirmado', 'descartado')).toBe(true);
  });

  it('rechaza saltos inválidos', () => {
    expect(canTransitionIncident('reportado', 'controlado')).toBe(false);
    expect(canTransitionIncident('deteccion', 'en_gestion')).toBe(false);
    expect(canTransitionIncident('confirmado', 'controlado')).toBe(false); // debe pasar por en_gestion
    expect(canTransitionIncident('cerrado', 'confirmado')).toBe(false);
    expect(canTransitionIncident('descartado', 'confirmado')).toBe(false);
  });

  it('los estados finales no admiten transiciones', () => {
    expect(canTransitionIncident('cerrado', 'cerrado')).toBe(false);
    expect(canTransitionIncident('descartado', 'descartado')).toBe(false);
  });

  it('los estados activos excluyen los finales', () => {
    expect(ACTIVE_INCIDENT_STATUSES).not.toContain('cerrado');
    expect(ACTIVE_INCIDENT_STATUSES).not.toContain('descartado');
    expect(ACTIVE_INCIDENT_STATUSES).toContain('en_gestion');
  });
});

describe('machine de estados de reportes ciudadanos', () => {
  it('el ciudadano nunca confirma directamente: recibido → en_verificacion primero', () => {
    expect(canTransitionReport('recibido', 'en_verificacion')).toBe(true);
    expect(canTransitionReport('recibido', 'confirmado')).toBe(false);
    expect(canTransitionReport('recibido', 'descartado')).toBe(true);
  });

  it('flujo de resolución completo', () => {
    expect(canTransitionReport('en_verificacion', 'confirmado')).toBe(true);
    expect(canTransitionReport('en_verificacion', 'descartado')).toBe(true);
    expect(canTransitionReport('confirmado', 'cerrado')).toBe(true);
  });

  it('estados finales bloqueados', () => {
    expect(canTransitionReport('descartado', 'recibido')).toBe(false);
    expect(canTransitionReport('descartado', 'confirmado')).toBe(false);
    expect(canTransitionReport('cerrado', 'en_verificacion')).toBe(false);
  });
});

describe('umbrales de estaciones hidrométricas', () => {
  const base = { currentLevelM: 5.7, alertLevelM: 6.5, evacLevelM: 7.0 };

  it('clasifica por umbrales', () => {
    expect(stationState({ ...base, currentLevelM: 4.0 })).toBe('normal');
    expect(stationState({ ...base, currentLevelM: 6.1 })).toBe('aviso');     // a 0,4 m de la cota
    expect(stationState({ ...base, currentLevelM: 6.5 })).toBe('alerta');
    expect(stationState({ ...base, currentLevelM: 7.0 })).toBe('evacuacion');
  });

  it('el margen de aviso es de 0,50 m bajo la cota de alerta', () => {
    expect(stationState({ ...base, currentLevelM: 6.01 })).toBe('aviso');
    expect(stationState({ ...base, currentLevelM: 5.99 })).toBe('normal');
  });
});

describe('validación de coordenadas', () => {
  it('acepta coordenadas de la región operativa', () => {
    expect(isValidLocation({ lat: -27.4692, lng: -58.8344 })).toBe(true);
  });
  it('rechaza valores fuera de rango o no numéricos', () => {
    expect(isValidLocation({ lat: 0, lng: 0 })).toBe(false);
    expect(isValidLocation({ lat: Number.NaN, lng: -58 })).toBe(false);
  });
});
