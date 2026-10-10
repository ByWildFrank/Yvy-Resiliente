# MATRIZ DE PERMISOS — YVY RESILIENTE

Fuente de verdad para `src/types/domain.ts` (permisos), los guards del router
(`src/router/index.ts`), los controles de los servicios y las **Firestore Security Rules**
(`firestore.rules`).

## 1. Roles y especialidades

| Rol | Descripción |
|---|---|
| `ciudadano` | Persona sin atribuciones institucionales. Accede a información pública y gestiona sus propios reportes. |
| `agente` | Integrante de un organismo con una o más especialidades. Opera según permisos. |
| `admin` | Administrador técnico de la plataforma. **No** recibe por defecto atribuciones institucionales (verificar emergencias, publicar alertas). |

Especialidades de agente: `meteorologia`, `bomberos`, `hidrica_ambiental`, `gobierno_defensa`, `analista`.
La especialidad es descriptiva; **el acceso lo determinan los permisos**.

## 2. Permisos (catálogo)

```
incidents:read      incidents:create     incidents:verify     incidents:manage
reports:read        reports:verify
alerts:read         alerts:publish
sensors:read        sensors:manage
sources:read        sources:manage
hydrology:read
history:read
scenarios:run
informes:generate
users:read          users:manage
orgs:read           orgs:manage
audit:read
settings:read       settings:manage
integrations:read
```

## 3. Matriz por módulo

L = Leer · C = Crear · U = Modificar · V = Verificar/Transicionar · P = Publicar · A = Administrar

| Módulo | Ciudadano | Agente (bomberos) | Agente (hidrica) | Agente (gobierno/DC) | Agente (analista) | Admin |
|---|---|---|---|---|---|---|
| Alertas públicas (scope=publico, publicadas) | L | L | L | L | L | L |
| Alertas operativas (todas) | — | L | L | L | L | L |
| Publicar alertas | — | — | — | **P** | — | — |
| Info ambiental pública (estaciones) | L | L | L | L | L | L |
| Incidentes (todos los campos) | solo difundibles¹ | L | L | L | L | L |
| Crear incidente | — | C | C | C | — | — |
| Verificar / transicionar incidente | — | **V** | **V** | **V** | — | — |
| Reportes ciudadanos | propios² | L | L | L | L | L |
| Crear reporte | C | C | C | C | C | C |
| Verificar reporte (confirmar/descartar/cerrar) | — | **V** | **V** | **V** | — | — |
| Sensores (registro + telemetría) | — | L | L | L | L | L + **A** |
| Fuentes de información | estado público³ | L | L | L | L | L + **A** |
| Escenarios (motor demo) | — | ejecutar⁴ | ejecutar⁴ | ejecutar⁴ | ejecutar⁴ | — |
| Historial | propio | L | L | L | L | L |
| Informes | — | generar⁴ | — | generar⁴ | generar⁴ | — |
| Usuarios / roles / permisos | — | — | — | — | — | **A** |
| Organismos | — | el propio | el propio | el propio | el propio | **A** |
| Auditoría administrativa | — | — | — | — | — | L |
| Auditoría operativa (visibilidad=operativo) | — | L | L | L | L | L |
| Configuración general | — | — | — | — | — | **A** |
| Estado de integraciones | — | L | L | L | L | L |

¹ `publicViewable=true` y estado confirmado/gestionado/cerrado.
² El ciudadano ve únicamente reportes cuyo `createdBy` sea su propio uid.
³ Nombre, tipo y estado de la fuente; nunca configuración secreta.
⁴ Requiere el permiso específico (`scenarios:run`, `informes:generate`).

## 4. Perfiles demo (modo demo, `VITE_DATA_MODE=demo`)

Cuentas documentadas en la pantalla de login (contraseña: `demo1234`):

| Cuenta | Rol | Especialidad | Permisos |
|---|---|---|---|
| `ciudadano@demo.yvy` | ciudadano | — | reports propios |
| `bomberos@demo.yvy` | agente | bomberos | incidents:read/create/verify, reports:read/verify, alerts:read, sensors:read, sources:read, hydrology:read, history:read, scenarios:run, informes:generate |
| `hidrica@demo.yvy` | agente | hidrica_ambiental | ídem bombers (sin informes:generate) + **sensors:manage** (carga manual de lecturas de estaciones) |
| `coordinador@demo.yvy` | agente | gobierno_defensa | ídem + **alerts:publish** |
| `analista@demo.yvy` | agente | analista | incidents:read, reports:read, alerts:read, sensors:read, sources:read, hydrology:read, history:read, **scenarios:run**, **informes:generate** |
| `admin@demo.yvy` | admin | — | users:read/manage, orgs:read/manage, sources:read/manage, sensors:read/manage, audit:read, settings:read/manage, integrations:read, history:read. **Sin** alerts:publish ni incidents:verify. |

## 5. Reglas obligatorias aplicadas

1. El frontend nunca es la única barrera: en producción `firestore.rules` reevalúa identidad,
   rol y permisos (`users/{uid}`) en cada operación.
2. Rutas privadas protegidas por guard (sin sesión → denegado; sin permiso → 403).
3. Ciudadano: solo recursos públicos + sus propios reportes; jamás puede cambiar estados.
4. Agente: operaciones limitadas por permiso; escribir `role`/`permissions` le está vedado.
5. Admin: gestión técnica con auditoría; sin permisos institucionales por defecto.
6. Identificadores del cliente no confieren acceso (ownership verificado en reglas).
7. Toda acción privilegiada escribe en `audit_logs`.
8. Ausencia de sesión válida = denegación de toda operación privada.
