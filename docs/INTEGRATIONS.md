# INTEGRACIONES Y VARIABLES DE ENTORNO — YVY RESILIENTE

## 1. Estado actual (honesto)

| Integración | Estado | Observaciones |
|---|---|---|
| Firebase Auth | ✅ Implementada | En producción con credenciales `VITE_FIREBASE_*`. En modo demo usa cuentas explícitas etiquetadas. |
| Cloud Firestore | ✅ Implementada | Adaptador completo (`src/repositories/firebase/`), reglas en `firestore.rules`. |
| Cloud Storage (adjuntos) | ✅ Implementada | `storage.rules` (imágenes ≤ 5 MB). En demo, la foto se guarda como dataURL en el almacén local. |
| Alturas de ríos — Prefectura Naval | 🔎 Verificada (oct. 2026), integración pendiente | **Sin credenciales**. Tabla oficial en tiempo real con niveles, variación, estado y umbrales de alerta/evacuación + histórico por estación (ver §1.1). |
| Meteorología histórica — Open-Meteo | 🔎 Verificada (oct. 2026), integración pendiente | **Sin API key** (no comercial). ERA5/ERA5-Land 1940→hoy, incluye humedad de suelo. Endpoint `/v1/archive`. |
| Agroclimática — NASA POWER | 🔎 Verificada (oct. 2026), integración pendiente | API gratuita, 300+ parámetros (humedad, viento, precipitación, radiación) desde 1981. |
| Focos satelitales — NASA FIRMS | 🔎 Verificada (oct. 2026), integración pendiente | API de área CSV con **MAP_KEY gratuita** (registro por email; 5000 transacciones/10 min). |
| Fuegos — INPE Queimadas | ⏳ Pendiente | Portal con descargas para Sudamérica (terrabrasilis.dpi.inpe.br/queimadas); revisar formato y licencia. |
| Observaciones SMN | ⏳ Pendiente | Sitio oficial verificado (licencia **CC BY 2.5 Argentina** confirmada en el pie de smn.gob.ar); la API pública (api.smn.gob.ar) no respondió desde este entorno (HTTP 522) — verificar desde la infra propia. También: "Índice de peligro de incendio" y "Índices El Niño/La Niña" en el sitio. |
| Histórico hidrológico — BDHI (SSRH/INA) | ⏳ Pendiente (requiere solicitud) | `bdhi.hidricosargentina.gob.ar` → formulario de solicitud indicando uso previsto; entrega series históricas oficiales por estación. |
| Cuenca del Plata en tiempo real — CIC (SSTD-CdP) | ⏳ Pendiente | `cicplata.org` → "Sistema Soporte para la Toma de Decisiones": visión en tiempo real de la cuenca. |
| Capas base — IGN Argentina | 🔎 Verificada (oct. 2026), integración pendiente | `ign.gob.ar`: Capas SIG, WMS/WFS, Modelo Digital de Elevaciones, nomenclador, unidades territoriales. |
| Mapa con teselas reales (Leaflet/MapLibre) | ⏳ Pendiente | El visor SVG actual es dirigido por datos; ver §4. |
| Yvy AI (asistente) | ⏳ Pendiente | No se finge: la vista actual es de consultas sobre datos del sistema; un LLM real queda pendiente de credenciales. |

La pantalla **Admin → Integraciones** muestra este mismo estado en vivo (según configuración
de entorno), sin simular conexiones inexistentes.

### 1.1 Fuentes verificadas en detalle (octubre 2026)

**Prefectura Naval — "Altura de los ríos"** (la de mayor valor inmediato para el módulo hídrico):
- URL: `https://contenidosweb.prefecturanaval.gob.ar/alturas/` (enlazada como "Estado de los ríos" desde argentina.gob.ar/prefecturanaval).
- Datos verificados en vivo (ejemplo del 10/10/2026): **Paso de la Patria 5,17 m** (variación +0,07; cota alerta 6,50 m; evacuación 7,00 m; estado "CRECE"), **Corrientes 4,98 m** (6,50/7,00), **Barranqueras 4,95 m** (6,00/6,50), más Itatí, Itá Ibaté, Ituzaingó, Empedrado, Bella Vista, Goya, Esquina, Isla del Cerrito, Bermejo, Formosa, etc.
- Cada estación incluye: último registro, variación, período (6/12/24 h), fecha/hora, estado (CRECE/BAJA/ESTAC./ALERTA/EVACUACIÓN), registro anterior y cotas de **alerta/evacuación** — mapea 1:1 al modelo `stations` de Yvy (`currentLevelM`, `alertLevelM`, `evacLevelM`, `trendCmPerHour` derivable de variación/período).
- Histórico por estación: `?page=historico&tiempo=7&id=<id>` (series diarias de los últimos 7 días).
- Acceso: HTML público **sin API oficial** → integración por polling de baja frecuencia (p. ej. cada 1-2 h con caché) desde una función programada; para producción, gestionar autorización/convenio con PNA.

**Open-Meteo — Historical Weather API** (`open-meteo.com/en/docs/historical-weather-api`):
- `GET /v1/archive?latitude=…&longitude=…&start_date=…&end_date=…&hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_gusts_10m,soil_moisture_0_to_7cm`
- ERA5 (1940→), ERA5-Land (0,1°, incluye **humedad de suelo** — sequía/combustible), ECMWF IFS (2017→, 9 km). Sin key para uso no comercial; revisar términos para uso comercial.

**NASA FIRMS** (`firms.modaps.eosdis.nasa.gov/api/area/`):
- Formato verificado: `/api/area/csv/{MAP_KEY}/{SOURCE}/{WEST,SOUTH,EAST,NORTH}/{DAY_RANGE}[/FECHA]`
- Sources: `VIIRS_SNPP_NRT`, `VIIRS_NOAA20_NRT`, `VIIRS_NOAA21_NRT`, `MODIS_NRT`, etc. Bounding box sugerido para Corrientes/Chaco: `-62,-31,-54,-23`.
- Atributos: lat/lng, fecha/hora de adquisición, temperatura de brillo, FRP, confianza. MAP_KEY gratuita (registro por email), límite 5000 transacciones/10 min.

## 2. Variables de entorno

Copiar `.env.example` → `.env` y completar:

```bash
# --- Firebase (producción) ---
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# --- Modo de datos ---
# demo     → adaptador localStorage con fixtures etiquetados (desarrollo/demostación)
# firebase → Firestore real (requiere las variables anteriores)
VITE_DATA_MODE=demo
```

Sin variables de entorno, la app arranca en modo `demo` automáticamente y lo declara en la
interfaz (badge "MODO DEMO"). **Nunca** se muestran datos inventados como si fueran de un
proveedor real: las fuentes externas figuran como "Pendiente de integración".

## 3. Qué falta para conectar una fuente externa

1. Confirmar proveedor, documentación, mecanismo de acceso y condiciones de uso.
2. Obtener credenciales y declararlas como variables (nunca en el código).
3. Implementar el adaptador específico que escriba en `stations`/`sources`/`incidents`
   (contratos ya definidos en `src/repositories/contracts.ts`).
4. Registrar la fuente en la colección `sources` con `status='conectada'` y `lastSyncAt`.
5. Exponer antigüedad de datos en la UI (`stale` cuando supere el umbral por variable).

## 4. Mapa real (siguiente paso recomendado)

El componente `TerritorialMap` está desacoplado de la librería cartográfica: recibe entidades
proyectadas. Migrar a Leaflet/MapLibre implica: dependencia nueva, teselas (offline-first
deseable para operaciones), y migración de `projector.ts`. El componente actual ya consume
datos reales del almacén, por lo que el cambio sería localizado.

## 5. Despliegue

```bash
npm install
npm run build          # genera dist/
firebase deploy --only hosting,firestore:rules,firestore:indexes,storage
```

- `firebase.json` publica `dist/` con rewrite SPA.
- `firestore.rules` y `storage.rules` se versionan en la raíz.
- `firestore.indexes.json` se despliega con `firebase deploy --only firestore:indexes`.

## 5.1. Siembra inicial de producción (scripts/seed.mjs)

El seed inicial usa el SDK cliente, por lo que **requiere reglas temporales** durante
la carga (los datos sembrados incluyen incidentes con historial, alertas publicadas
y reportes con timeline que las reglas estrictas bloquean estructuralmente por diseño).

**Procedimiento (ver `scripts/seed.mjs` y `firestore.seed.rules`):**

```bash
# 0) .env con VITE_FIREBASE_* + SEED_EMAIL/SEED_PASSWORD (cuenta de siembra en Firebase Auth)

# 1) Publicar temporalmente las reglas de SIEMBRA (consola de Firebase → Firestore
#    → Reglas: pegar el contenido de firestore.seed.rules y publicar)

# 2) Ejecutar el seed
node --env-file=.env scripts/seed.mjs

# 3) ⚠️ INMEDIATAMENTE: restaurar las reglas ESTRICTAS
firebase deploy --only firestore:rules
```

**Reglas de honestidad del seed** (aplicadas en el script):

- Las fuentes externas sin adaptador (FIRMS, SMN, INA) se siembran como `pendiente`,
  sin `lastSyncAt`, con las variables de entorno que requerirán (`requiresEnv`).
- Las estaciones se siembran con `sourceType: 'manual'`: hasta que exista el
  adaptador oficial, las lecturas se actualizan por carga manual auditada.
- Solo las fuentes internas de la plataforma (registro propio + telemetría de
  sensores registrados) se marcan `conectada`.
- La corrida queda auditada (`admin.seeded` en `audit_logs`).

**Seguridad**: `scripts/seed.mjs`, `seed.mjs` y las claves de cuenta de servicio
están ignorados en `.gitignore`. Las credenciales viven solo en `.env` (ignorado).
