/**
 * Tests — motor de escenarios demo (reglas simples, etiquetado como no operativo).
 * Se verifica la matemática del motor de reglas y la presencia obligatoria
 * del descargo de responsabilidad (nunca presentarlo como predicción operativa).
 */
import { describe, expect, it } from 'vitest';
import {
  FIRE_LIMITATIONS, HYDRO_LIMITATIONS, SCENARIO_ENGINE,
  runFireScenario, runHydroScenario,
} from '@/services/scenarios.service';

const station = { name: 'Paso de la Patria', currentLevelM: 5.7, alertLevelM: 6.5, evacLevelM: 7.0 };

describe('runFireScenario (motor de reglas demo)', () => {
  it('la tasa de avance crece con el viento', () => {
    const calm = runFireScenario({ windSpeedKmh: 5, windDirection: 'N', relativeHumidityPct: 30, horizonHours: 6 });
    const windy = runFireScenario({ windSpeedKmh: 40, windDirection: 'N', relativeHumidityPct: 30, horizonHours: 6 });
    const rateCalm = Number(calm.headline['Tasa de avance estimada'].match(/([\d.]+) km\/h/)?.[1] ?? 0);
    const rateWindy = Number(windy.headline['Tasa de avance estimada'].match(/([\d.]+) km\/h/)?.[1] ?? 0);
    expect(rateWindy).toBeGreaterThan(rateCalm);
    expect(rateWindy).toBeGreaterThan(0);
  });

  it('la sequía (HR baja) agrava la tasa de avance', () => {
    const wet = runFireScenario({ windSpeedKmh: 30, windDirection: 'NE', relativeHumidityPct: 50, horizonHours: 6 });
    const dry = runFireScenario({ windSpeedKmh: 30, windDirection: 'NE', relativeHumidityPct: 15, horizonHours: 6 });
    const rateWet = Number(wet.headline['Tasa de avance estimada'].match(/([\d.]+) km\/h/)?.[1] ?? 0);
    const rateDry = Number(dry.headline['Tasa de avance estimada'].match(/([\d.]+) km\/h/)?.[1] ?? 0);
    expect(rateDry).toBeGreaterThan(rateWet);
  });

  it('el frente proyectado escala con el horizonte', () => {
    const short = runFireScenario({ windSpeedKmh: 30, windDirection: 'NE', relativeHumidityPct: 30, horizonHours: 2 });
    const long = runFireScenario({ windSpeedKmh: 30, windDirection: 'NE', relativeHumidityPct: 30, horizonHours: 12 });
    const frontShort = Number(short.headline['Frente proyectado'].match(/~([\d.]+) km/)?.[1] ?? 0);
    const frontLong = Number(long.headline['Frente proyectado'].match(/~([\d.]+) km/)?.[1] ?? 0);
    expect(frontLong).toBeGreaterThan(frontShort);
  });

  it('SIEMPRE declara que es un resultado demostrativo, no operativo', () => {
    const result = runFireScenario({ windSpeedKmh: 34, windDirection: 'SO', relativeHumidityPct: 21, horizonHours: 6 });
    const disclaimer = result.notes.join(' ');
    expect(disclaimer).toContain(SCENARIO_ENGINE);
    expect(disclaimer.toLowerCase()).toContain('no constituye una predicción operativa');
    expect(FIRE_LIMITATIONS.join(' ')).toContain('NO es un modelo físico');
  });
});

describe('runHydroScenario (proyección lineal demo)', () => {
  it('proyecta el nivel con la tasa asumida', () => {
    const result = runHydroScenario(
      { stationCode: 'H-01', climbRateCmPerHour: 4, horizonHours: 12 },
      station,
    );
    // 5.70 + 4cm/h * 12h = 5.70 + 0.48 = 6.18 m
    expect(result.headline['Nivel proyectado']).toContain('6.18 m');
  });

  it('detecta el cruce de cota de alerta dentro del horizonte', () => {
    const result = runHydroScenario(
      { stationCode: 'H-01', climbRateCmPerHour: 4, horizonHours: 24 },
      station,
    );
    // margen a alerta = 0.8m = 80cm → 80/4 = 20h < 24h → debe avisarse
    expect(result.notes.join(' ')).toContain('cota de alerta');
    expect(result.headline.Estado).toBe('Supera cota de alerta'); // 6.66 > 6.5
  });

  it('estado bajo umbrales cuando la proyección no alcanza la cota', () => {
    const result = runHydroScenario(
      { stationCode: 'H-01', climbRateCmPerHour: 1, horizonHours: 6 },
      station,
    );
    // 5.70 + 0.06 = 5.76 < 6.5
    expect(result.headline.Estado).toBe('Bajo umbrales');
  });

  it('SIEMPRE declara que es una proyección lineal de referencia', () => {
    const result = runHydroScenario(
      { stationCode: 'H-01', climbRateCmPerHour: 4, horizonHours: 6 },
      station,
    );
    expect(result.notes.join(' ')).toContain('Proyección lineal');
    expect(result.notes.join(' ')).toContain(SCENARIO_ENGINE);
    expect(HYDRO_LIMITATIONS.join(' ')).toContain('no un modelo hidrodinámico');
  });
});
