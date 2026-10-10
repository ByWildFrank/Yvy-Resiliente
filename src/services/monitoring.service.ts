/**
 * SERVICIO DE MONITOREO — sensores, estaciones hidrométricas y fuentes.
 * Lecturas públicas donde corresponde; gestión con permisos; cero datos inventados.
 */
import { getBackend } from '@/repositories';
import { requirePermission } from '@/services/auth.service';
import { recordAudit } from '@/services/audit.service';
import { appConfig } from '@/config/appConfig';
import {
  AUDIT_ACTIONS, stationState, type HydroStation, type InfoSource, type Sensor,
  type StationState,
} from '@/types/domain';

// ─── Sensores ────────────────────────────────────────────────────────────────

export async function listSensors(): Promise<Sensor[]> {
  requirePermission('sensors:read');
  return getBackend().sensors.list();
}

export async function createSensor(input: Omit<Sensor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Sensor> {
  requirePermission('sensors:manage');
  const sensor = await getBackend().sensors.create(input);
  await recordAudit({
    action: AUDIT_ACTIONS.sensorChanged,
    targetType: 'sensor',
    targetId: sensor.code,
    details: `Sensor ${sensor.code} (${sensor.name}) registrado.`,
    visibility: 'admin',
  });
  return sensor;
}

export async function updateSensor(id: string, patch: Partial<Sensor>): Promise<void> {
  requirePermission('sensors:manage');
  const sensor = await getBackend().sensors.get(id);
  if (!sensor) throw new Error('Sensor no encontrado.');
  await getBackend().sensors.update(id, patch);
  await recordAudit({
    action: AUDIT_ACTIONS.sensorChanged,
    targetType: 'sensor',
    targetId: sensor.code,
    details: `Sensor ${sensor.code} actualizado (${Object.keys(patch).join(', ')}).`,
    visibility: 'admin',
  });
}

export interface SensorDiagnostic {
  sensor: Sensor;
  ageMs?: number;
  stale: boolean;
  summary: string;
}

/**
 * Diagnóstico local de un sensor: informa el ÚLTIMO DATO REGISTRADO y su antigüedad.
 * No inventa latencias ni respuestas de red: opera sobre el almacén real.
 */
export async function diagnoseSensor(id: string): Promise<SensorDiagnostic> {
  const sensor = await getBackend().sensors.get(id);
  if (!sensor) throw new Error('Sensor no encontrado.');
  const age = sensor.lastPayloadAt ? Date.now() - new Date(sensor.lastPayloadAt).getTime() : undefined;
  const stale = age === undefined || age > appConfig.staleAfterMs.sensor;
  const summary = sensor.lastPayloadAt
    ? `Último dato hace ${Math.max(1, Math.round((age ?? 0) / 60000))} min · batería ${sensor.battery ?? '—'}% · señal ${sensor.rssi ?? '—'} dBm`
    : 'Sin datos registrados.';
  return { sensor, ageMs: age, stale, summary };
}

// ─── Estaciones hidrométricas (información ambiental pública) ───────────────

export interface StationReadout extends HydroStation {
  state: StationState;
  stale: boolean;
  marginToAlertM: number;
}

export async function listStations(): Promise<StationReadout[]> {
  const stations = await getBackend().stations.list();
  return stations.map((s) => ({
    ...s,
    state: stationState(s),
    marginToAlertM: Math.round((s.alertLevelM - s.currentLevelM) * 100) / 100,
    stale: Date.now() - new Date(s.updatedAt).getTime() > appConfig.staleAfterMs.station,
  }));
}

/** Carga manual de una lectura por un agente autorizado (hasta integrar el adaptador). */
export async function updateStationReading(
  id: string,
  input: { currentLevelM: number; trendCmPerHour?: number | null },
): Promise<void> {
  requirePermission('sensors:manage');
  const station = await getBackend().stations.get(id);
  if (!station) throw new Error('Estación no encontrada.');
  if (!Number.isFinite(input.currentLevelM) || input.currentLevelM < 0 || input.currentLevelM > 30) {
    throw new Error('El nivel debe ser un valor entre 0 y 30 m.');
  }
  await getBackend().stations.update(id, {
    currentLevelM: input.currentLevelM,
    trendCmPerHour: input.trendCmPerHour ?? station.trendCmPerHour,
    updatedAt: new Date().toISOString(),
  });
  await recordAudit({
    action: AUDIT_ACTIONS.sensorChanged,
    targetType: 'station',
    targetId: station.code,
    details: `Lectura manual: ${input.currentLevelM.toFixed(2)} m.`,
    visibility: 'operativo',
  });
}

// ─── Fuentes de información ─────────────────────────────────────────────────

export async function listSources(): Promise<InfoSource[]> {
  // El registro de fuentes (sin secretos) es público: documenta procedencia y estado.
  return getBackend().sources.list();
}

export async function createSource(input: Omit<InfoSource, 'id' | 'createdAt' | 'updatedAt'>): Promise<InfoSource> {
  requirePermission('sources:manage');
  const source = await getBackend().sources.create(input);
  await recordAudit({
    action: AUDIT_ACTIONS.sourceChanged,
    targetType: 'source',
    targetId: source.code,
    details: `Fuente ${source.code} (${source.name}) registrada con estado ${source.status}.`,
    visibility: 'admin',
  });
  return source;
}

export async function updateSource(id: string, patch: Partial<InfoSource>): Promise<void> {
  requirePermission('sources:manage');
  const source = await getBackend().sources.get(id);
  if (!source) throw new Error('Fuente no encontrada.');
  await getBackend().sources.update(id, patch);
  await recordAudit({
    action: AUDIT_ACTIONS.sourceChanged,
    targetType: 'source',
    targetId: source.code,
    details: `Fuente ${source.code} actualizada (${Object.keys(patch).join(', ')}).`,
    visibility: 'admin',
  });
}
