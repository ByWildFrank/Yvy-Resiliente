/**
 * SERVICIO DE KPIs — indicadores DERIVADOS de los datos disponibles.
 * Ningún número está hardcodeado: todos se calculan desde los repositorios.
 * Si una fuente no está disponible, el KPI se omite o marca como no disponible.
 */
import { getBackend } from '@/repositories';
import { can } from '@/services/auth.service';
import { ACTIVE_INCIDENT_STATUSES, type Incident, type Sensor } from '@/types/domain';
import type { StationReadout } from '@/services/monitoring.service';

export interface DashboardKpis {
  /** Incidentes activos (estados operativos). */
  activeIncidents: number;
  /** Incidentes de fuego activos. */
  activeFireIncidents: number;
  /** Incidentes hídricos activos. */
  activeWaterIncidents: number;
  /** Reportes pendientes de verificación (solo agentes; null si no aplica). */
  reportsPending: number | null;
  /** Sensores en línea / total (null si el usuario no puede ver sensores). */
  sensorsOnline: number | null;
  sensorsTotal: number | null;
  /** Estaciones en estado de aviso/alerta/evacuación. */
  stationsInAlert: number;
  stationsTotal: number;
  /** Alertas públicas vigentes. */
  publicAlerts: number;
  /** Incidentes difundibles al ciudadano. */
  publicIncidents: number;
  /** Última actualización de cualquier dato (para "actualizado a las"). */
  computedAt: string;
}

/**
 * Calcula los KPIs del dashboard según el ámbito del usuario:
 * - Con `incidents:read`: datos operativos completos.
 * - Público/ciudadano: solo datos difundibles y públicos.
 */
export async function getDashboardKpis(): Promise<DashboardKpis> {
  const backend = getBackend();
  const internal = can('incidents:read');

  const incidents: Incident[] = internal
    ? await backend.incidents.list()
    : await backend.incidents.list({ publicOnly: true });

  const publicAlertsPromise = backend.alerts.list({ scope: 'publico', status: 'publicada' });
  const stationsPromise = backend.stations.list();

  const reportsPromise = can('reports:read')
    ? backend.reports.list()
    : Promise.resolve(null);
  const sensorsPromise = can('sensors:read')
    ? backend.sensors.list()
    : Promise.resolve(null);

  const [publicAlerts, stations, reports, sensors] = await Promise.all([
    publicAlertsPromise, stationsPromise, reportsPromise, sensorsPromise,
  ]);

  const active = incidents.filter((i) => ACTIVE_INCIDENT_STATUSES.includes(i.status));
  const fireActive = active.filter((i) => i.type === 'incendio' || i.type === 'humo');
  const waterActive = active.filter((i) => i.type === 'inundacion' || i.type === 'anegamiento');

  const stationsInAlert = stations.filter(
    (s) => s.currentLevelM >= s.alertLevelM - 0.5,
  ).length;

  return {
    activeIncidents: active.length,
    activeFireIncidents: fireActive.length,
    activeWaterIncidents: waterActive.length,
    reportsPending: reports ? reports.filter((r) => r.status === 'recibido' || r.status === 'en_verificacion').length : null,
    sensorsOnline: sensors ? sensors.filter((s) => s.status === 'online').length : null,
    sensorsTotal: sensors ? sensors.length : null,
    stationsInAlert,
    stationsTotal: stations.length,
    publicAlerts: publicAlerts.length,
    publicIncidents: internal ? incidents.filter((i) => i.publicViewable).length : incidents.length,
    computedAt: new Date().toISOString(),
  };
}

/** Distribución de sensores por estado (derivada). */
export function sensorDistribution(sensors: Sensor[]): { online: number; advertencia: number; silente: number; mantenimiento: number } {
  return {
    online: sensors.filter((s) => s.status === 'online').length,
    advertencia: sensors.filter((s) => s.status === 'advertencia').length,
    silente: sensors.filter((s) => s.status === 'silente').length,
    mantenimiento: sensors.filter((s) => s.status === 'mantenimiento').length,
  };
}

/** Resumen por territorio para el inicio ciudadano (derivado de alertas + estaciones). */
export function territorySummary(
  alerts: { territory: string; severity: string }[],
  stations: StationReadout[],
): Array<{ territory: string; alertCount: number; worstStation?: StationReadout }> {
  const map = new Map<string, { territory: string; alertCount: number; worstStation?: StationReadout }>();
  for (const a of alerts) {
    const entry = map.get(a.territory) ?? { territory: a.territory, alertCount: 0 };
    entry.alertCount++;
    map.set(a.territory, entry);
  }
  for (const st of stations) {
    if (st.state === 'normal') continue;
    const entry = map.get(st.province) ?? { territory: st.province, alertCount: 0 };
    if (!entry.worstStation || st.currentLevelM > entry.worstStation.currentLevelM) {
      entry.worstStation = st;
    }
    map.set(st.province, entry);
  }
  return [...map.values()];
}
