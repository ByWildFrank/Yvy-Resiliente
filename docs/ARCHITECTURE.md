# ARQUITECTURA — YVY RESILIENTE

## 1. Arquitectura encontrada (estado inicial, pre-refactor)

```
src/App.vue  (currentView: string + cadena v-if de 10 vistas)
 ├── components/*  ──┐
 └── views/*  ───────┴── import directo → src/data/mockData.js (datos hardcodeados)
```

- Sin router, sin servicios, sin repositorios, sin estados de carga/error.
- `src/firebase.ts` inicializaba Auth/Firestore/Storage pero ninguna vista lo usaba.
- `firebase.json` publicaba `public/` (página de bienvenida de Firebase Hosting, no la app).
- Todas las acciones eran toasts de éxito simulados; ninguna operación persistía.

## 2. Arquitectura objetivo (implementada)

```
PRESENTACIÓN                      src/views/**, src/components/** (Vue SFC)
   ↓ consumen
CASOS DE USO / SERVICIOS          src/services/**  (auth, incidents, reports, alerts,
   ↓ orquestan                     sensors, sources, kpis, scenarios, users, orgs, audit)
DOMINIO / REGLAS                   src/types/domain.ts + reglas en servicios
   ↓
REPOSITORIOS / ADAPTADORES         src/repositories/contracts.ts
   ├── adaptador DEMO              src/repositories/demo/*  (localStorage + fixtures etiquetados)
   └── adaptador FIREBASE          src/repositories/firebase/* (Firestore + Security Rules)
   ↓
BASE DE DATOS / EXTERNAS           Firestore (producción) · localStorage (modo demo)
```

### Decisiones de arquitectura

| Decisión | Justificación |
|---|---|
| Mantener Vue 3 + Vite + Tailwind | Es el stack real del proyecto; funciona. No se cambia tecnología por preferencia. |
| Añadir `vue-router` | Requisito estructural: tres experiencias con rutas reales (`/ciudadano`, `/agente`, `/admin`) y guards por rol/permiso. |
| Firebase como backend | Ya era la integración elegida por el proyecto (`src/firebase.ts`, `.firebaserc`, SDK instalado). Se reutiliza; no se crea una segunda autenticación paralela. |
| Modo demo (adaptador localStorage) | Permite desarrollar y demostrar el producto sin credenciales externas, con persistencia real a nivel local y etiquetado explícito "MODO DEMO". No simula integraciones: declara su condición. |
| Frontera de seguridad = Firestore Rules | `firestore.rules` y `storage.rules` aplican identidad, permisos y visibilidad en el backend. El frontend replica las mismas reglas para UX, nunca como única barrera. |
| Mapa SVG propio, dirigido por datos | El mapa existente es un visor SVG (sin librería cartográfica). Se mantiene, pero ahora renderiza marcadores/etiquetas desde los repositorios. La integración de un mapa real (Leaflet/MapLibre + teselas) queda documentada como pendiente (ver `INTEGRATIONS.md`). |
| `vitest` | Marco de tests unitarios para reglas de negocio (permisos, KPIs, máquinas de estado, escenarios). Proporcionado por `npm test`. |

## 3. Estructura de carpetas

```
src/
  main.ts                    Bootstrap: router + auth + mount
  App.vue                    Shell: splash de sesión + <router-view> + toasts
  firebase.ts                Inicialización condicional (solo si hay VITE_FIREBASE_*)
  config/appConfig.ts        Configuración de app (regiones, umbrales de UI, flags)
  types/
    domain.ts                Entidades, roles, permisos, estados, eventos de auditoría
    states.ts                QueryState: loading | ok | empty | error | stale | demo
  repositories/
    contracts.ts             Interfaces de repositorio (backend-agnósticas)
    index.ts                 Selección de adaptador según configuración
    demo/                    Adaptador demo: localStorage + fixtures etiquetados
    firebase/                Adaptador Firebase: Firestore + Storage
  services/                  Casos de uso + reglas de negocio + RBAC de aplicación
  composables/               useQueryState (estados de consulta), useToast
  router/                    Rutas + guards (auth, rol, permiso)
  components/
    ui/                      StateMessage, StatusBadge, ModalDialog, KpiCard, ToastHost…
    map/                     TerritorialMap (dirigido por datos) + leyenda
    layout/                  Sidebars por rol, cabecera con sesión real y logout
  views/
    LoginView.vue
    citizen/                 9 vistas
    agent/                   12 vistas
    admin/                   8 vistas
firestore.rules              Frontera de autorización en producción
storage.rules                Reglas de adjuntos (solo imágenes, ≤ 5 MB)
docs/                        Esta documentación
```

## 4. Flujo de datos (ejemplo: reporte ciudadano)

1. `CitizenReportFormView` valida entrada (tipo, ubicación, descripción, foto opcional ≤ 5 MB, tipos imagen/*).
2. `reports.service.createReport()` verifica sesión (política: reportar requiere estar autenticado), fuerza `status='recibido'`, normaliza coordenadas y escribe por el repositorio activo.
3. Demo: `localStorage['yvy.demo.v1']` (persiste entre recargas). Producción: `reports/{id}` en Firestore; `firestore.rules` obliga a `status == 'recibido'` en el create y niega cambios de estado sin permiso `reports:verify`.
4. La UI muestra el identificador devuelto y el reporte aparece en "Mis reportes" con su línea de tiempo.

## 5. Flujo de autorización

- **Frontend (UX):** `useAuth()` + guards de router (`meta.permission`) ocultan/deniegan rutas y acciones no permitidas.
- **Backend (seguridad real):** en producción, cada operación la evalúan `firestore.rules` con la sesión de Firebase Auth y el documento `users/{uid}` (rol + permisos). Un cliente alterado no puede escalar privilegios: los campos `role`/`permissions` solo los escribe una regla admin `users:manage`, y el propio usuario no puede editarlos.
- **Modo demo:** el adaptador demo aplica las mismas verificaciones de permisos en sus operaciones de escritura y está etiquetado en pantalla. Es un entorno de desarrollo/democración, no una simulación de integración.

## 6. Estados de interfaz obligatorios

Toda consulta pasa por `useQueryState` → `QueryState`:

| Estado | Significado | UI |
|---|---|---|
| `loading` | Consulta en curso | Skeleton/spinner |
| `ok` | Datos disponibles | Contenido |
| `empty` | Sin resultados | Mensaje accionable |
| `error` | Fallo de consulta | Mensaje + reintentar, sin datos inventados |
| `stale` | Fuente desactualizada (antigüedad > umbral) | Aviso con edad del dato |
| `demo` | Datos de demostración | Badge "DEMO" permanente |

## 7. Trazabilidad

- `audit.service` registra acciones privilegiadas (verificar reportes, transiciones de incidente, publicación de alertas, cambios administrativos) con actor, acción, objetivo, detalles y visibilidad (`operativo`/`admin`).
- En producción, la escritura de auditoría la exige el flujo de servicio y las reglas la limitan a usuarios autenticados; su lectura completa es `audit:read` (admin), y los agentes con `history:read` solo ven entradas `visibilidad=operativo`.
- Las consultas de lectura ordinarias no generan auditoría.
