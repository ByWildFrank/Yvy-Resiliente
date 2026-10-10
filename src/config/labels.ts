/**
 * Etiquetas de presentación centralizadas (ES). Evita duplicar reglas de texto en las vistas.
 */
import type {
  AlertScope, AlertSeverity, AlertStatus, AlertType, IncidentStatus, IncidentType,
  OrganizationType, Priority, ReportStatus, ReportType, Role, SensorStatus, SensorType,
  Specialty, StationState, SourceStatus, SourceType,
} from '@/types/domain';

export const LABELS = {
  role: {
    ciudadano: 'Ciudadano',
    agente: 'Agente',
    admin: 'Administrador',
  } as Record<Role, string>,
  specialty: {
    meteorologia: 'Meteorología',
    bomberos: 'Bomberos',
    hidrica_ambiental: 'Gestión hídrica y ambiental',
    gobierno_defensa: 'Gobierno / Defensa Civil',
    analista: 'Analista territorial',
  } as Record<Specialty, string>,
  incidentType: {
    incendio: 'Incendio',
    inundacion: 'Inundación',
    anegamiento: 'Anegamiento',
    humo: 'Humo / visibilidad',
    otro: 'Otro',
  } as Record<IncidentType, string>,
  incidentStatus: {
    deteccion: 'Detección',
    reportado: 'Reportado',
    en_verificacion: 'En verificación',
    confirmado: 'Confirmado',
    en_gestion: 'En gestión',
    controlado: 'Controlado',
    cerrado: 'Cerrado',
    descartado: 'Descartado',
  } as Record<IncidentStatus, string>,
  priority: {
    baja: 'Baja', media: 'Media', alta: 'Alta', critica: 'Crítica',
  } as Record<Priority, string>,
  reportType: {
    incendio: 'Incendio',
    humo: 'Humo',
    inundacion: 'Inundación',
    anegamiento: 'Anegamiento / calle anegada',
    camino_bloqueado: 'Camino bloqueado',
    otro: 'Otro',
  } as Record<ReportType, string>,
  reportStatus: {
    recibido: 'Recibido',
    en_verificacion: 'En verificación',
    confirmado: 'Confirmado',
    descartado: 'Descartado',
    cerrado: 'Cerrado',
  } as Record<ReportStatus, string>,
  alertType: {
    incendio: 'Incendios', hidrica: 'Hídrica', meteorologica: 'Meteorológica', general: 'General',
  } as Record<AlertType, string>,
  alertSeverity: {
    info: 'Información', aviso: 'Aviso', alerta: 'Alerta', emergencia: 'Emergencia',
  } as Record<AlertSeverity, string>,
  alertStatus: {
    borrador: 'Borrador', publicada: 'Publicada', cancelada: 'Cancelada', expirada: 'Expirada',
  } as Record<AlertStatus, string>,
  alertScope: {
    publico: 'Pública', operativo: 'Operativa',
  } as Record<AlertScope, string>,
  sensorType: {
    hidrometrico: 'Hidrométrico', pluvio: 'Pluviométrico', meteo: 'Meteorológico',
    humedad_suelo: 'Humedad de suelo', otro: 'Otro',
  } as Record<SensorType, string>,
  sensorStatus: {
    online: 'En línea', advertencia: 'Advertencia', silente: 'Silente', mantenimiento: 'Mantenimiento',
  } as Record<SensorStatus, string>,
  stationState: {
    normal: 'Normal', aviso: 'Aviso', alerta: 'Alerta', evacuacion: 'Evacuación',
  } as Record<StationState, string>,
  sourceType: {
    satelital: 'Satelital', meteorologica: 'Meteorológica', hidrologica: 'Hidrológica',
    sensorial: 'Sensores', oficial: 'Oficial',
  } as Record<SourceType, string>,
  sourceStatus: {
    conectada: 'Conectada', pendiente: 'Pendiente de integración', error: 'Error', desactivada: 'Desactivada',
  } as Record<SourceStatus, string>,
  orgType: {
    bomberos: 'Bomberos', defensa_civil: 'Defensa Civil', municipalidad: 'Municipalidad',
    provincial: 'Provincia', hidrica: 'Organismo hídrico', ambiental: 'Organismo ambiental', otro: 'Otro',
  } as Record<OrganizationType, string>,
} as const;

/** Formatea una marca ISO en hora local con fecha corta. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
}

export function formatTimeAgo(iso: string | null | undefined): string {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return '—';
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'hace instantes';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
}

export function ageMs(iso: string | null | undefined): number | undefined {
  if (!iso) return undefined;
  const ms = Date.now() - new Date(iso).getTime();
  return Number.isNaN(ms) ? undefined : ms;
}
