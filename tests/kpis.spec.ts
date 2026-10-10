/**
 * Tests — indicadores DERIVADOS (kpis).
 * Regla central: ningún número de dashboard es constante; todo se calcula.
 */
import { describe, expect, it } from 'vitest';
import { sensorDistribution, territorySummary } from '@/services/kpis.service';
import type { Sensor } from '@/types/domain';
import type { StationReadout } from '@/services/monitoring.service';

function makeSensor(status: Sensor['status']): Sensor {
  return {
    id: Math.random().toString(36).slice(2), code: 'NODE', name: 'N', type: 'meteo',
    variable: 'v', unit: 'u', protocol: null, status, battery: null, rssi: null,
    lastPayloadAt: null, location: { lat: -27, lng: -58 }, organizationId: null,
    active: true, createdAt: '', updatedAt: '',
  };
}

describe('sensorDistribution', () => {
  it('cuenta por estado sin inventar porcentajes', () => {
    const dist = sensorDistribution([
      makeSensor('online'), makeSensor('online'), makeSensor('online'),
      makeSensor('advertencia'),
      makeSensor('silente'),
      makeSensor('mantenimiento'),
    ]);
    expect(dist.online).toBe(3);
    expect(dist.advertencia).toBe(1);
    expect(dist.silente).toBe(1);
    expect(dist.mantenimiento).toBe(1);
    expect(dist.online + dist.advertencia + dist.silente + dist.mantenimiento).toBe(6);
  });

  it('distribución vacía → ceros (no "N/D" inventado)', () => {
    const dist = sensorDistribution([]);
    expect(dist).toEqual({ online: 0, advertencia: 0, silente: 0, mantenimiento: 0 });
  });
});

describe('territorySummary', () => {
  const stations: StationReadout[] = [
    {
      id: 'st-1', code: 'H-01', name: 'Paso de la Patria', river: 'Paraná', province: 'Corrientes',
      location: { lat: -27.3, lng: -58.6 }, currentLevelM: 6.2, alertLevelM: 6.5, evacLevelM: 7.0,
      trendCmPerHour: 4, sourceType: 'manual', sourceRef: null, updatedAt: new Date().toISOString(),
      active: true, state: 'aviso', stale: false, marginToAlertM: 0.3,
    },
    {
      id: 'st-2', code: 'H-03', name: 'Barranqueras', river: 'Paraná', province: 'Chaco',
      location: { lat: -27.48, lng: -58.9 }, currentLevelM: 4.0, alertLevelM: 6.0, evacLevelM: 6.5,
      trendCmPerHour: null, sourceType: 'manual', sourceRef: null, updatedAt: new Date().toISOString(),
      active: true, state: 'normal', stale: false, marginToAlertM: 2.0,
    },
  ];

  it('agrupa alertas por territorio y agrega la peor estación', () => {
    const summary = territorySummary(
      [{ territory: 'Corrientes', severity: 'alerta' }, { territory: 'Corrientes', severity: 'aviso' }],
      stations,
    );
    const corrientes = summary.find((s) => s.territory === 'Corrientes');
    expect(corrientes?.alertCount).toBe(2);
    expect(corrientes?.worstStation?.code).toBe('H-01');
  });

  it('estaciones en estado normal no generan entradas por sí solas', () => {
    const summary = territorySummary([], stations);
    expect(summary.length).toBe(1); // solo Corrientes (H-01 en aviso)
    expect(summary[0].worstStation?.code).toBe('H-01');
  });

  it('sin datos de entrada → resumen vacío', () => {
    expect(territorySummary([], [])).toEqual([]);
  });
});
