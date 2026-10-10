# YVY RESILIENTE — CONTEXTO DEL PROYECTO

> Este documento consolida el contexto funcional maestro de Yvy Resiliente.
> El contexto original de producto se mantiene en `/PROJECT.CONTEXT.md` (raíz).

## 1. Identidad del producto

**Nombre:** Yvy · **Nombre completo:** Yvy Resiliente
**Tipo:** Web App responsive de inteligencia territorial y apoyo a la gestión de riesgos ambientales.
**Región inicial:** Corrientes y Chaco, Argentina (Esteros del Iberá, cuenca media del Paraná).

Yvy integra información ambiental, meteorológica, hidrológica, satelital y geoespacial para
comprender amenazas, evaluar escenarios, identificar zonas vulnerables y mejorar la toma de
decisiones. No sustituye el criterio profesional ni los protocolos oficiales de emergencia.

## 2. Dominios principales

1. **Incendios** forestales, rurales y de pastizales (inspirado en PyroScan Iberá): focos
   satelitales, incidentes, verificación, evolución, condiciones ambientales.
2. **Inundaciones y eventos hídricos extremos** (inspirado en la Plataforma Integral de
   Resiliencia ante ENOS): niveles de ríos, lluvias intensas, anegamientos urbanos, drenajes,
   escenarios de crecidas.

Un foco detectado **no** es un incendio confirmado. Un reporte ciudadano **no** es una
confirmación oficial. La plataforma distingue: observado / reportado / verificado / derivado /
modelado / simulado / sin verificar / desactualizado / no disponible.

## 3. Usuarios y ámbitos

| Ámbito | Ruta base | Necesidad |
|---|---|---|
| **Ciudadano** | `/ciudadano` | Alertas públicas, mapa público, información ambiental de su localidad, reportar incidentes y consultar el estado de sus reportes. |
| **Agente / organismo** | `/agente` | Dashboard operativo, mapa técnico, incidentes, verificación de reportes, alertas, sensores, fuentes, hidrología, escenarios, historial e informes, según especialidad y permisos. |
| **Administrador** | `/admin` | Usuarios, roles y permisos, organismos, fuentes, sensores, configuración, integraciones y auditoría. |

Especialidades de agente previstas: **meteorología**, **bomberos**, **gestión hídrica y
ambiental**, **gobierno/municipio/Defensa Civil**, **analista**. Las especialidades se
representan mediante permisos explícitos, nunca por el nombre del rol ni por etiquetas del
cliente. Un usuario pertenece a un organismo y puede tener varias especialidades.

El administrador técnico **no** recibe automáticamente atribuciones institucionales
(publicar alertas oficiales, verificar emergencias): esas acciones requieren permisos
operativos explícitos.

## 4. Ciclo de vida de un reporte ciudadano

`Recibido → En verificación → Confirmado o Descartado → Cerrado`

El estado lo administran operaciones autorizadas (agentes con permiso), nunca el ciudadano.

## 5. Ciclo de vida de un incidente

`Detección / Reportado → En verificación → Confirmado → En gestión → Controlado → Cerrado`
(+ `Descartado` para falsas alarmas). Toda transición queda registrada con autor y marca
temporal, y genera auditoría cuando es privilegiada.

## 6. Principios de datos

- Los datos operativos provienen del almacén de datos (Firestore) a través de repositorios.
- Los datos externos provienen de adaptadores por fuente; si el proveedor no está conectado,
  el sistema lo dice explícitamente ("Pendiente de integración") y no inventa datos.
- Los indicadores son derivados (contados/calculados desde datos reales disponibles).
- La configuración vive centralizada (`src/config/appConfig.ts`, colección `settings`, variables de entorno).
- Los datos de demostración están aislados en fixtures etiquetados y solo se cargan en
  **modo demo**, que es intencional y visible en la interfaz.

## 7. Principios de seguridad

- Firebase Authentication para las áreas privadas; modo demo explícito para desarrollo local.
- Autorización: RBAC + permisos por operación + visibilidad pública de recursos.
- La frontera real de autorización en producción son las **Firestore Security Rules**
  (`firestore.rules`); el frontend nunca es la única barrera.
- Ciudadanos: solo ven recursos públicos y sus propios reportes.
- Agentes: ven lo que sus permisos y su organismo habilitan.
- Admin: gestiona configuración y usuarios con trazabilidad.
- Las acciones privilegiadas se auditan (colección `audit_logs`).
- Sin secretos en el código cliente; credenciales por variables de entorno.

## 8. Objetivo técnico

Arquitectura modular por capas: Presentación → Servicios de aplicación (casos de uso) →
Repositorios/Adaptadores → Firestore / APIs externas / Sensores. Ver
`docs/ARCHITECTURE.md`.
