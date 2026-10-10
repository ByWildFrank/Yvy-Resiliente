# Yvy Resiliente

Plataforma web de inteligencia territorial para la prevención, el monitoreo y la gestión de
riesgos ambientales (incendios e inundaciones) en Corrientes y Chaco, Argentina.

Tres experiencias diferenciadas:

- **Ciudadano** (`/ciudadano`): alertas públicas, mapa público, reporte y seguimiento de
  incidentes, información ambiental.
- **Agente / organismo** (`/agente`): dashboard operativo, mapa técnico, incidentes con ciclo
  de vida verificable, verificación de reportes, alertas, sensores, fuentes, hidrología,
  escenarios, historial e informes.
- **Administrador** (`/admin`): usuarios, roles y permisos, organismos, fuentes, sensores,
  auditoría, integraciones y configuración.

## Stack

Vue 3 · Vite · TypeScript · Tailwind CSS 4 · Vue Router · Firebase (Auth + Firestore +
Storage) · Vitest.

## Ejecución local

```bash
npm install
npm run dev        # http://localhost:3000
```

Sin configurar credenciales, la app corre en **modo demo**: usa un almacén local
(localStorage) con fixtures etiquetados como demostración. Todas las operaciones persisten
entre recargas. Las cuentas demo están listadas en la pantalla de login (contraseña
`demo1234`).

## Producción (Firebase)

1. `cp .env.example .env` y completar las variables `VITE_FIREBASE_*`.
2. `VITE_DATA_MODE=firebase`.
3. ```bash
   npm run build
   firebase deploy --only hosting,firestore:rules,firestore:indexes,storage
   ```

La autorización en producción la aplican `firestore.rules` y `storage.rules`
(RBAC + propiedad de recursos). Ver `docs/PERMISSIONS_MATRIX.md`.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción (`dist/`) |
| `npm run preview` | Previsualizar el build |
| `npm run lint` | Typecheck (`tsc --noEmit`) |
| `npm test` | Tests unitarios (`vitest`) |

## Documentación

- `docs/PROJECT_CONTEXT.md` — contexto funcional.
- `docs/ARCHITECTURE.md` — arquitectura y decisiones.
- `docs/REFACTORING_PLAN.md` — plan y estado del refactor.
- `docs/PERMISSIONS_MATRIX.md` — matriz de roles y permisos.
- `docs/DATA_MODEL.md` — modelo de datos.
- `docs/INTEGRATIONS.md` — integraciones reales/pendientes y entorno.
- `PROJECT.CONTEXT.md` — contexto maestro original del producto.
