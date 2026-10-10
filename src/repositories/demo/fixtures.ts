/**
 * FIXTURES DEMO — datos de demostración del modo demo.
 *
 * ⚠️ DATOS NO REALES: escenario ficticio para desarrollo y demostación.
 * Solo se cargan cuando el adaptador demo está activo (VITE_DATA_MODE=demo)
 * y la interfaz lo declara con el badge "MODO DEMO".
 * Nunca se mezclan con datos operativos ni simulan proveedores externos:
 * las fuentes externas figuran como "pendiente de integración".
 */
import type {
  Alert, AppSettings, AuditEntry, CitizenReport, HydroStation, Incident,
  InfoSource, Organization, Sensor, UserAccount,
} from '@/types/domain';

const now = () => new Date().toISOString();
const minutesAgo = (m: number) => new Date(Date.now() - m * 60000).toISOString();
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

export interface DemoUserAccount extends UserAccount {
  /** Solo existe en el almacén demo para poder iniciar sesión sin Firebase. */
  password: string;
}

// ─── Organismos ─────────────────────────────────────────────────────────────

export const demoOrganizations: Organization[] = [
  { id: 'org-bomberos-ctes', name: 'Bomberos Voluntarios de Corrientes', type: 'bomberos', territory: 'Corrientes Capital', contact: 'cuartel@bomberosctes.demo', active: true, createdAt: daysAgo(400), updatedAt: daysAgo(30) },
  { id: 'org-defensa-civil', name: 'Defensa Civil Corrientes', type: 'defensa_civil', territory: 'Provincia de Corrientes', contact: 'operaciones@defensacivil.demo', active: true, createdAt: daysAgo(400), updatedAt: daysAgo(30) },
  { id: 'org-apa-chaco', name: 'Administración Provincial del Agua (Chaco)', type: 'hidrica', territory: 'Provincia del Chaco', contact: 'hidrica@apa.demo', active: true, createdAt: daysAgo(400), updatedAt: daysAgo(60) },
  { id: 'org-muni-resistencia', name: 'Municipalidad de Resistencia', type: 'municipalidad', territory: 'Resistencia, Chaco', contact: 'gestion@mresistencia.demo', active: true, createdAt: daysAgo(400), updatedAt: daysAgo(15) },
];

// ─── Usuarios demo (contraseñas visibles en la pantalla de login) ───────────

const AGENT_BASE_PERMS = [
  'incidents:read', 'incidents:create', 'incidents:verify',
  'reports:read', 'reports:verify', 'alerts:read',
  'sensors:read', 'sources:read', 'hydrology:read', 'history:read',
] as const;

export const demoUsers: DemoUserAccount[] = [
  {
    uid: 'u-ciudadano', email: 'ciudadano@demo.yvy', displayName: 'Vecina Demo',
    role: 'ciudadano', organizationId: null, specialties: [], permissions: [],
    active: true, createdAt: daysAgo(90), updatedAt: daysAgo(90), password: 'demo1234',
  },
  {
    uid: 'u-bomberos', email: 'bomberos@demo.yvy', displayName: 'Sargento Ramírez',
    role: 'agente', organizationId: 'org-bomberos-ctes', specialties: ['bomberos'],
    permissions: [...AGENT_BASE_PERMS, 'scenarios:run', 'informes:generate'],
    active: true, createdAt: daysAgo(200), updatedAt: daysAgo(10), password: 'demo1234',
  },
  {
    uid: 'u-hidrica', email: 'hidrica@demo.yvy', displayName: 'Ing. Pérez',
    role: 'agente', organizationId: 'org-apa-chaco', specialties: ['hidrica_ambiental'],
    permissions: [...AGENT_BASE_PERMS, 'sensors:manage', 'scenarios:run'],
    active: true, createdAt: daysAgo(200), updatedAt: daysAgo(10), password: 'demo1234',
  },
  {
    uid: 'u-coordinador', email: 'coordinador@demo.yvy', displayName: 'Coordinadora Ojeda',
    role: 'agente', organizationId: 'org-defensa-civil', specialties: ['gobierno_defensa'],
    permissions: [...AGENT_BASE_PERMS, 'alerts:publish', 'scenarios:run', 'informes:generate'],
    active: true, createdAt: daysAgo(300), updatedAt: daysAgo(5), password: 'demo1234',
  },
  {
    uid: 'u-analista', email: 'analista@demo.yvy', displayName: 'Analista Fernández',
    role: 'agente', organizationId: 'org-defensa-civil', specialties: ['analista'],
    permissions: [
      'incidents:read', 'reports:read', 'alerts:read', 'sensors:read', 'sources:read',
      'hydrology:read', 'history:read', 'scenarios:run', 'informes:generate',
    ],
    active: true, createdAt: daysAgo(300), updatedAt: daysAgo(5), password: 'demo1234',
  },
  {
    uid: 'u-admin', email: 'admin@demo.yvy', displayName: 'Administradora Técnica',
    role: 'admin', organizationId: null, specialties: [],
    // Admin técnico: SIN permisos institucionales (no publica alertas ni verifica incidentes).
    permissions: [
      'users:read', 'users:manage', 'orgs:read', 'orgs:manage',
      'sources:read', 'sources:manage', 'sensors:read', 'sensors:manage',
      'audit:read', 'settings:read', 'settings:manage', 'integrations:read', 'history:read',
    ],
    active: true, createdAt: daysAgo(500), updatedAt: daysAgo(3), password: 'demo1234',
  },
];

// ─── Incidentes ──────────────────────────────────────────────────────────────

export const demoIncidents: Incident[] = [
  {
    id: 'inc-001', code: 'INC-2026-014', type: 'incendio', status: 'confirmado', priority: 'critica',
    description: 'Foco activo sobre pastizal inundable con avance hacia el sur, en las inmediaciones del Portal Laguna Galarza. Humo visible desde la RP 41.',
    location: { lat: -28.2422, lng: -57.4383, label: 'Paraje Galarza, Depto. Mercedes, Corrientes' },
    sourceType: 'reporte_ciudadano', sourceRef: 'REP-2026-0902', areaHa: 420, levelM: null,
    organizationId: 'org-bomberos-ctes', assignedTo: 'u-bomberos', createdBy: 'u-bomberos',
    createdAt: minutesAgo(220), observedAt: minutesAgo(235), updatedAt: minutesAgo(15),
    publicViewable: true,
    history: [
      { at: minutesAgo(220), actorId: 'u-bomberos', actorName: 'Sargento Ramírez', from: null, to: 'reportado', note: 'Ingreso por reporte ciudadano REP-2026-0902' },
      { at: minutesAgo(180), actorId: 'u-bomberos', actorName: 'Sargento Ramírez', from: 'reportado', to: 'en_verificacion', note: 'Reconocimiento en curso' },
      { at: minutesAgo(15), actorId: 'u-bomberos', actorName: 'Sargento Ramírez', from: 'en_verificacion', to: 'confirmado', note: 'Confirmado por cuadrilla en campo' },
    ],
  },
  {
    id: 'inc-002', code: 'INC-2026-011', type: 'incendio', status: 'en_gestion', priority: 'alta',
    description: 'Foco secundario en cuenca del Bañado Carambola, en contención por brigada local.',
    location: { lat: -27.9833, lng: -57.5833, label: 'San Miguel, Corrientes' },
    sourceType: 'operador', sourceRef: null, areaHa: 85, levelM: null,
    organizationId: 'org-bomberos-ctes', assignedTo: 'u-bomberos', createdBy: 'u-coordinador',
    createdAt: minutesAgo(400), observedAt: minutesAgo(410), updatedAt: minutesAgo(60),
    publicViewable: true,
    history: [
      { at: minutesAgo(400), actorId: 'u-coordinador', actorName: 'Coordinadora Ojeda', from: null, to: 'deteccion', note: 'Detección registrada por observador' },
      { at: minutesAgo(300), actorId: 'u-coordinador', actorName: 'Coordinadora Ojeda', from: 'deteccion', to: 'confirmado', note: 'Verificación con imágenes' },
      { at: minutesAgo(60), actorId: 'u-bomberos', actorName: 'Sargento Ramírez', from: 'confirmado', to: 'en_gestion', note: 'Brigada trabajando en perímetro' },
    ],
  },
  {
    id: 'inc-003', code: 'INC-2026-009', type: 'inundacion', status: 'en_gestion', priority: 'alta',
    description: 'Crecida del río Paraná con afectación de zonas ribereñas frente a Paso de la Patria. Ganado costero reubicado de forma preventiva.',
    location: { lat: -27.3167, lng: -58.6167, label: 'Paso de la Patria, Corrientes' },
    sourceType: 'sensor', sourceRef: 'H-01', areaHa: null, levelM: 5.7,
    organizationId: 'org-defensa-civil', assignedTo: 'u-coordinador', createdBy: 'u-hidrica',
    createdAt: minutesAgo(600), observedAt: minutesAgo(600), updatedAt: minutesAgo(90),
    publicViewable: true,
    history: [
      { at: minutesAgo(600), actorId: 'u-hidrica', actorName: 'Ing. Pérez', from: null, to: 'reportado', note: 'Umbral de alerta superado en estación H-01' },
      { at: minutesAgo(500), actorId: 'u-coordinador', actorName: 'Coordinadora Ojeda', from: 'reportado', to: 'confirmado', note: 'Confirmado por relevamiento costero' },
      { at: minutesAgo(90), actorId: 'u-coordinador', actorName: 'Coordinadora Ojeda', from: 'confirmado', to: 'en_gestion', note: 'Coordinación de reubicación de ganado' },
    ],
  },
  {
    id: 'inc-004', code: 'INC-2026-006', type: 'anegamiento', status: 'en_verificacion', priority: 'media',
    description: 'Anegamiento urbano en avenida principal con posible obstrucción de conducto pluvial. Tránsito dificultoso.',
    location: { lat: -27.4511, lng: -58.9867, label: 'Resistencia, Chaco' },
    sourceType: 'reporte_ciudadano', sourceRef: 'REP-2026-0875', areaHa: null, levelM: 0.35,
    organizationId: 'org-muni-resistencia', assignedTo: null, createdBy: 'u-ciudadano',
    createdAt: minutesAgo(120), observedAt: minutesAgo(130), updatedAt: minutesAgo(120),
    publicViewable: false,
    history: [
      { at: minutesAgo(120), actorId: 'u-coordinador', actorName: 'Coordinadora Ojeda', from: null, to: 'en_verificacion', note: 'Derivado a municipio para inspección de drenaje' },
    ],
  },
  {
    id: 'inc-005', code: 'INC-2026-004', type: 'humo', status: 'descartado', priority: 'baja',
    description: 'Columna de humo reportada sobre banquina de RP 5. Verificación: quema controlada autorizada.',
    location: { lat: -27.4847, lng: -58.7042, label: 'RP 5 km 14, Corrientes' },
    sourceType: 'reporte_ciudadano', sourceRef: 'REP-2026-0860', areaHa: null, levelM: null,
    organizationId: 'org-bomberos-ctes', assignedTo: 'u-bomberos', createdBy: 'u-ciudadano',
    createdAt: minutesAgo(700), observedAt: minutesAgo(710), updatedAt: minutesAgo(600),
    publicViewable: false,
    history: [
      { at: minutesAgo(700), actorId: 'u-bomberos', actorName: 'Sargento Ramírez', from: null, to: 'en_verificacion' },
      { at: minutesAgo(600), actorId: 'u-bomberos', actorName: 'Sargento Ramírez', from: 'en_verificacion', to: 'descartado', note: 'Quema autorizada con permiso vigente' },
    ],
  },
  {
    id: 'inc-006', code: 'INC-2026-002', type: 'incendio', status: 'controlado', priority: 'media',
    description: 'Foco de pastizal en banquina, controlado por dotación caminera.',
    location: { lat: -28.0500, lng: -57.9500, label: 'RN 12 km 1024, Riachuelo, Corrientes' },
    sourceType: 'operador', sourceRef: null, areaHa: 18, levelM: null,
    organizationId: 'org-bomberos-ctes', assignedTo: 'u-bomberos', createdBy: 'u-coordinador',
    createdAt: minutesAgo(900), observedAt: minutesAgo(910), updatedAt: minutesAgo(800),
    publicViewable: true,
    history: [
      { at: minutesAgo(900), actorId: 'u-coordinador', actorName: 'Coordinadora Ojeda', from: null, to: 'deteccion' },
      { at: minutesAgo(880), actorId: 'u-bomberos', actorName: 'Sargento Ramírez', from: 'deteccion', to: 'confirmado' },
      { at: minutesAgo(800), actorId: 'u-bomberos', actorName: 'Sargento Ramírez', from: 'confirmado', to: 'controlado', note: 'Perímetro asegurado' },
    ],
  },
];

// ─── Reportes ciudadanos ────────────────────────────────────────────────────

export const demoReports: CitizenReport[] = [
  {
    id: 'rep-001', code: 'REP-2026-0902', type: 'incendio',
    description: 'Columna de humo densa blanca-grisácea con llamas visibles sobre pajonal alto, cerca del portal de la reserva.',
    location: { lat: -28.2028, lng: -57.4778, label: 'Paraje Galarza' },
    photoUrl: null, status: 'confirmado',
    createdBy: 'u-ciudadano', createdByName: 'Vecina Demo', incidentId: 'inc-001',
    resolutionNote: 'Confirmado por brigada; derivado a incidente INC-2026-014.',
    createdAt: minutesAgo(235), updatedAt: minutesAgo(15),
    verifiedBy: 'u-bomberos', verifiedAt: minutesAgo(15),
    timeline: [
      { at: minutesAgo(235), actorId: 'u-ciudadano', actorName: 'Vecina Demo', status: 'recibido' },
      { at: minutesAgo(200), actorId: 'u-bomberos', actorName: 'Sargento Ramírez', status: 'en_verificacion', note: 'Se envía reconocimiento' },
      { at: minutesAgo(15), actorId: 'u-bomberos', actorName: 'Sargento Ramírez', status: 'confirmado', note: 'Derivado a incidente INC-2026-014' },
    ],
  },
  {
    id: 'rep-002', code: 'REP-2026-0875', type: 'anegamiento',
    description: 'Agua sobre calzada en la avenida principal; los colectivos urbanos no pueden pasar.',
    location: { lat: -27.4500, lng: -58.9900, label: 'Av. Soberanía Nacional, Resistencia' },
    photoUrl: null, status: 'en_verificacion',
    createdBy: 'u-ciudadano', createdByName: 'Vecina Demo', incidentId: 'inc-004',
    resolutionNote: null,
    createdAt: minutesAgo(130), updatedAt: minutesAgo(120),
    verifiedBy: null, verifiedAt: null,
    timeline: [
      { at: minutesAgo(130), actorId: 'u-ciudadano', actorName: 'Vecina Demo', status: 'recibido' },
      { at: minutesAgo(120), actorId: 'u-coordinador', actorName: 'Coordinadora Ojeda', status: 'en_verificacion', note: 'Derivado a municipio' },
    ],
  },
  {
    id: 'rep-003', code: 'REP-2026-0860', type: 'humo',
    description: 'Humo denso en banquina que reduce la visibilidad sobre la ruta provincial.',
    location: { lat: -27.4847, lng: -58.7042, label: 'RP 5 km 14' },
    photoUrl: null, status: 'descartado',
    createdBy: 'u-ciudadano', createdByName: 'Vecina Demo', incidentId: 'inc-005',
    resolutionNote: 'Quema controlada autorizada.',
    createdAt: minutesAgo(710), updatedAt: minutesAgo(600),
    verifiedBy: 'u-bomberos', verifiedAt: minutesAgo(600),
    timeline: [
      { at: minutesAgo(710), actorId: 'u-ciudadano', actorName: 'Vecina Demo', status: 'recibido' },
      { at: minutesAgo(680), actorId: 'u-bomberos', actorName: 'Sargento Ramírez', status: 'en_verificacion' },
      { at: minutesAgo(600), actorId: 'u-bomberos', actorName: 'Sargento Ramírez', status: 'descartado', note: 'Quema autorizada' },
    ],
  },
  {
    id: 'rep-004', code: 'REP-2026-0851', type: 'inundacion',
    description: 'Animales aislados por el repunte del río en zona de islas; se solicita apoyo para retirar ganado.',
    location: { lat: -27.3125, lng: -58.6528, label: 'Isla Soto' },
    photoUrl: null, status: 'cerrado',
    createdBy: 'u-ciudadano', createdByName: 'Vecina Demo', incidentId: 'inc-003',
    resolutionNote: 'Retiro de 40 cabezas completado con barcaza.',
    createdAt: minutesAgo(800), updatedAt: minutesAgo(300),
    verifiedBy: 'u-coordinador', verifiedAt: minutesAgo(650),
    timeline: [
      { at: minutesAgo(800), actorId: 'u-ciudadano', actorName: 'Vecina Demo', status: 'recibido' },
      { at: minutesAgo(750), actorId: 'u-coordinador', actorName: 'Coordinadora Ojeda', status: 'en_verificacion' },
      { at: minutesAgo(650), actorId: 'u-coordinador', actorName: 'Coordinadora Ojeda', status: 'confirmado', note: 'Asignado a incidente INC-2026-009' },
      { at: minutesAgo(300), actorId: 'u-coordinador', actorName: 'Coordinadora Ojeda', status: 'cerrado', note: 'Ganado reubicado' },
    ],
  },
  {
    id: 'rep-005', code: 'REP-2026-0918', type: 'camino_bloqueado',
    description: 'Camino rural con árbol caído que bloquea el paso a la escuela rural.',
    location: { lat: -28.5100, lng: -57.7400, label: 'Camino rural, Depto. San Martín' },
    photoUrl: null, status: 'recibido',
    createdBy: 'u-ciudadano', createdByName: 'Vecina Demo', incidentId: null,
    resolutionNote: null,
    createdAt: minutesAgo(25), updatedAt: minutesAgo(25),
    verifiedBy: null, verifiedAt: null,
    timeline: [
      { at: minutesAgo(25), actorId: 'u-ciudadano', actorName: 'Vecina Demo', status: 'recibido' },
    ],
  },
];

// ─── Alertas ────────────────────────────────────────────────────────────────

export const demoAlerts: Alert[] = [
  {
    id: 'al-001', code: 'AL-2026-003', type: 'incendio', severity: 'alerta',
    title: 'Alerta por incendio activo en Esteros del Iberá',
    message: 'Incendio confirmado en zona de pastizales del Portal Galarza. Se recomienda evitar la RP 41 y seguir indicaciones de las autoridades.',
    instructions: 'Evite acercarse al área de humo. Cierre de RP 41 en evaluación.',
    scope: 'publico', status: 'publicada', territory: 'Mercedes, Corrientes', source: 'Defensa Civil Corrientes',
    validFrom: minutesAgo(180), validUntil: null,
    publishedBy: 'u-coordinador', publishedAt: minutesAgo(180),
    createdAt: minutesAgo(200), updatedAt: minutesAgo(180),
  },
  {
    id: 'al-002', code: 'AL-2026-002', type: 'hidrica', severity: 'aviso',
    title: 'Aviso hidrológico: crecida del río Paraná',
    message: 'Nivel del Paraná en ascenso en Paso de la Patria y Puerto Corrientes. Población ribereña atenta a indicaciones.',
    instructions: 'Retire botes y equipos de la costa. Ganado: reubicación preventiva.',
    scope: 'publico', status: 'publicada', territory: 'Corrientes Capital / Paso de la Patria', source: 'Defensa Civil Corrientes',
    validFrom: minutesAgo(400), validUntil: null,
    publishedBy: 'u-coordinador', publishedAt: minutesAgo(400),
    createdAt: minutesAgo(420), updatedAt: minutesAgo(400),
  },
  {
    id: 'al-003', code: 'AL-2026-004', type: 'meteorologica', severity: 'info',
    title: 'Información: ráfagas de viento del noreste',
    message: 'Ráfagas previstas del sector NE que favorecen la propagación de fuegos existentes en pastizales.',
    instructions: null,
    scope: 'operativo', status: 'publicada', territory: 'Iberá / San Miguel', source: 'Observación operativa',
    validFrom: minutesAgo(120), validUntil: null,
    publishedBy: 'u-coordinador', publishedAt: minutesAgo(120),
    createdAt: minutesAgo(130), updatedAt: minutesAgo(120),
  },
  {
    id: 'al-004', code: 'AL-2026-005', type: 'general', severity: 'aviso',
    title: 'Borrador: corte preventivo de RP 41',
    message: 'En evaluación el corte preventivo del tramo RP 41 km 8-18 por humo denso.',
    instructions: null,
    scope: 'operativo', status: 'borrador', territory: 'Mercedes, Corrientes', source: 'Defensa Civil Corrientes',
    validFrom: minutesAgo(60), validUntil: null,
    publishedBy: null, publishedAt: null,
    createdAt: minutesAgo(60), updatedAt: minutesAgo(60),
  },
];

// ─── Sensores ───────────────────────────────────────────────────────────────

export const demoSensors: Sensor[] = [
  { id: 'sen-001', code: 'NODE-01', name: 'Boya hidrométrica Paso de la Patria', type: 'hidrometrico', variable: 'Nivel de agua', unit: 'm', protocol: 'LoRaWAN', status: 'online', battery: 94, rssi: -84, lastPayloadAt: minutesAgo(3), location: { lat: -27.3167, lng: -58.6167, label: 'Paso de la Patria' }, organizationId: 'org-apa-chaco', active: true, createdAt: daysAgo(400), updatedAt: minutesAgo(3) },
  { id: 'sen-002', code: 'NODE-02', name: 'Radar de nivel Puerto Corrientes', type: 'hidrometrico', variable: 'Nivel de agua', unit: 'm', protocol: 'LTE-M', status: 'online', battery: 98, rssi: -72, lastPayloadAt: minutesAgo(1), location: { lat: -27.4692, lng: -58.8344, label: 'Puerto Corrientes' }, organizationId: 'org-apa-chaco', active: true, createdAt: daysAgo(400), updatedAt: minutesAgo(1) },
  { id: 'sen-003', code: 'NODE-03', name: 'Sensor hidrostático Barranqueras', type: 'hidrometrico', variable: 'Nivel de agua', unit: 'm', protocol: 'LoRaWAN', status: 'online', battery: 89, rssi: -88, lastPayloadAt: minutesAgo(4), location: { lat: -27.4833, lng: -58.9167, label: 'Barranqueras' }, organizationId: 'org-apa-chaco', active: true, createdAt: daysAgo(380), updatedAt: minutesAgo(4) },
  { id: 'sen-004', code: 'NODE-04', name: 'Boya Bañado Carambola', type: 'hidrometrico', variable: 'Nivel y conductividad', unit: 'm / µS', protocol: 'LoRaWAN', status: 'silente', battery: 28, rssi: -118, lastPayloadAt: minutesAgo(52), location: { lat: -28.0667, lng: -57.7000, label: 'Bañado Carambola' }, organizationId: 'org-apa-chaco', active: true, createdAt: daysAgo(350), updatedAt: minutesAgo(52) },
  { id: 'sen-005', code: 'NODE-05', name: 'Estación meteorológica Pellegrini', type: 'meteo', variable: 'Viento / HR / Temp', unit: 'km/h / % / °C', protocol: 'Satelital', status: 'online', battery: 91, rssi: -65, lastPayloadAt: minutesAgo(2), location: { lat: -28.5333, lng: -57.1667, label: 'Colonia Carlos Pellegrini' }, organizationId: 'org-defensa-civil', active: true, createdAt: daysAgo(300), updatedAt: minutesAgo(2) },
  { id: 'sen-006', code: 'NODE-06', name: 'Humedad de suelo San Miguel', type: 'humedad_suelo', variable: 'Humedad de suelo', unit: '%', protocol: 'LoRaWAN', status: 'advertencia', battery: 42, rssi: -99, lastPayloadAt: minutesAgo(11), location: { lat: -27.9833, lng: -57.5833, label: 'San Miguel' }, organizationId: 'org-bomberos-ctes', active: true, createdAt: daysAgo(280), updatedAt: minutesAgo(11) },
];

// ─── Estaciones hidrométricas de referencia ────────────────────────────────

export const demoStations: HydroStation[] = [
  { id: 'st-001', code: 'H-01', name: 'Paso de la Patria', river: 'Río Paraná', province: 'Corrientes', location: { lat: -27.3167, lng: -58.6167, label: 'Paso de la Patria' }, currentLevelM: 5.7, alertLevelM: 6.5, evacLevelM: 7.0, trendCmPerHour: 4, sourceType: 'manual', sourceRef: 'sen-001', updatedAt: minutesAgo(20), active: true },
  { id: 'st-002', code: 'H-02', name: 'Puerto Corrientes', river: 'Río Paraná', province: 'Corrientes', location: { lat: -27.4692, lng: -58.8344, label: 'Puerto Corrientes' }, currentLevelM: 5.82, alertLevelM: 6.5, evacLevelM: 7.0, trendCmPerHour: 3, sourceType: 'manual', sourceRef: 'sen-002', updatedAt: minutesAgo(25), active: true },
  { id: 'st-003', code: 'H-03', name: 'Barranqueras', river: 'Río Paraná / Riacho', province: 'Chaco', location: { lat: -27.4833, lng: -58.9167, label: 'Barranqueras' }, currentLevelM: 5.6, alertLevelM: 6.0, evacLevelM: 6.5, trendCmPerHour: 4, sourceType: 'manual', sourceRef: 'sen-003', updatedAt: minutesAgo(15), active: true },
  { id: 'st-004', code: 'H-04', name: 'Isla del Cerrito', river: 'Confluencia Paraná-Paraguay', province: 'Chaco', location: { lat: -27.2667, lng: -58.6333, label: 'Isla del Cerrito' }, currentLevelM: 5.4, alertLevelM: 5.8, evacLevelM: 6.3, trendCmPerHour: 5, sourceType: 'manual', sourceRef: null, updatedAt: minutesAgo(45), active: true },
  { id: 'st-005', code: 'H-05', name: 'Empedrado', river: 'Río Paraná Medio', province: 'Corrientes', location: { lat: -27.95, lng: -58.7, label: 'Empedrado' }, currentLevelM: 4.95, alertLevelM: 6.0, evacLevelM: 6.8, trendCmPerHour: 2, sourceType: 'manual', sourceRef: null, updatedAt: minutesAgo(70), active: true },
];

// ─── Fuentes de información (registro honesto) ──────────────────────────────

export const demoSources: InfoSource[] = [
  {
    id: 'src-001', code: 'SRC-INT-01', name: 'Registro interno de incidentes', provider: 'Yvy (propio)',
    type: 'oficial', status: 'conectada', coverage: 'Corrientes y Chaco',
    variables: ['incidentes', 'reportes', 'alertas'], units: null,
    lastSyncAt: now(), notes: 'Almacén propio de la plataforma.',
    requiresEnv: [], createdAt: daysAgo(400), updatedAt: now(),
  },
  {
    id: 'src-002', code: 'SRC-INT-02', name: 'Telemetría de sensores registrados', provider: 'Yvy (propio)',
    type: 'sensorial', status: 'conectada', coverage: 'Red registrada en la plataforma',
    variables: ['nivel de agua', 'humedad de suelo', 'viento'], units: 'm / % / km/h',
    lastSyncAt: minutesAgo(3), notes: 'Lecturas reportadas por dispositivos registrados.',
    requiresEnv: [], createdAt: daysAgo(400), updatedAt: minutesAgo(3),
  },
  {
    id: 'src-003', code: 'SRC-FIRMS', name: 'Focos térmicos satelitales (VIIRS/MODIS)',
    provider: 'NASA FIRMS (pendiente de convenio)', type: 'satelital', status: 'pendiente',
    coverage: 'Regional', variables: ['focos térmicos', 'FRP', 'confianza'], units: 'MW / %',
    lastSyncAt: null,
    notes: 'Requiere definir mecanismo de acceso (API MAP_KEY) y condiciones de uso.',
    requiresEnv: ['VITE_FIRMS_MAP_KEY'], createdAt: daysAgo(100), updatedAt: daysAgo(100),
  },
  {
    id: 'src-004', code: 'SRC-SMN', name: 'Observaciones meteorológicas oficiales',
    provider: 'Servicio Meteorológico Nacional (pendiente)', type: 'meteorologica', status: 'pendiente',
    coverage: 'Argentina', variables: ['temperatura', 'HR', 'viento', 'precipitación'], units: '°C / % / km/h / mm',
    lastSyncAt: null, notes: 'Requiere credenciales y validación de disponibilidad del servicio.',
    requiresEnv: ['VITE_SMN_API_URL', 'VITE_SMN_API_KEY'], createdAt: daysAgo(100), updatedAt: daysAgo(100),
  },
  {
    id: 'src-005', code: 'SRC-HIDRO', name: 'Red hidrométrica oficial (INA / Prefectura)',
    provider: 'INA / Prefectura Naval (pendiente)', type: 'hidrologica', status: 'pendiente',
    coverage: 'Cuenca del Paraná', variables: ['altura hidrométrica'], units: 'm',
    lastSyncAt: null, notes: 'Hasta conectar el adaptador, las estaciones se actualizan por carga manual.',
    requiresEnv: ['VITE_HYDRO_API_URL'], createdAt: daysAgo(100), updatedAt: daysAgo(100),
  },
];

// ─── Auditoría sembrada ─────────────────────────────────────────────────────

export const demoAudit: AuditEntry[] = [
  { id: 'aud-001', at: minutesAgo(15), actorId: 'u-bomberos', actorName: 'Sargento Ramírez', action: 'report.verified', targetType: 'report', targetId: 'REP-2026-0902', details: 'Reporte confirmado y derivado a INC-2026-014', visibility: 'operativo' },
  { id: 'aud-002', at: minutesAgo(60), actorId: 'u-bomberos', actorName: 'Sargento Ramírez', action: 'incident.status_changed', targetType: 'incident', targetId: 'INC-2026-011', details: 'confirmado → en_gestion', visibility: 'operativo' },
  { id: 'aud-003', at: minutesAgo(180), actorId: 'u-coordinador', actorName: 'Coordinadora Ojeda', action: 'alert.published', targetType: 'alert', targetId: 'AL-2026-003', details: 'Alerta pública de incendio publicada', visibility: 'operativo' },
  { id: 'aud-004', at: minutesAgo(300), actorId: 'u-admin', actorName: 'Administradora Técnica', action: 'admin.user_updated', targetType: 'user', targetId: 'u-analista', details: 'Permisos actualizados (scenarios:run)', visibility: 'admin' },
];

// ─── Configuración ──────────────────────────────────────────────────────────

export const demoSettings: AppSettings = {
  appName: 'Yvy Resiliente',
  regionLabel: 'Corrientes y Chaco',
  demoBannerEnabled: true,
  defaultTerritory: 'Corrientes y Chaco',
  updatedAt: daysAgo(1),
};

/** Estructura completa del almacén demo. */
export interface DemoStoreShape {
  version: number;
  seededAt: string;
  users: DemoUserAccount[];
  organizations: Organization[];
  incidents: Incident[];
  reports: CitizenReport[];
  alerts: Alert[];
  sensors: Sensor[];
  stations: HydroStation[];
  sources: InfoSource[];
  auditLogs: AuditEntry[];
  scenarioRuns: import('@/types/domain').ScenarioRun[];
  settings: AppSettings;
  session: { uid: string } | null;
}
