# MODELO DE DATOS — YVY RESILIENTE

## 1. Backend de producción: Firestore

Colecciones y campos (nombres de campo en español técnico consistente con el dominio):

### users/{uid}
```
email, displayName, role: 'ciudadano'|'agente'|'admin',
organizationId?, specialties: string[], permissions: string[],
active: bool, createdAt, updatedAt
```
- Índice: consultas por `role`, `organizationId` (composite) — definidos en `firestore.indexes.json`.
- `role`, `permissions`, `active`, `organizationId` solo los escribe un autor con `users:manage`
  (regla) — ni el propio usuario ni un agente pueden escalar privilegios.

### organizations/{id}
```
name, type: 'bomberos'|'defensa_civil'|'municipalidad'|'provincial'|'hidrica'|'otro',
territory, contact?, active, createdAt, updatedAt
```

### incidents/{id}
```
code, type: 'incendio'|'inundacion'|'anegamiento'|'humo'|'otro',
status: 'deteccion'|'reportado'|'en_verificacion'|'confirmado'|'en_gestion'|'controlado'|'cerrado'|'descartado',
priority: 'baja'|'media'|'alta'|'critica',
description, location: { lat, lng, label, territoryId? },
sourceType: 'satelital'|'reporte_ciudadano'|'sensor'|'operador',
sourceRef?, areaHa?, levelM?,
organizationId?, assignedTo?, createdBy, createdAt, observedAt?, updatedAt,
publicViewable: bool,   // difundible al mapa ciudadano
history: [{ at, actorId, actorName, from, to, note }]   (transiciones embebidas, historial acotado)
```
- Subcolección `incidents/{id}/timeline` no se usa: el historial embebido cubre el alcance actual.

### reports/{id}
```
code, type: 'incendio'|'humo'|'inundacion'|'anegamiento'|'camino_bloqueado'|'otro',
description, location: { lat, lng, label },
photoUrl?, photoDataUrl? (solo demo),
status: 'recibido'|'en_verificacion'|'confirmado'|'descartado'|'cerrado',
createdBy, createdByName, anonymous: bool, incidentId?, resolutionNote?,
createdAt, updatedAt, verifiedBy?, verifiedAt?,
timeline: [{ at, actorId, actorName, status, note }]
```

### alerts/{id}
```
code, type: 'incendio'|'hidrica'|'meteorologica'|'general',
severity: 'info'|'aviso'|'alerta'|'emergencia',
title, message, instructions?,
scope: 'publico'|'operativo',
status: 'borrador'|'publicada'|'cancelada'|'expirada',
territory: string, source: string,
validFrom, validUntil?, publishedBy?, publishedAt?, createdAt, updatedAt
```

### sensors/{id}
```
code, name, type: 'hidrometrico'|'pluvio'|'meteo'|'humedad_suelo'|'otro',
variable, unit, protocol, status: 'online'|'advertencia'|'silente'|'mantenimiento',
battery?, rssi?, lastPayloadAt?, location: { lat, lng, label },
organizationId?, active, createdAt, updatedAt
```

### stations/{id}  (estaciones hidrométricas de referencia)
```
code, name, river, province,
currentLevelM, alertLevelM, evacLevelM, trendCmPerHour?,
sourceType: 'manual'|'adaptador', sourceRef?, updatedAt, active
```
- En modo demo provienen de fixtures; en producción se sincronizarían por un adaptador
  (ver `INTEGRATIONS.md` — pendiente).

### sources/{id}
```
code, name, provider, type: 'satelital'|'meteorologica'|'hidrologica'|'sensorial'|'oficial',
status: 'conectada'|'pendiente'|'error'|'desactivada',
coverage, variables: string[], units?, lastSyncAt?, notes?, requiresEnv: string[],
createdAt, updatedAt
```
- `requiresEnv` documenta qué variables de entorno necesitaría el adaptador. La UI muestra
  "PENDIENTE DE INTEGRACIÓN" cuando `status='pendiente'` — nunca se muestran datos inventados.

### audit_logs/{id}
```
at, actorId, actorName, action: string (ej. 'report.verified'),
targetType, targetId, details: string, visibility: 'operativo'|'admin'
```

### scenario_runs/{id}
```
mode: 'incendio'|'hidrologico', inputs: {...}, results: {...},
assumptions: string[], limitations: string[], engine: 'reglas-demo-v1',
runBy, runByName, createdAt
```
- `engine` identifica el motor: hoy es un motor de reglas demostrativo, etiquetado en UI.

### settings/general
```
appName, regionLabel, demoBannerEnabled, defaultTerritory, mapBounds {...}, updatedAt
```

### incident_categories/{id}, alert_categories/{id}
Catálogos administrables por el admin (tipos de incidente, tipos/severidades de alerta).

## 2. Backend demo (localStorage)

Clave `yvy.demo.v1`, estructura `{ users, organizations, incidents, reports, alerts, sensors,
stations, sources, auditLogs, scenarioRuns, settings, session }`. Esquemas idénticos a
Firestore (mismos campos). Los fixtures (`src/repositories/demo/fixtures.ts`) se siembran una
vez y las operaciones de escritura persisten — **sobreviven a la recarga**, a diferencia del
estado pre-refactor.

## 3. Seguridad de datos

- `firestore.rules`: aplica RBAC + ownership + inmutable-by-role en cada colección (ver archivo).
- `storage.rules`: `reports/{uid}/{file}` — solo imágenes, ≤ 5 MB, propietario o lector con
  permiso.
- Coordenadas: `lat`/`lng` numéricos validados en cliente y en reglas (`number`).
- Unidades siempre explícitas (`unit` en sensores, sufijos en UI).
- Marcas temporales ISO-8601.

## 4. Migraciones

No existía base de datos previa (el proyecto no tenía persistencia). El esquema anterior era
`mockData.js` (arrays estáticos) → migrado a fixtures demo tipados. En producción, los
catálogos (`incident_categories`, `alert_categories`, `settings`) se siembran con un script
documentado (`docs/INTEGRATIONS.md` §5) sin destruir datos existentes.

## 5. Índices (firestore.indexes.json)

- `incidents`: (status, updatedAt desc) · (type, status) · (publicViewable, status)
- `reports`: (status, createdAt desc) · (createdBy, createdAt desc)
- `alerts`: (scope, status, severity) · (status, validFrom desc)
- `audit_logs`: (at desc) · (visibility, at desc)
- `users`: (role) · (organizationId)
- `sensors`: (status) · (organizationId)
- `sources`: (type, status)
