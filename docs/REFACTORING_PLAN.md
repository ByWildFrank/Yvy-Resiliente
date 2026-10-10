# PLAN DE REFACTORIZACIÓN — YVY RESILIENTE

Registro del plan ejecutado y su estado. Las fases se ejecutaron en orden; cada una deja el
proyecto verificable (typecheck + build) antes de pasar a la siguiente.

## F0 — Documentación
- [x] `docs/PROJECT_CONTEXT.md` — contexto funcional canónico.
- [x] `docs/ARCHITECTURE.md` — arquitectura encontrada vs objetivo.
- [x] `docs/REFACTORING_PLAN.md` — este documento.
- [x] `docs/PERMISSIONS_MATRIX.md` — matriz RBAC por módulo y rol.
- [x] `docs/DATA_MODEL.md` — modelo Firestore + demo + migraciones.
- [x] `docs/INTEGRATIONS.md` — integraciones reales/pendientes y variables de entorno.

## F1 — Higiene del proyecto
- [x] `package.json`: nombre `yvy-resiliente`, scripts reales (`dev`, `build`, `preview`, `lint`, `test`).
- [x] Eliminar dependencias muertas del template (react, genai, express, motion, lucide…).
- [x] Añadir `vue-router` y `vitest` (justificados en ARCHITECTURE.md).
- [x] `firebase.json`: publicar `dist/` (output de Vite) con SPA rewrite.
- [x] `.env.example` unificado en la raíz (Firebase + modo de datos).
- [x] `tsconfig.json`: paths `@/*` → `./src/*` (coherente con el alias de Vite).
- [x] README real del proyecto.

## F2 — Núcleo de datos y servicios
- [x] `src/types/domain.ts` — entidades, roles, permisos, estados, transiciones.
- [x] `src/types/states.ts` + `useQueryState` — estados de consulta.
- [x] `src/repositories/contracts.ts` — contratos de repositorio.
- [x] Adaptador demo (`repositories/demo/`): fixtures migrados de `mockData.js`, **etiquetados**, persistidos en `localStorage` (las operaciones sobreviven a la recarga).
- [x] Adaptador Firebase (`repositories/firebase/`) con `firestore.rules` + `storage.rules`.
- [x] Servicios: auth, incidents, reports, alerts, sensors, sources, hydrology (estaciones), kpis (derivados), scenarios (motor de reglas etiquetado demo), users, organizations, audit, settings.
- [x] Eliminar `src/data/mockData.js` (migrado a fixtures tipados).

## F3 — Autenticación, RBAC y rutas
- [x] `vue-router` con árboles `/ciudadano`, `/agente`, `/admin`.
- [x] Guards: sesión, rol y permiso por ruta (`meta`).
- [x] Login real: Firebase Auth en producción; cuentas demo explícitas en modo demo.
- [x] Auditoría de acciones privilegiadas.
- [x] Rutas públicas sin sesión (alertas publicadas, mapa público, info ambiental).

## F4 — Experiencia ciudadano (`/ciudadano`)
- [x] Inicio (alertas públicas, resumen por localidad, incidentes difundibles).
- [x] Mapa público (solo capas públicas).
- [x] Alertas + detalle.
- [x] Reportar incidente (formulario validado, foto opcional, identificador de seguimiento).
- [x] Mis reportes + detalle con línea de tiempo (estados administrados por operadores).
- [x] Información ambiental pública (estaciones + fuentes con estado honesto).
- [x] Perfil y preferencias (persistidas).

## F5 — Experiencia agente (`/agente`)
- [x] Dashboard operativo con KPIs **derivados de datos** + cola de triaje + actividad reciente.
- [x] Mapa técnico con capas.
- [x] Incidentes: listado, creación, detalle con transiciones verificables + historial.
- [x] Verificación de reportes (confirmar/descartar con auditoría y derivación a incidente).
- [x] Alertas: gestión y publicación según permiso `alerts:publish`.
- [x] Hidrología: estaciones con umbrales y estado derivado.
- [x] Sensores: registro con estado real del almacén (ping honesto en demo: diagnóstico local etiquetado).
- [x] Fuentes: registro con estado `conectada`/`pendiente` — ninguna API externa se finge conectada.
- [x] Escenarios: motor de reglas **etiquetado como demostrativo**, con supuestos y limitaciones.
- [x] Historial e informes generados desde datos reales del sistema.

## F6 — Experiencia admin (`/admin`)
- [x] Dashboard administrativo (contadores derivados).
- [x] Usuarios: listado, activación/desactivación, asignación de rol/organismo/especialidades/permisos.
- [x] Organismos: CRUD.
- [x] Fuentes y sensores: administración de registros.
- [x] Auditoría (entradas administrativas).
- [x] Integraciones: estado real (Firebase configurado/no, APIs externas = pendientes, con variables requeridas).
- [x] Configuración general.

## F7 — Pruebas y endurecimiento
- [x] Tests unitarios (`vitest`): matriz de permisos, máquina de estados de reportes, transiciones de incidente, umbrales de estaciones, KPIs derivados, motor de escenarios, validación de adjuntos. **36/36 pasando.**
- [x] `tsc --noEmit` (typecheck, strict) sin errores.
- [x] `vite build` sin errores.
- [x] Verificación funcional end-to-end en navegador (modo demo) comprobada por inspección de DOM, **sin errores de consola ni de página**:
  - `/` redirige a `/ciudadano` sin sesión; inicio público renderiza alertas, resumen por localidad y mapa con datos derivados.
  - `/ciudadano/reportar` sin sesión → `/login` (guard de autenticación).
  - Login demo ciudadana → creación de reporte con identificador real (`REP-2026-919`).
  - "Mis reportes" muestra el reporte propio y **sobrevive a recarga completa** (persistencia).
  - Login agente bomberos → dashboard con KPIs derivados de datos reales.
  - Verificación de reporte: `Tomar` → EN VERIFICACIÓN → `Resolver` → CONFIRMADO + **incidente derivado** (`INC-2026-015`) visible en incidentes.
  - Auditoría operativa registra cada acción con actor y marca temporal.
  - Guards de rol en ambas direcciones: agente redirigido de `/admin` → `/agente`; admin redirigido de `/agente` → `/admin`.
  - Dashboard administrativo con contadores derivados (6 usuarios, 4 organismos, 6 sensores, 5 fuentes).
  - Pantalla de integraciones honesta: Firebase "PENDIENTE" sin credenciales; fuentes externas con variables requeridas.
  - Escenario demo ejecutado con resultado calculado, descargo obligatorio y supuestos/limitaciones visibles.
- [x] Revisión de seguridad: `firestore.rules` (RBAC + propiedad + inmutabilidad de auditoría), `storage.rules` (imágenes ≤ 5 MB), sin secretos en cliente.

## Qué NO se hizo (y por qué)

- **No** se integró ninguna API externa real ( meteorológica, hidrológica, satelital): no hay
  credenciales ni contratos confirmados. Los adaptadores y contratos quedaron definidos y el
  estado "pendiente de integración" es visible en la UI (ver `INTEGRATIONS.md`).
- **No** se sustituyó el visor SVG por Leaflet/MapLibre: añadiría teselas externas y una
  dependencia nueva; el visor actual se rediseñó para ser dirigido por datos. Queda documentado
  como siguiente paso.
- **No** se implementó un backend propio (Express): Firebase ya era el backend elegido.
- **No** se eliminó el modo demo: es necesario para desarrollo/demostación sin credenciales,
  pero quedó aislado, etiquetado y desactivable con `VITE_DATA_MODE=firebase`.
