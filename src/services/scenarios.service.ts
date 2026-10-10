/**
 * SERVICIO DE ESCENARIOS — motor de reglas DEMOSTRATIVO.
 *
 * ⚠️ Esto NO es un modelo operativo (ni Rothermel ni hidrodinámica 2D).
 * Es un motor de reglas simples, versionado y etiquetado (`reglas-demo-v1`),
 * con supuestos y limitaciones explícitos. La UI lo declara como
 * "Simulación demostrativa — no operativa".
 * Cuando exista un motor real, este contrato se mantiene y `engine` cambia.
 */
import { getBackend } from '@/repositories';
import { requirePermission } from '@/services/auth.service';
import { recordAudit } from '@/services/audit.service';
import { AUDIT_ACTIONS, type FireScenarioInput, type HydroScenarioInput, type ScenarioResults, type ScenarioRun } from '@/types/domain';

export const SCENARIO_ENGINE = 'reglas-demo-v1';

export const FIRE_ASSUMPTIONS = [
  'Pastizal/embalsado seco como combustible dominante.',
  'Viento constante en magnitud y dirección durante todo el horizonte.',
  'Frente elíptico simplificado, sin corta-fuegos ni barreras naturales.',
];

export const FIRE_LIMITATIONS = [
  'Motor de reglas demostrativo: NO es un modelo físico de propagación.',
  'No considera topografía, manchas de humedad ni combates activos.',
  'Uso exclusivo para demostación del flujo; no apto para decisiones operativas.',
];

export const HYDRO_ASSUMPTIONS = [
  'Tendencia de subida constante (cm/h) durante todo el horizonte.',
  'Sin aportes laterales ni crecidas repentinamente aceleradas.',
];

export const HYDRO_LIMITATIONS = [
  'Proyección lineal de referencia, no un modelo hidrodinámico.',
  'La cota real depende de crecidas aguas arriba, viento y drenaje.',
  'Uso exclusivo para demostación del flujo; no apto para decisiones operativas.',
];

/**
 * Escenario de fuego (reglas demo): tasa base 0,4 km/h ajustada por viento
 * (factor creciente hasta +150 % con 40+ km/h) y sequía (HR<25 % → +30 %,
 * HR<40 % → +10 %, HR≥40 % → −10 %). El área proyectada usa un frente
 * elíptico simplificado.
 */
export function runFireScenario(input: FireScenarioInput): ScenarioResults {
  const baseRate = 0.4; // km/h — pastizal seco sin viento (supuesto documentado)
  const windFactor = 1 + Math.min(input.windSpeedKmh / 40, 1.5);
  const dryFactor =
    input.relativeHumidityPct < 25 ? 1.3 :
    input.relativeHumidityPct < 40 ? 1.1 : 0.9;
  const rate = baseRate * windFactor * dryFactor;
  const frontKm = rate * input.horizonHours;
  const areaHa = Math.round(frontKm * frontKm * 18); // elipse simplificada con eje menor ~40 %

  const danger =
    rate > 1.2 ? 'MUY ALTO' : rate > 0.8 ? 'ALTO' : rate > 0.5 ? 'MODERADO' : 'BAJO';

  return {
    headline: {
      'Tasa de avance estimada': `${rate.toFixed(2)} km/h (viento ${input.windSpeedKmh} km/h del ${input.windDirection}, HR ${input.relativeHumidityPct}%)`,
      'Frente proyectado': `~${frontKm.toFixed(1)} km a +${input.horizonHours} h`,
      'Área potencialmente afectada': `~${areaHa.toLocaleString('es-AR')} ha (estimación grosera)`,
      'Peligro de propagación': danger,
    },
    notes: [
      `Resultado del motor de reglas demostrativo ${SCENARIO_ENGINE}.`,
      'No constituye una predicción operativa ni una recomendación oficial.',
    ],
  };
}

/**
 * Escenario hídrico (reglas demo): proyección lineal del nivel a partir de la
 * tendencia informada, comparada con los umbrales de la estación.
 */
export function runHydroScenario(
  input: HydroScenarioInput,
  station: { name: string; currentLevelM: number; alertLevelM: number; evacLevelM: number },
): ScenarioResults {
  const projected = station.currentLevelM + (input.climbRateCmPerHour * input.horizonHours) / 100;
  const hoursToAlert = (station.alertLevelM - station.currentLevelM) * 100 / input.climbRateCmPerHour;
  const hoursToEvac = (station.evacLevelM - station.currentLevelM) * 100 / input.climbRateCmPerHour;

  const notes: string[] = [
    `Proyección lineal sobre ${station.name}: nivel actual ${station.currentLevelM.toFixed(2)} m, subida ${input.climbRateCmPerHour} cm/h.`,
  ];
  if (Number.isFinite(hoursToAlert) && hoursToAlert > 0 && hoursToAlert <= input.horizonHours) {
    notes.push(`Al ritmo asumido, la cota de alerta (${station.alertLevelM.toFixed(2)} m) se alcanzaría en ~${hoursToAlert.toFixed(1)} h.`);
  }
  if (Number.isFinite(hoursToEvac) && hoursToEvac > 0 && hoursToEvac <= input.horizonHours) {
    notes.push(`⚠️ La cota de evacuación (${station.evacLevelM.toFixed(2)} m) se alcanzaría en ~${hoursToEvac.toFixed(1)} h.`);
  }
  notes.push(`Resultado del motor de reglas demostrativo ${SCENARIO_ENGINE}. No es una predicción operativa.`);

  return {
    headline: {
      'Nivel proyectado': `${projected.toFixed(2)} m a +${input.horizonHours} h`,
      'Cota de alerta': `${station.alertLevelM.toFixed(2)} m (margen ${Math.max(0, station.alertLevelM - projected).toFixed(2)} m)`,
      'Cota de evacuación': `${station.evacLevelM.toFixed(2)} m (margen ${Math.max(0, station.evacLevelM - projected).toFixed(2)} m)`,
      Estado: projected >= station.evacLevelM ? 'Supera cota de evacuación' :
        projected >= station.alertLevelM ? 'Supera cota de alerta' : 'Bajo umbrales',
    },
    notes,
  };
}

/** Ejecuta y persiste la corrida (requiere `scenarios:run`). */
export async function runAndPersistScenario(params: {
  mode: 'incendio' | 'hidrologico';
  inputs: FireScenarioInput | HydroScenarioInput;
  results: ScenarioResults;
  assumptions: string[];
  limitations: string[];
}): Promise<ScenarioRun> {
  const actor = requirePermission('scenarios:run');
  const run = await getBackend().scenarios.create({
    ...params,
    engine: SCENARIO_ENGINE,
    runBy: actor.uid,
    runByName: actor.displayName,
    createdAt: new Date().toISOString(),
  });
  await recordAudit({
    action: AUDIT_ACTIONS.scenarioRun,
    targetType: 'scenario',
    targetId: run.id,
    details: `Escenario ${params.mode} ejecutado (${SCENARIO_ENGINE}).`,
    visibility: 'operativo',
  });
  return run;
}

export async function listRecentScenarioRuns(limit = 10): Promise<ScenarioRun[]> {
  return getBackend().scenarios.list(limit);
}
