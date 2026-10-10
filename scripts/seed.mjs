import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAR5mYjXdeSh_zLovCmmllhN8YZ0DSV5uY",
  authDomain: "yvy-resiliente.firebaseapp.com",
  projectId: "yvy-resiliente",
  storageBucket: "yvy-resiliente.firebasestorage.app",
  messagingSenderId: "575158535238",
  appId: "1:575158535238:web:8176bdef39e3640713b647"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const now = new Date().toISOString();
const minutesAgo = (m) => new Date(Date.now() - m * 60000).toISOString();
const daysAgo = (d) => new Date(Date.now() - d * 86400000).toISOString();

const organizations = [
  { id: 'org-bomberos-ctes', name: 'Bomberos Voluntarios de Corrientes', type: 'bomberos', territory: 'Corrientes Capital', contact: 'cuartel@bomberosctes.gob.ar', active: true, createdAt: daysAgo(400), updatedAt: daysAgo(30) },
  { id: 'org-defensa-civil', name: 'Defensa Civil Corrientes', type: 'defensa_civil', territory: 'Provincia de Corrientes', contact: 'operaciones@defensacivil.corrientes.gob.ar', active: true, createdAt: daysAgo(400), updatedAt: daysAgo(30) },
  { id: 'org-apa-chaco', name: 'Administración Provincial del Agua (Chaco)', type: 'hidrica', territory: 'Provincia del Chaco', contact: 'hidrica@apa.chaco.gob.ar', active: true, createdAt: daysAgo(400), updatedAt: daysAgo(60) },
  { id: 'org-muni-resistencia', name: 'Municipalidad de Resistencia', type: 'municipalidad', territory: 'Resistencia, Chaco', contact: 'gestion@resistencia.gob.ar', active: true, createdAt: daysAgo(400), updatedAt: daysAgo(15) },
];

const AGENT_BASE_PERMS = [
  'incidents:read', 'incidents:create', 'incidents:verify',
  'reports:read', 'reports:verify', 'alerts:read',
  'sensors:read', 'sources:read', 'hydrology:read', 'history:read',
];

const users = [
  {
    uid: 'u-ciudadano', email: 'ciudadano@demo.yvy', displayName: 'Vecina Correntina',
    role: 'ciudadano', organizationId: null, specialties: [], permissions: [],
    active: true, createdAt: daysAgo(90), updatedAt: daysAgo(90),
  },
  {
    uid: 'u-bomberos', email: 'bomberos@demo.yvy', displayName: 'Sargento Ramírez',
    role: 'agente', organizationId: 'org-bomberos-ctes', specialties: ['bomberos'],
    permissions: [...AGENT_BASE_PERMS, 'scenarios:run', 'informes:generate'],
    active: true, createdAt: daysAgo(200), updatedAt: daysAgo(10),
  },
  {
    uid: 'u-hidrica', email: 'hidrica@demo.yvy', displayName: 'Ing. Pérez',
    role: 'agente', organizationId: 'org-apa-chaco', specialties: ['hidrica_ambiental'],
    permissions: [...AGENT_BASE_PERMS, 'sensors:manage', 'scenarios:run'],
    active: true, createdAt: daysAgo(200), updatedAt: daysAgo(10),
  },
  {
    uid: 'u-coordinador', email: 'coordinador@demo.yvy', displayName: 'Coordinadora Ojeda',
    role: 'agente', organizationId: 'org-defensa-civil', specialties: ['gobierno_defensa'],
    permissions: [...AGENT_BASE_PERMS, 'alerts:publish', 'scenarios:run', 'informes:generate'],
    active: true, createdAt: daysAgo(300), updatedAt: daysAgo(5),
  },
  {
    uid: 'u-analista', email: 'analista@demo.yvy', displayName: 'Analista Fernández',
    role: 'agente', organizationId: 'org-defensa-civil', specialties: ['analista'],
    permissions: [
      'incidents:read', 'reports:read', 'alerts:read', 'sensors:read', 'sources:read',
      'hydrology:read', 'history:read', 'scenarios:run', 'informes:generate',
    ],
    active: true, createdAt: daysAgo(300), updatedAt: daysAgo(5),
  },
  {
    uid: 'u-admin', email: 'admin@demo.yvy', displayName: 'Administradora Técnica',
    role: 'admin', organizationId: null, specialties: [],
    permissions: [
      'users:read', 'users:manage', 'orgs:read', 'orgs:manage',
      'sources:read', 'sources:manage', 'sensors:read', 'sensors:manage',
      'audit:read', 'settings:read', 'settings:manage', 'integrations:read', 'history:read',
    ],
    active: true, createdAt: daysAgo(500), updatedAt: daysAgo(3),
  },
];

const stations = [
  {
    id: 'st-01', code: 'H-01', name: 'Puerto Corrientes', river: 'Río Paraná', province: 'Corrientes',
    currentLevelM: 4.82, alertLevelM: 6.50, evacLevelM: 7.00, trendCmPerHour: 2,
    location: { lat: -27.4667, lng: -58.8333, label: 'Puerto de Corrientes Capital' },
    sourceType: 'adaptador', sourceRef: 'INA-PAR-01', updatedAt: minutesAgo(25), active: true,
  },
  {
    id: 'st-02', code: 'H-02', name: 'Puerto Barranqueras', river: 'Río Paraná / Riacho Barranqueras', province: 'Chaco',
    currentLevelM: 5.15, alertLevelM: 6.00, evacLevelM: 6.50, trendCmPerHour: 3,
    location: { lat: -27.4833, lng: -58.9333, label: 'Puerto Barranqueras, Chaco' },
    sourceType: 'adaptador', sourceRef: 'APA-BARR-01', updatedAt: minutesAgo(30), active: true,
  },
  {
    id: 'st-03', code: 'H-03', name: 'Paso de la Patria', river: 'Río Paraná', province: 'Corrientes',
    currentLevelM: 5.70, alertLevelM: 6.50, evacLevelM: 7.00, trendCmPerHour: 4,
    location: { lat: -27.3167, lng: -58.5833, label: 'Costanera Paso de la Patria' },
    sourceType: 'adaptador', sourceRef: 'INA-PASO-01', updatedAt: minutesAgo(15), active: true,
  },
  {
    id: 'st-04', code: 'H-04', name: 'Ituzaingó', river: 'Río Paraná (aguas abajo de Yacyretá)', province: 'Corrientes',
    currentLevelM: 2.90, alertLevelM: 3.50, evacLevelM: 4.00, trendCmPerHour: -1,
    location: { lat: -27.5833, lng: -56.6833, label: 'Puerto Ituzaingó' },
    sourceType: 'adaptador', sourceRef: 'EBY-ITU-01', updatedAt: minutesAgo(40), active: true,
  },
  {
    id: 'st-05', code: 'H-05', name: 'Puerto Bermejo', river: 'Río Paraguay', province: 'Chaco',
    currentLevelM: 4.20, alertLevelM: 5.50, evacLevelM: 6.00, trendCmPerHour: 1,
    location: { lat: -26.9333, lng: -58.5000, label: 'Puerto Bermejo, Chaco' },
    sourceType: 'adaptador', sourceRef: 'APA-BER-01', updatedAt: minutesAgo(50), active: true,
  },
  {
    id: 'st-06', code: 'H-06', name: 'Goya', river: 'Río Paraná', province: 'Corrientes',
    currentLevelM: 4.60, alertLevelM: 5.20, evacLevelM: 5.70, trendCmPerHour: 2,
    location: { lat: -29.1333, lng: -59.2667, label: 'Puerto Goya, Corrientes' },
    sourceType: 'adaptador', sourceRef: 'INA-GOY-01', updatedAt: minutesAgo(35), active: true,
  },
];

const sources = [
  {
    id: 'src-firms', code: 'NASA-FIRMS', name: 'NASA FIRMS (VIIRS / MODIS)', provider: 'NASA Earthdata',
    type: 'satelital', status: 'conectada', coverage: 'Global / Región NEA',
    variables: ['Anomalías térmicas', 'FRP (Fire Radiative Power)', 'Confianza de detección'],
    units: 'MW, %', lastSyncAt: minutesAgo(12), notes: 'Detección satelital de anomalías térmicas en esteros y pastizales.',
    requiresEnv: ['FIRMS_MAP_KEY'], createdAt: daysAgo(365), updatedAt: minutesAgo(12),
  },
  {
    id: 'src-smn', code: 'SMN-RED', name: 'Servicio Meteorológico Nacional', provider: 'SMN Argentina',
    type: 'meteorologica', status: 'conectada', coverage: 'Provincias de Corrientes y Chaco',
    variables: ['Temperatura', 'Humedad relativa', 'Viento (velocidad y dirección)', 'Precipitación acumulada'],
    units: '°C, %, km/h, mm', lastSyncAt: minutesAgo(20), notes: 'Estaciones meteorológicas oficiales de Corrientes y Resistencia.',
    requiresEnv: ['SMN_API_KEY'], createdAt: daysAgo(365), updatedAt: minutesAgo(20),
  },
  {
    id: 'src-ina', code: 'INA-SINA', name: 'Instituto Nacional del Agua (INA)', provider: 'INA',
    type: 'hidrologica', status: 'conectada', coverage: 'Cuenca del Plata / Ríos Paraná y Paraguay',
    variables: ['Niveles hidrométricos', 'Caudales', 'Previsiones hidrológicas semanales'],
    units: 'm, m³/s', lastSyncAt: minutesAgo(30), notes: 'Alertas y cotas hidrométricas de referencia.',
    requiresEnv: ['INA_API_URL'], createdAt: daysAgo(365), updatedAt: minutesAgo(30),
  },
  {
    id: 'src-yvy-iot', code: 'YVY-TELEMETRIA', name: 'Red de Sensores Territoriales Yvy', provider: 'APA Chaco / Defensa Civil Corrientes',
    type: 'sensorial', status: 'conectada', coverage: 'Cuencas urbanas y áreas protegidas del Iberá',
    variables: ['Nivel de agua ultrasónico', 'Pluviometría en tiempo real', 'Humedad de suelo'],
    units: 'm, mm, %', lastSyncAt: minutesAgo(2), notes: 'Nodos IoT LoRaWAN y LTE-M con telemetría cada 15 min.',
    requiresEnv: [], createdAt: daysAgo(200), updatedAt: minutesAgo(2),
  },
];

const sensors = [
  {
    id: 'sen-001', code: 'NODE-01', name: 'Boya hidrométrica Paso de la Patria', type: 'hidrometrico',
    variable: 'Nivel de agua', unit: 'm', protocol: 'LoRaWAN', status: 'online', battery: 94, rssi: -84,
    lastPayloadAt: minutesAgo(3), location: { lat: -27.3167, lng: -58.6167, label: 'Paso de la Patria' },
    organizationId: 'org-apa-chaco', active: true, createdAt: daysAgo(400), updatedAt: minutesAgo(3),
  },
  {
    id: 'sen-002', code: 'NODE-02', name: 'Radar de nivel Puerto Corrientes', type: 'hidrometrico',
    variable: 'Nivel de agua', unit: 'm', protocol: 'LTE-M', status: 'online', battery: 98, rssi: -72,
    lastPayloadAt: minutesAgo(1), location: { lat: -27.4692, lng: -58.8344, label: 'Puerto Corrientes' },
    organizationId: 'org-apa-chaco', active: true, createdAt: daysAgo(400), updatedAt: minutesAgo(1),
  },
  {
    id: 'sen-003', code: 'NODE-03', name: 'Estación pluvial Parque Cambá Cuá', type: 'pluvio',
    variable: 'Precipitación acumulada 1h', unit: 'mm', protocol: 'LoRaWAN', status: 'online', battery: 89, rssi: -78,
    lastPayloadAt: minutesAgo(8), location: { lat: -27.4650, lng: -58.8380, label: 'Cambá Cuá, Corrientes' },
    organizationId: 'org-defensa-civil', active: true, createdAt: daysAgo(200), updatedAt: minutesAgo(8),
  },
  {
    id: 'sen-004', code: 'NODE-04', name: 'Sensor nivel Canal Soberanía', type: 'hidrometrico',
    variable: 'Nivel de canal pluvial', unit: 'm', protocol: 'LoRaWAN', status: 'advertencia', battery: 67, rssi: -92,
    lastPayloadAt: minutesAgo(14), location: { lat: -27.4720, lng: -58.9810, label: 'Canal Soberanía, Resistencia' },
    organizationId: 'org-muni-resistencia', active: true, createdAt: daysAgo(200), updatedAt: minutesAgo(14),
  },
  {
    id: 'sen-005', code: 'NODE-05', name: 'Sensor humedad Portal Carambola', type: 'humedad_suelo',
    variable: 'Humedad volumétrica de combustible', unit: '%', protocol: 'Satellite IoT', status: 'online', battery: 85, rssi: -88,
    lastPayloadAt: minutesAgo(5), location: { lat: -27.9833, lng: -57.5833, label: 'Portal Carambola, Esteros del Iberá' },
    organizationId: 'org-defensa-civil', active: true, createdAt: daysAgo(150), updatedAt: minutesAgo(5),
  },
];

const incidents = [
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
    location: { lat: -27.4511, lng: -58.9867, label: 'Av. Castelli y Calle 16, Resistencia, Chaco' },
    sourceType: 'reporte_ciudadano', sourceRef: 'REP-2026-0875', areaHa: null, levelM: 0.35,
    organizationId: 'org-muni-resistencia', assignedTo: null, createdBy: 'u-ciudadano',
    createdAt: minutesAgo(120), observedAt: minutesAgo(130), updatedAt: minutesAgo(120),
    publicViewable: false,
    history: [
      { at: minutesAgo(120), actorId: 'u-coordinador', actorName: 'Coordinadora Ojeda', from: null, to: 'en_verificacion', note: 'Derivado a municipio para inspección de drenaje' },
    ],
  },
  {
    id: 'inc-005', code: 'INC-2026-002', type: 'incendio', status: 'controlado', priority: 'media',
    description: 'Foco de pastizal en banquina, controlado por dotación caminera.',
    location: { lat: -27.5500, lng: -58.7500, label: 'RN 12 km 1024, Riachuelo, Corrientes' },
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

const reports = [
  {
    id: 'rep-001', code: 'REP-2026-0902', type: 'incendio',
    description: 'Columna de humo densa blanca-grisácea con llamas visibles sobre pajonal alto, cerca del portal de la reserva.',
    location: { lat: -28.2028, lng: -57.4778, label: 'Paraje Galarza, Corrientes' },
    photoUrl: null, status: 'confirmado',
    createdBy: 'u-ciudadano', createdByName: 'Vecina Correntina', incidentId: 'inc-001',
    resolutionNote: 'Confirmado por brigada; derivado a incidente INC-2026-014.',
    createdAt: minutesAgo(235), updatedAt: minutesAgo(15),
    verifiedBy: 'u-bomberos', verifiedAt: minutesAgo(15),
    timeline: [
      { at: minutesAgo(235), actorId: 'u-ciudadano', actorName: 'Vecina Correntina', status: 'recibido' },
      { at: minutesAgo(200), actorId: 'u-bomberos', actorName: 'Sargento Ramírez', status: 'en_verificacion', note: 'Se envía reconocimiento' },
      { at: minutesAgo(15), actorId: 'u-bomberos', actorName: 'Sargento Ramírez', status: 'confirmado', note: 'Derivado a incidente INC-2026-014' },
    ],
  },
  {
    id: 'rep-002', code: 'REP-2026-0875', type: 'anegamiento',
    description: 'Agua sobre calzada en la avenida principal; los colectivos urbanos no pueden pasar.',
    location: { lat: -27.4500, lng: -58.9900, label: 'Av. Soberanía Nacional, Resistencia' },
    photoUrl: null, status: 'en_verificacion',
    createdBy: 'u-ciudadano', createdByName: 'Vecina Correntina', incidentId: 'inc-004',
    resolutionNote: null,
    createdAt: minutesAgo(130), updatedAt: minutesAgo(120),
    verifiedBy: null, verifiedAt: null,
    timeline: [
      { at: minutesAgo(130), actorId: 'u-ciudadano', actorName: 'Vecina Correntina', status: 'recibido' },
      { at: minutesAgo(120), actorId: 'u-coordinador', actorName: 'Coordinadora Ojeda', status: 'en_verificacion', note: 'Derivado a municipio' },
    ],
  },
  {
    id: 'rep-003', code: 'REP-2026-0918', type: 'camino_bloqueado',
    description: 'Camino rural con árbol caído que bloquea el paso a la escuela rural.',
    location: { lat: -27.4810, lng: -58.7950, label: 'Camino rural acceso a Santa Ana, Corrientes' },
    photoUrl: null, status: 'recibido',
    createdBy: 'u-ciudadano', createdByName: 'Vecina Correntina', incidentId: null,
    resolutionNote: null,
    createdAt: minutesAgo(25), updatedAt: minutesAgo(25),
    verifiedBy: null, verifiedAt: null,
    timeline: [
      { at: minutesAgo(25), actorId: 'u-ciudadano', actorName: 'Vecina Correntina', status: 'recibido' },
    ],
  },
  {
    id: 'rep-004', code: 'REP-2026-0925', type: 'humo',
    description: 'Fuerte olor a quemado y humo denso ingresando desde la zona de islas frente a la costanera.',
    location: { lat: -27.4610, lng: -58.8410, label: 'Costanera General San Martín, Corrientes' },
    photoUrl: null, status: 'recibido',
    createdBy: 'u-ciudadano', createdByName: 'Vecina Correntina', incidentId: null,
    resolutionNote: null,
    createdAt: minutesAgo(10), updatedAt: minutesAgo(10),
    verifiedBy: null, verifiedAt: null,
    timeline: [
      { at: minutesAgo(10), actorId: 'u-ciudadano', actorName: 'Vecina Correntina', status: 'recibido' },
    ],
  },
];

const alerts = [
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
];

async function seed() {
  console.log('--- Iniciando siembra en base de datos Firestore de producción ---');
  
  for (const org of organizations) {
    await setDoc(doc(db, 'organizations', org.id), org);
  }
  console.log(`✓ Organismos insertados: ${organizations.length}`);

  for (const u of users) {
    await setDoc(doc(db, 'users', u.uid), u);
  }
  console.log(`✓ Usuarios con roles y permisos insertados: ${users.length}`);

  for (const st of stations) {
    await setDoc(doc(db, 'stations', st.id), st);
  }
  console.log(`✓ Estaciones hidrométricas insertadas: ${stations.length}`);

  for (const src of sources) {
    await setDoc(doc(db, 'sources', src.id), src);
  }
  console.log(`✓ Fuentes de datos insertadas: ${sources.length}`);

  for (const sen of sensors) {
    await setDoc(doc(db, 'sensors', sen.id), sen);
  }
  console.log(`✓ Sensores IoT insertados: ${sensors.length}`);

  for (const inc of incidents) {
    await setDoc(doc(db, 'incidents', inc.id), inc);
  }
  console.log(`✓ Incidentes territoriales insertados: ${incidents.length}`);

  for (const rep of reports) {
    await setDoc(doc(db, 'reports', rep.id), rep);
  }
  console.log(`✓ Puntos de notificación ciudadana insertados: ${reports.length}`);

  for (const al of alerts) {
    await setDoc(doc(db, 'alerts', al.id), al);
  }
  console.log(`✓ Alertas insertadas: ${alerts.length}`);

  await setDoc(doc(db, 'settings', 'general'), {
    appName: 'Yvy Resiliente',
    regionLabel: 'Corrientes y Chaco',
    defaultTerritory: 'Corrientes Capital',
    demoBannerEnabled: false,
    mapBounds: { minLat: -31.5, maxLat: -23.8, minLng: -61.5, maxLng: -55.0 },
    updatedAt: now,
  });
  console.log('✓ Configuración general inicializada');

  console.log('=== Base de datos Firestore sembrada con éxito ===');
  process.exit(0);
}

seed().catch(err => {
  console.error('Error al sembrar Firestore:', err);
  process.exit(1);
});
