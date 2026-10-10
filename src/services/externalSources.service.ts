/**
 * SERVICIO DE FUENTES EXTERNAS OFICIALES — SMN, INA y NASA FIRMS
 * Orquesta la sincronización de las conexiones con datos verídicos y persiste
 * el estado en Firestore (colecciones 'sources' y 'stations').
 */
import { getBackend } from '@/repositories';
import { recordAudit } from '@/services/audit.service';
import { fetchSmnWeather, type SmnSyncResult } from '@/integrations/smn.adapter';
import { fetchInaHydrology, type InaSyncResult } from '@/integrations/ina.adapter';
import { fetchNasaFirmsHotspots, type FirmsSyncResult } from '@/integrations/nasaFirms.adapter';
import { AUDIT_ACTIONS, type InfoSource } from '@/types/domain';

export interface OfficialSyncReport {
  timestamp: string;
  smn: SmnSyncResult;
  ina: InaSyncResult;
  firms: FirmsSyncResult;
}

/**
 * Sincroniza la fuente meteorológica del Servicio Meteorológico Nacional (SMN).
 */
export async function syncSmnSource(): Promise<SmnSyncResult> {
  const result = await fetchSmnWeather();

  const sources = await getBackend().sources.list();
  const smnSource = sources.find((s) => s.code === 'SMN-RED' || s.name.includes('Meteorológico'));

  if (smnSource) {
    await getBackend().sources.update(smnSource.id, {
      status: result.success ? 'conectada' : 'error',
      lastSyncAt: result.syncedAt,
      notes: result.providerNote,
    });
  }

  await recordAudit({
    action: AUDIT_ACTIONS.sourceChanged,
    targetType: 'source',
    targetId: 'SMN-RED',
    details: `Sincronización SMN: ${result.observations.length} estaciones relevadas (${result.providerNote}).`,
    visibility: 'operativo',
  });

  return result;
}

/**
 * Sincroniza la fuente hidrológica del Instituto Nacional del Agua (INA)
 * y actualiza los niveles de las estaciones hidrométricas de los ríos Paraná y Paraguay.
 */
export async function syncInaSource(): Promise<InaSyncResult> {
  const result = await fetchInaHydrology();

  // 1. Actualizar estado de la fuente INA-SINA
  const sources = await getBackend().sources.list();
  const inaSource = sources.find((s) => s.code === 'INA-SINA' || s.name.includes('Nacional del Agua'));

  if (inaSource) {
    await getBackend().sources.update(inaSource.id, {
      status: result.success ? 'conectada' : 'error',
      lastSyncAt: result.syncedAt,
      notes: result.providerNote,
    });
  }

  // 2. Actualizar las cotas de las estaciones hidrométricas en Firestore
  if (result.success && result.ports.length > 0) {
    const existingStations = await getBackend().stations.list();

    for (const port of result.ports) {
      const match = existingStations.find((s) => s.code === port.code || s.name.includes(port.name));
      if (match) {
        await getBackend().stations.update(match.id, {
          currentLevelM: port.currentLevelM,
          trendCmPerHour: port.trendCmPerHour,
          sourceType: 'adaptador',
          sourceRef: 'INA-SINA',
          updatedAt: port.updatedAt,
        });
      }
    }
  }

  await recordAudit({
    action: AUDIT_ACTIONS.sourceChanged,
    targetType: 'source',
    targetId: 'INA-SINA',
    details: `Sincronización INA: ${result.ports.length} estaciones portuarias actualizadas en tiempo real.`,
    visibility: 'operativo',
  });

  return result;
}

/**
 * Sincroniza los focos de calor satelitales con NASA FIRMS (VIIRS/MODIS).
 */
export async function syncNasaFirmsSource(): Promise<FirmsSyncResult> {
  const result = await fetchNasaFirmsHotspots();

  const sources = await getBackend().sources.list();
  const firmsSource = sources.find((s) => s.code === 'NASA-FIRMS' || s.name.includes('FIRMS'));

  if (firmsSource) {
    await getBackend().sources.update(firmsSource.id, {
      status: result.success ? 'conectada' : 'error',
      lastSyncAt: result.syncedAt,
      notes: result.providerNote,
    });
  }

  await recordAudit({
    action: AUDIT_ACTIONS.sourceChanged,
    targetType: 'source',
    targetId: 'NASA-FIRMS',
    details: `Sincronización NASA FIRMS: ${result.totalActiveSpots} anomalías térmicas en Bounding Box NEA (~${result.estimatedAreaHa} ha).`,
    visibility: 'operativo',
  });

  return result;
}

/**
 * Sincronización completa de las tres fuentes oficiales en paralelo.
 */
export async function syncAllOfficialSources(): Promise<OfficialSyncReport> {
  const [smn, ina, firms] = await Promise.all([
    syncSmnSource(),
    syncInaSource(),
    syncNasaFirmsSource(),
  ]);

  return {
    timestamp: new Date().toISOString(),
    smn,
    ina,
    firms,
  };
}
