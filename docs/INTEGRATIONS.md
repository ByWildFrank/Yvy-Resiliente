# INTEGRACIONES Y VARIABLES DE ENTORNO — YVY RESILIENTE

## 1. Estado actual (honesto)

| Integración | Estado | Observaciones |
|---|---|---|
| Firebase Auth | ✅ Implementada | En producción con credenciales `VITE_FIREBASE_*`. En modo demo usa cuentas explícitas etiquetadas. |
| Cloud Firestore | ✅ Implementada | Adaptador completo (`src/repositories/firebase/`), reglas en `firestore.rules`. |
| Cloud Storage (adjuntos) | ✅ Implementada | `storage.rules` (imágenes ≤ 5 MB). En demo, la foto se guarda como dataURL en el almacén local. |
| APIs meteorológicas (SMN, NOAA…) | ⏳ Pendiente | Contrato del adaptador definido (`sources` + `stations`); se necesita credencial/endpoints confirmados. |
 APIs hidrológicas (INA, Prefectura, BIHA) | ⏳ Pendiente | Ídem. Las estaciones muestran el estado real del almacén (`manual`/`adaptador`). |
| Focos satelitales (FIRMS/VIIRS/MODIS) | ⏳ Pendiente | El tipo de fuente existe en el registro; sin datos inventados. |
| Mapa con teselas reales (Leaflet/MapLibre) | ⏳ Pendiente | El visor SVG actual es dirigido por datos; ver §4. |
| Yvy AI (asistente) | ⏳ Pendiente | No se finge: la vista actual es de consultas sobre datos del sistema; un LLM real queda pendiente de credenciales. |

La pantalla **Admin → Integraciones** muestra este mismo estado en vivo (según configuración
de entorno), sin simular conexiones inexistentes.

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
firebase deploy --only hosting,firestore:rules,storage
```

- `firebase.json` publica `dist/` con rewrite SPA.
- `firestore.rules` y `storage.rules` se versionan en la raíz.
- `firestore.indexes.json` se despliega con `firebase deploy --only firestore:indexes`.
- Seed inicial de catálogos (`settings`, `incident_categories`, `alert_categories`): hacerlo
  manualmente desde Admin → Configuración o vía script en la consola de Firestore; el modo demo
  se auto-siembra.
