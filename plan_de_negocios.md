# PLAN DE NEGOCIOS: YVY RESILIENTE
## Plataforma de Inteligencia Territorial y Gestión de Riesgos Ambientales

---

### DATOS GENERALES DEL PROYECTO
* **Nombre de la Startup:** Yvy (Yvy Resiliente)
* **Sector / Industria:** GovTech / ClimateTech / Inteligencia Geoespacial
* **Región de Inicio:** Provincias de Corrientes y Chaco, República Argentina (Región NEA / Cuenca del Plata)
* **Nivel de Madurez Tecnológica:** Producto Mínimo Viable (MVP) operativo y probado en arquitectura desacoplada (Frontend Vue 3 + TypeScript, Backend Cloud Firestore / Storage con RBAC y modo demo local offline).
* **Fecha de Emisión:** Octubre de 2026

---

## 1. RESUMEN EJECUTIVO

### 1.1. Breve descripción de la startup, misión y visión
**Yvy Resiliente** es una plataforma web responsive de inteligencia territorial diseñada para transformar la manera en que gobiernos locales, organismos de emergencia y ciudadanos comprenden, monitorean y responden ante eventos climáticos extremos. Focalizada inicialmente en las dos mayores amenazas ambientales del Nordeste Argentino —los incendios de pastizales y bosques (Esteros del Iberá) y las inundaciones fluviales y anegamientos urbanos (ríos Paraná, Paraguay y cuenca media)—, Yvy integra telemetría de campo, observaciones satelitales, datos hidrometeorológicos y reportes ciudadanos en una interfaz unificada y accionable.

* **Misión:** Empoderar a los municipios, cuerpos de bomberos, defensas civiles y comunidades con una plataforma de inteligencia territorial unificada, convirtiendo datos dispersos en decisiones operativas y preventivas transparentes para proteger vidas, infraestructura y biodiversidad.
* **Visión:** Convertirse para 2029 en el estándar regional del Cono Sur en software de gestión anticipatoria de riesgos climáticos y coordinación interinstitucional para Ciudades y Territorios Resilientes.

### 1.2. El problema que se resuelve y la diferenciación competitiva
Históricamente, la gestión de crisis climáticas en América Latina es predominantemente **reactiva**. La información relevante se encuentra dispersa entre múltiples agencias y formatos incompatibles:
1. Una medición de lluvia aislada no le indica a un municipio qué calles van a anegarse.
2. Un foco de calor satelital no describe por sí solo la dirección del avance del fuego ni la infraestructura en riesgo.
3. Los reportes comunitarios en redes sociales o llamadas telefónicas saturan los conmutadores de emergencia sin aportar coordenadas geográficas confiables ni trazabilidad.
4. Las soluciones existentes en el mercado son visores cartográficos genéricos (GIS) diseñados para científicos o analistas de gabinete, excesivamente caros y desconectados de la toma de decisiones en el terreno.

**Diferenciación Competitiva:**
* **Triple experiencia coordinada:** Rutas especializadas para el Ciudadano (`/ciudadano`), el Agente Operativo (`/agente`) y el Administrador Institucional (`/admin`).
* **Honestidad ontológica de datos:** A diferencia de sistemas opacos, Yvy clasifica cada dato según su naturaleza: *observado*, *reportado*, *verificado*, *derivado*, *modelado* o *simulado*. Nunca inventa datos ni oculta la antigüedad o confiabilidad de una fuente.
* **Ciclo de vida operativo completo:** Convierte los reportes ciudadanos no estructurados en incidentes con trazabilidad inmutable, asignación de responsables y estados verificables auditados.
* **Simulación de escenarios:** Permite a los comités de crisis evaluar escenarios hipotéticos de precipitación o comportamiento de fuego con supuestos y limitaciones explícitas.

### 1.3. Proyecciones de crecimiento y rentabilidad
Con una estrategia de comercialización B2G (Business-to-Government) para municipios y gobernaciones provinciales, complementada con suscripciones B2B para consorcios forestales, agroindustriales y aseguradoras:
* **Año 1:** Consolidación en 8 municipios críticos de Corrientes y Chaco y 2 consorcios privados. Ingresos anuales proyectados: **USD 84.000**.
* **Año 2:** Expansión a 28 municipios en Corrientes, Chaco, Formosa, Misiones y Santa Fe Norte. Ingresos anuales proyectados: **USD 310.000** (Alcanzando el punto de equilibrio en el mes 14).
* **Año 3:** Escala interprovincial en la Cuenca del Plata y primeros pilotos en Paraguay y Uruguay (65 municipios + 3 provincias + 15 clientes corporativos). Ingresos anuales proyectados: **USD 920.000** con un margen EBITDA superior al 48%.

---

## 2. DESCRIPCIÓN DE LA EMPRESA

### 2.1. Historia del proyecto y equipo fundador
Yvy nació como respuesta directa a las sucesivas crisis climáticas del Noreste Argentino: los catastróficos incendios que consumieron más del 12% de la provincia de Corrientes en 2022 y las recurrentes crecidas del Río Paraná asociadas al fenómeno de El Niño (ENOS). La iniciativa surgió al constatar que las defensas civiles y cuarteles de bomberos voluntarios debían alternar entre llamadas de WhatsApp, mapas estáticos en papel y páginas meteorológicas saturadas para tomar decisiones críticas.

El equipo fundador combina capacidades multidisciplinarias indispensables:
* **Líder de Producto & GovTech:** Especialista en gestión de políticas públicas, planificación urbana y relaciones institucionales con gobiernos municipales.
* **Arquitecto de Software & Cloud (CTO):** Desarrollador Full-Stack Senior con trayectoria en arquitecturas desacopladas, Vue 3, TypeScript, Firebase, microservicios y sistemas geoespaciales.
* **Especialista en Datos Geoespaciales & Ciencias de la Tierra:** Ingeniero ambiental / hidrólogo con experiencia en teledetección (sensores MODIS/VIIRS), modelado de cuencas y SIG.
* **Líder de Experiencia de Usuario (UI/UX) & Operaciones de Campo:** Diseñador especializado en interfaces de misión crítica, accesibilidad ciudadana y protocolos de campo para brigadas de emergencia.

### 2.2. Estructura legal y organizacional
* **Forma Jurídica:** Sociedad por Acciones Simplificada (S.A.S.) radicada en Argentina, con estructura estatutaria orientada a la captación de inversión de capital de riesgo (Venture Capital / Impact Funds).
* **Gobernanza:** Directorio compuesto por los fundadores con asesoría externa de un Consejo Consultivo integrado por exdirectores de Defensa Civil y especialistas de la Universidad Nacional del Nordeste (UNNE).

```
                      ┌────────────────────────┐
                      │    Dirección General   │
                      │         (CEO)          │
                      └───────────┬────────────┘
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  Tecnología &   │      │   Operaciones   │      │  Desarrollo de  │
│  Producto (CTO) │      │  Territoriales  │      │  Negocios B2G   │
└────────┬────────┘      └────────┬────────┘      └────────┬────────┘
         │                        │                        │
  • Dev Frontend/Backend   • Relaciones Cuarteles   • Licitaciones & Convenios
  • Datos Satelitales/GIS  • Soporte a Municipios   • Venta B2B Agroforestal
  • Infraestructura Cloud  • Capacitación en Campo  • Comunicación Institucional
```

### 2.3. Propuesta de valor única y diferenciación competitiva
La propuesta de valor de Yvy se sintetiza en la premisa: **"Inteligencia territorial honesta, accionable y compartida para la toma de decisiones en tiempo real"**.

1. **Unificación sin fricción:** Cruza en un único lienzo la información satelital (NASA FIRMS / INPE), hidrométrica oficial (Prefectura Naval Argentina), meteorológica (Open-Meteo / SMN), telemetría comunitaria y reportes de vecinos.
2. **Control de Acceso Basado en Roles (RBAC) con Rigor Forense:** Cada acción crítica (verificar un foco, elevar el nivel de una alerta, cerrar un incidente) requiere permisos explícitos y queda asentada en un registro de auditoría inmutable (`audit_logs`).
3. **Resiliencia Operativa Offline/Local:** Gracias a su arquitectura desacoplada por repositorios y su soporte dual (modo demo local persistente y producción en la nube), el sistema puede operar en salas de crisis municipales aun con enlaces de internet intermitentes.

---

## 3. ANÁLISIS DE MERCADO Y COMPETENCIA

### 3.1. Identificación del mercado objetivo y tamaño

#### Definición de Mercados (TAM / SAM / SOM)
* **TAM (Total Addressable Market - Mercado Total Global/Regional):** 
  Mercado de software de gestión de emergencias, resiliencia climática y GIS municipal en América Latina y el Caribe. Estimado en **USD 480 millones anuales** para 2027, traccionado por las exigencias internacionales de adaptación al cambio climático y fondos de financiamiento verde (BID, Banco Mundial).
* **SAM (Serviceable Addressable Market - Mercado Disponible en Argentina y Países Limítrofes):** 
  Aproximadamente 2.200 municipios, 24 jurisdicciones provinciales en Argentina, más departamentos fronterizos de Paraguay y Uruguay situados sobre cuencas hídricas activas o zonas de interfaz urbano-forestal. Estimado en **USD 35 millones anuales**.
* **SOM (Serviceable Obtainable Market - Mercado Objetivo Captable en 36 meses):** 
  65 municipios vulnerables de las provincias de Corrientes, Chaco, Misiones, Formosa y Entre Ríos, 3 defensas civiles provinciales y 20 grandes consorcios forestales y agropecuarios privados. Estimado en **USD 1,2 millones anuales**.

#### Segmentos Principales de Demanda
1. **Gobiernos Municipales (B2G Local):** Secretarías de Gobierno, Obras Públicas, Medio Ambiente y Defensas Civiles locales que carecen de herramientas digitales propias y dependen de planillas de cálculo.
2. **Gobiernos Provinciales (B2G Regional):** Direcciones de Defensa Civil, Ministerios de Seguridad y Producción que necesitan coordinar múltiples departamentos o circunscripciones operativas.
3. **Cuerpos de Bomberos Voluntarios y Brigadas Forestales:** Organismos de primera intervención que requieren saber accesibilidad de rutas, puntos críticos y evolución de focos de calor.
4. **Sector Agroindustrial y Forestal (B2B Privado):** Productores de madera, yerba mate, arroz y ganado con grandes extensiones de tierra expuestas a incendios intencionales o accidentales y sequías/inundaciones.

### 3.2. Análisis de la competencia

| Criterio | Yvy Resiliente | Sistemas GIS Tradicionales (Esri ArcGIS, QGIS) | Apps Meteorológicas (Windy, SMN) | Plataformas de Tickets Municipales (Munidigital, etc.) |
|---|---|---|---|---|
| **Enfoque Principal** | Inteligencia territorial y gestión de emergencias climáticas | Análisis geoespacial técnico y cartografía estática | Consulta meteorológica general | Reclamos de servicios públicos (baches, luminarias) |
| **Público Objetivo** | Ciudadanos + Agentes Operativos + Administradores | Especialistas y analistas GIS | Público general / navegantes | Vecinos y secretarías de mantenimiento urbano |
| **Ciclo de Vida de Emergencias** | **Nativo y trazable** (Reporte → Verificación → Incidente → Cierre) | Inexistente (requiere plugins o desarrollos a medida caros) | Nulo | Genérico para reclamos urbanos, sin soporte de riesgo ambiental |
| **Simulación de Escenarios** | **Integrada** (Fuego, niveles hídricos, lluvia con hipótesis) | Posible pero compleja y costosa | Solo previsiones numéricas de modelos atmosféricos | Inexistente |
| **Costo de Adopción** | Modelo SaaS accesible, despliegue en minutos vía web | Muy alto (licencias de miles de dólares por estación) | Gratuito o suscripción individual | Medio / Alto |
| **Rigor Ontológico de Datos** | **Distingue datos observados, reportados, simulados y desactualizados** | No tipificado operativamente | Solo datos brutos | No aplica |

### 3.3. Análisis FODA (SWOT)

```
╔══════════════════════════════════════════╦══════════════════════════════════════════╗
║              FORTALEZAS                  ║               OPORTUNIDADES              ║
╠══════════════════════════════════════════╬══════════════════════════════════════════╣
║ • MVP completamente funcional y probado  ║ • Creciente frecuencia de eventos        ║
║   en arquitectura moderna.               ║   climáticos extremos (Niño/Niña).       ║
║ • Arquitectura desacoplada y modular     ║ • Mandatos y fondos internacionales     ║
║   (independencia de proveedores).        ║   de financiamiento para resiliencia.    ║
║ • UX diferenciada por perfil (evita la   ║ • Escasez de soluciones locales          ║
║   confusión de interfaces genéricas).    ║   adaptadas a la realidad del NEA.       ║
║ • Modelo de honestidad de datos con      ║ • Posibilidad de venta cruzada a         ║
║   auditoría y control de permisos (RBAC).║   aseguradoras y consorcios forestales.  ║
╠══════════════════════════════════════════╬══════════════════════════════════════════╣
║              DEBILIDADES                 ║                 AMENAZAS                 ║
╠══════════════════════════════════════════╬══════════════════════════════════════════╣
║ • Marca en etapa inicial sin presencia   ║ • Ciclos de cobro y burocracia en        ║
║   masiva en el mercado.                  ║   contrataciones del sector público.     ║
║ • Dependencia de convenios para el paso  ║ • Inestabilidad macroeconómica regional. ║
║   directo de APIs estatales oficiales.   ║ • Resistencia cultural al cambio en      ║
║ • Equipo de ventas en formación.         ║   cuarteles y dependencias tradicionales.║
╚══════════════════════════════════════════╩══════════════════════════════════════════╝
```

---

## 4. PRODUCTO / SERVICIO: DETALLE PROFUNDO DEL MVP

### 4.1. Descripción detallada del MVP ya construido
El MVP de Yvy Resiliente no es un prototipo gráfico ni un mockup estático; es una **aplicación web de una sola página (SPA) completamente implementada, tipada de punta a punta y funcional**, estructurada bajo una arquitectura modular limpia orientada al dominio.

* **Frontend:** Vue 3 (Composition API con `<script setup>`), TypeScript estricto, Tailwind CSS 4, Vite como empaquetador ultrarrápido y Vue Router con guardias de navegación por roles y permisos.
* **Backend y Persistencia:** Doble adaptador backend mediante el patrón de repositorio desacoplado (`src/repositories/contracts.ts`):
  1. *Adaptador Firebase (Producción):* Integra Firebase Authentication, Cloud Firestore y Cloud Storage. Toda la seguridad descansa en reglas de servidor formales (`firestore.rules` y `storage.rules`) que garantizan que ningún usuario pueda escalar permisos ni alterar recursos ajenos.
  2. *Adaptador Demo Local (Desarrollo/Offline):* Motor local sobre `localStorage` con fixtures completos y persistencia real entre recargas de página, permitiendo demostraciones comerciales y pruebas en campo sin necesidad de conectividad a internet ni credenciales activas.

### 4.2. Las tres experiencias de usuario implementadas en el código

#### A. Experiencia Ciudadana (`/ciudadano`)
Diseñada con máxima claridad visual, libre de jerga técnica compleja, con el objetivo de empoderar al vecino y canalizar la ayuda comunitaria:
1. **Inicio Ciudadano (`CitizenHomeView`):** Semáforo del estado ambiental de la localidad (riesgo de fuego, nivel de ríos, índice de precipitaciones), resumen de alertas activas emitidas por autoridades y accesos directos de acción.
2. **Alertas Públicas (`CitizenAlertsView` y `CitizenAlertDetailView`):** Listado filtrable de alertas por severidad (`info`, `aviso`, `alerta`, `emergencia`) e instrucciones de autoprotección oficiales emitidas por Defensa Civil.
3. **Mapa Ciudadano (`CitizenMapView`):** Visor interactivo simplificado que proyecta las amenazas confirmadas, focos activos y zonas de precaución sin abrumar con capas complejas.
4. **Formulario de Reporte Ciudadano (`CitizenReportFormView`):**
   * Reporte de incidentes (incendio, humo, inundación, calle anegada, camino cortado).
   * Detección geográfica automática o selección asistida de coordenadas (`lat`/`lng`).
   * Carga de evidencia fotográfica (con validación de tamaño ≤ 5 MB y tipo MIME).
   * Opción de anonimato o vinculación a la cuenta del usuario.
5. **Seguimiento de "Mis Reportes" (`CitizenMyReportsView` y `CitizenReportDetailView`):** Línea de tiempo interactiva que muestra con total transparencia cada cambio de estado efectuado por las autoridades (`Recibido` → `En verificación` → `Confirmado` / `Descartado` → `Cerrado`), con notas de resolución oficiales.
6. **Información Ambiental Local (`CitizenEnvironmentView`):** Panel detallado de condiciones meteorológicas, viento, humedad, recomendaciones preventivas y teléfonos de emergencia de la jurisdicción.

#### B. Experiencia Agente / Institucional (`/agente`)
Centro de comando y control para operadores de emergencias, bomberos, técnicos hidráulicos y autoridades municipales:
1. **Dashboard Operativo (`AgentDashboardView`):** Métricas clave (KPIs) calculadas en tiempo real: incidentes activos, focos satelitales del día, reportes ciudadanos pendientes de triaje, estaciones hidrométricas en alerta o evacuación, y estado de la red de sensores.
2. **Mapa Técnico Multicapa (`AgentMapView`):** Visualizador territorial avanzado con conmutación dinámica de capas: focos satelitales térmicos, incidentes oficiales, reportes vecinales no verificados, estaciones de río y puntos críticos de infraestructura (escuelas, hospitales, puentes).
3. **Gestión del Ciclo de Vida de Incidentes (`AgentIncidentsView`, `AgentIncidentDetailView`, `AgentIncidentNewView`):**
   * Clasificación por tipo (`incendio`, `inundacion`, `anegamiento`, etc.) y prioridad (`baja`, `media`, `alta`, `critica`).
   * Máquina de estados formal: `Detección` → `En verificación` → `Confirmado` → `En gestión` → `Controlado` → `Cerrado` (o `Descartado`).
   * Historial de eventos embebido con registro de actor, timestamp y bitácora operativa.
   * Interruptor de visibilidad pública (`publicViewable`): los bomberos pueden trabajar un incidente de manera interna antes de difundirlo al mapa del ciudadano para evitar pánico.
4. **Módulo de Verificación de Reportes Comunitarios (`AgentReportsVerificationView`):** Bandeja de triaje donde los operadores revisan fotos y reportes enviados por los vecinos, descartan falsas alarmas con notas justificativas o confirman el evento promoviéndolo automáticamente a un incidente oficial.
5. **Monitoreo Hidrológico y Fluvial (`AgentHydrologyView`):** Tabla de estaciones de referencia (inspirada en la Prefectura Naval Argentina: Paso de la Patria, Corrientes, Barranqueras, Goya, etc.), indicando altura actual en metros, tendencia (`CRECE`, `BAJA`, `ESTACIONARIO`), variación horaria y cotas de alerta y evacuación.
6. **Red y Telemetría de Sensores (`AgentSensorsView`):** Estado de salud de dispositivos IoT en terreno (pluviómetros, sensores de nivel ultrasónicos, estaciones meteorológicas), indicando conectividad, batería y señal RSSI.
7. **Simulador de Escenarios Predictivos (`AgentScenariosView`):** Motor de cálculo paramétrico para simular:
   * *Escenarios de Fuego:* Estimación de velocidad de avance y hectáreas amenazadas según velocidad del viento, temperatura y humedad relativa del combustible.
   * *Escenarios Hídricos:* Estimación de escorrentía, colapso de drenajes pluviales y barrios en riesgo ante lluvias acumuladas de 50 mm, 100 mm o 150 mm en 24 h.
   * *Honestidad Científica:* El módulo declara taxativamente sus supuestos y limitaciones técnicas (`reglas-demo-v1`), evitando falsas precisiones.
8. **Centro de Alertas Oficiales (`AgentAlertsView`):** Redacción, aprobación y publicación de alertas zonales con vigencia temporal estricta.
9. **Historial Territorial e Informes Técnicos (`AgentHistoryView`, `AgentInformesView`):** Comparación histórica entre temporadas y generación de reportes consolidados para elevar a ministerios o secretarías de hacienda.

#### C. Experiencia Administrador (`/admin`)
Gestión de la infraestructura digital y gobernanza del sistema:
1. **Gestión de Usuarios y Roles (`AdminUsersView`):** Altas, bajas y asignación de especialidades técnicas (`Meteorología`, `Bomberos`, `Gestión Hídrica`, `Defensa Civil`, `Analista`) y permisos atómicos (`incidents:write`, `reports:verify`, `alerts:publish`, etc.).
2. **Organizaciones Territoriales (`AdminOrganizationsView`):** Administración de cuarteles de bomberos, municipios y dependencias de defensa civil con asignación de territorio jurisdiccional.
3. **Catálogo de Fuentes de Información (`AdminSourcesView`):** Inventario de proveedores (NASA FIRMS, Open-Meteo, Prefectura Naval, SMN, INPE) con estado de conexión y variables de entorno requeridas.
4. **Estado de Integraciones en Vivo (`AdminIntegrationsView`):** Diagnóstico en tiempo real que distingue qué servicios están conectados y cuáles están "Pendientes de integración", asegurando total transparencia.
5. **Auditoría del Sistema (`AdminAuditView`):** Registro cronológico inmutable de todas las acciones privilegiadas realizadas en la plataforma (quién verificó un reporte, quién publicó una alerta, quién alteró un rol), clave para peritajes legales post-siniestro.
6. **Configuración Global (`AdminSettingsView`):** Ajuste de parámetros del territorio, coordenadas por defecto y mensajes del sistema.

### 4.3. Características técnicas y beneficios del MVP
* **Arquitectura Hexagonal / Repository Pattern:** El código de las vistas nunca invoca directamente a la base de datos ni a APIs externas. Se comunica a través de contratos tipados (`src/repositories/contracts.ts`), permitiendo cambiar de proveedor o tecnología en el futuro sin reescribir la interfaz.
* **Manejo Exhaustivo de Estados de Consulta:** Cada componente implementa formalmente los estados `loading`, `ok`, `empty`, `error`, `stale` (datos viejos) y `demo` a través de un composable reutilizable (`useQueryState`).
* **Seguridad de Nivel Gubernamental:** Reglas de Firestore que impiden cualquier modificación de permisos por fuera de un usuario administrador verificado, garantizando cumplimiento de normativas de protección de datos.

### 4.4. Roadmap de evolución tecnológica post-MVP
1. **Fase 1 (Corto Plazo - Meses 1 a 3):** Sustitución del visor cartográfico SVG actual por MapLibre GL / Leaflet con soporte de teselas vectoriales sin conexión (offline-first) y capas oficiales WMS del Instituto Geográfico Nacional (IGN).
2. **Fase 2 (Medio Plazo - Meses 4 a 6):** Conexión automatizada de Cloud Functions para la ingesta periódica de datos de la API NASA FIRMS (focos satelitales en tiempo real) y scraping legal / ingesta de boletines de Prefectura Naval Argentina.
3. **Fase 3 (Largo Plazo - Meses 7 a 12):** Despliegue de **"Yvy AI"**, asistente inteligente de lenguaje natural sustentado en Retrieval-Augmented Generation (RAG) para consultar normativas de defensa civil, protocolos de evacuación y resúmenes ejecutivos territoriales en segundos.

---

## 5. MODELO DE NEGOCIO

### 5.1. Mecanismos de generación de ingresos
Yvy opera bajo un modelo híbrido **B2G (Business-to-Government) SaaS** como núcleo principal, complementado con licencias corporativas B2B y servicios profesionales especializados:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FUENTES DE INGRESOS                             │
├──────────────────────────┬─────────────────────────┬───────────────────┤
│ 1. Suscripción B2G Munis │ 2. Licencias B2B Agro   │ 3. Servicios Pro  │
│    y Provincias (SaaS)   │    y Forestal (SaaS)    │    y Consultoría  │
│    (65% de la facturación│    (25% de la           │    (10% de la     │
│     proyectada)          │     facturación)        │     facturación)  │
└──────────────────────────┴─────────────────────────┴───────────────────┘
```

1. **Suscripción SaaS Municipal (B2G):** Contratos anuales con municipios según su escala poblacional y complejidad geográfica. Incluye acceso ilimitado para agentes de Defensa Civil, Bomberos y Tránsito, panel de administración y soporte técnico.
   * *Nivel Tier 1 (Municipios < 30.000 hab.):* USD 350 / mes (facturación anual de USD 4.200).
   * *Nivel Tier 2 (Municipios de 30.000 a 100.000 hab.):* USD 750 / mes (facturación anual de USD 9.000).
   * *Nivel Tier 3 (Ciudades Capitales / Grandes Municipios):* USD 1.500 / mes (facturación anual de USD 18.000).
2. **Licencias Provinciales / Regionales (B2G):** Plataforma centralizadora para ministerios de seguridad o direcciones provinciales de defensa civil para monitorear múltiples departamentos de forma agregada: USD 35.000 a USD 50.000 / año.
3. **Suscripción B2B para Consorcios Forestales y Agroindustria:** Empresas con grandes superficies de pino, eucalipto o cultivos que necesitan monitoreo satelital continuo de focos de calor, alertas tempranas de viento desecante y coordinación directa con los cuarteles locales: USD 500 a USD 1.200 / mes según cantidad de hectáreas monitoreadas.
4. **Servicios de Despliegue, Integración IoT y Parametrización:** Parametrización inicial de cuencas de drenaje urbano, integración de sensores pluviométricos e hidrométricos existentes y jornadas presenciales de capacitación para brigadas operativas (tarifa por proyecto: USD 2.500 a USD 6.000).

### 5.2. Segmentación de clientes y propuestas de valor

* **Para el Municipio / Intendente:** Reduce los costos económicos de la reconstrucción post-desastre, evita pérdidas de vidas humanas y brinda un canal moderno y transparente de comunicación directa con el vecino.
* **Para los Bomberos Voluntarios y Defensa Civil:** Elimina el caos operativo en las salas de situación, reduce en más de un 40% el tiempo de triaje de emergencias y aporta información contextual crítica (dirección del viento, proximidad de viviendas, caminos anegados).
* **Para las Empresas Agroforestales:** Protección activa de activos de alto valor económico (bosques cultivados, maquinaria agrícola) y mitigación de pérdidas materiales.
* **Para el Ciudadano (Bien Público):** Acceso completamente gratuito, confiable y sin publicidad a alertas tempranas y la certeza de que su reporte comunitario llega directamente a quienes deben responder.

### 5.3. Canales de distribución y entrega
* **Plataforma Web Responsive (PWA):** Distribución directa en la nube sin necesidad de descargas pesadas desde tiendas de aplicaciones, garantizando funcionamiento fluido en computadoras de escritorio, tablets operativas de patrullas y teléfonos celulares de vecinos.
* **Proceso de Venta Consultiva B2G:** Presentaciones directas en concejos deliberantes, comisiones de emergencia y secretarías de hacienda.
* **Convenios Marco con Federaciones de Bomberos:** Acuerdo de adopción y uso preferencial con la Federación de Bomberos Voluntarios de Corrientes y Chaco para actuar como canal de recomendación hacia las intendencias locales.

---

## 6. PLAN DE MARKETING Y VENTAS

### 6.1. Estrategia de marketing institucional y posicionamiento
En el sector GovTech y de gestión de desastres, la confianza y la legitimidad técnica son los mayores impulsores de compra:
1. **Programa "Municipio Resiliente Piloto" (Validación Ágil):** Ofrecimiento de un piloto operativo gratuito de 45 días a 3 municipios estratégicos con alto historial de anegamientos e incendios (ej. Paso de la Patria, Corrientes Capital y Barranqueras). Durante el piloto se miden métricas de respuesta y satisfacción ciudadana, transformando los resultados en casos de estudio cuantificables para la venta institucional.
2. **Alianzas Científico-Académicas:** Convenios de colaboración técnica con la Facultad de Ciencias Exactas y Naturales y Agrimensura (FaCENA - UNNE) y centros de investigación regional para validar los modelos de simulación y las metodologías de estimación de vulnerabilidad.
3. **Presencia en Foros Especializados:** Ponencias y demostraciones en vivo en el Congreso Nacional de Protección Civil, Cumbres de Ciudades Inteligentes (Smart Cities Expo) y encuentros de la Red Argentina de Municipios contra el Cambio Climático (RAMCC).
4. **Marketing Cívico Comunitario:** Materiales gráficos y campañas en redes sociales provistas a los municipios clientes ("Cuidemos nuestro barrio con Yvy") para fomentar la adopción ciudadana del canal de reportes.

### 6.2. Estrategia comercial y embudo de ventas B2G
El ciclo de venta gubernamental se gestiona a través de un embudo estructurado para reducir la fricción burocrática:

```
[1. Prospección y Mapeo] ──> Identificación de intendencias con emergencias climáticas recientes.
            │
[2. Demostración en Vivo] ──> Demostración operativa con datos reales del territorio municipal.
            │
[3. Piloto 45 Días] ───────> Despliegue inmediato en modo demo / producción para el comité de crisis.
            │
[4. Dictamen Técnico] ────> Aprobación del Jefe de Bomberos y Director de Defensa Civil.
            │
[5. Formalización B2G] ────> Contratación directa por vía de emergencia / ordenanza municipal.
            │
[6. Éxito y Retención] ────> Capacitación continua, informes anuales de gestión y renovación de contrato.
```

### 6.3. Estructura de precios y promociones
* **Esquema de Contratación Anual:** Descuento del 15% por pago anual adelantado (modalidad estándar preferida por presupuestos municipales).
* **Bundle Intermunicipal:** Descuentos del 20% para consorcios de municipios colindantes pertenecientes a una misma microcuenca o departamento provincial.
* **Garantía de Servicio (SLA):** Disponibilidad garantizada del 99.8% con soporte técnico prioritario 24/7 durante contingencias climáticas declaradas.

---

## 7. PROYECCIONES FINANCIERAS (HORIZONTE A 3 AÑOS)

### 7.1. Premisas macroeconómicas y operativas
* Moneda de proyección: Dólares estadounidenses (USD), para mantener consistencia frente a la volatilidad cambiaria local.
* Ciclo de cobranza promedio en sector B2G: 45 a 60 días.
* Tasa de renovación anual de contratos (Retención): 92% (alta inercia y dependencia positiva una vez institucionalizado el sistema en el protocolo municipal).
* Infraestructura en la nube basada en consumo elástico (Firebase Blaze Plan / Google Cloud Platform), manteniendo costos fijos muy bajos al inicio.

### 7.2. Proyección de ingresos y volumen de clientes

| Concepto | Año 1 | Año 2 | Año 3 |
|---|---|---|---|
| **Municipios Clientes (Tier 1 y 2)** | 8 | 24 | 55 |
| **Grandes Ciudades / Capitales (Tier 3)** | 1 | 4 | 10 |
| **Gobiernos Provinciales** | 0 | 1 | 3 |
| **Consorcios Privados Agroforestales** | 2 | 8 | 18 |
| **Ingresos SaaS Municipal** | USD 52.800 | USD 184.000 | USD 495.000 |
| **Ingresos SaaS Provincial** | USD 0 | USD 35.000 | USD 120.000 |
| **Ingresos SaaS Privado B2B** | USD 19.200 | USD 67.000 | USD 215.000 |
| **Servicios de Despliegue y Capacitación** | USD 12.000 | USD 24.000 | USD 90.000 |
| **TOTAL INGRESOS BRUTOS** | **USD 84.000** | **USD 310.000** | **USD 920.000** |

### 7.3. Estructura de costes y gastos operativos

| Rubro de Gastos | Año 1 | Año 2 | Año 3 |
|---|---|---|---|
| **Infraestructura Cloud, Hosting y APIs** | USD 4.800 | USD 14.500 | USD 38.000 |
| **Equipo de Ingeniería y Desarrollo (3 FTE)** | USD 48.000 | USD 95.000 | USD 180.000 |
| **Equipo Comercial, GovTech y Campo (2 FTE)** | USD 24.000 | USD 62.000 | USD 130.000 |
| **Marketing, Eventos y Pilotos** | USD 6.000 | USD 18.000 | USD 35.000 |
| **Gastos Legales, Contables y Administrativos** | USD 4.200 | USD 9.500 | USD 22.000 |
| **Soporte y Capacitación en Territorio** | USD 5.000 | USD 16.000 | USD 40.000 |
| **TOTAL COSTOS Y GASTOS OPERATIVOS** | **USD 92.000** | **USD 215.000** | **USD 445.000** |

### 7.4. Estado de resultados proyectado y punto de equilibrio

| Estado de Resultados | Año 1 | Año 2 | Año 3 |
|---|---|---|---|
| **Ingresos Brutos** | USD 84.000 | USD 310.000 | USD 920.000 |
| **Costos Directos del Servicio (Cloud + APIs)** | (USD 4.800) | (USD 14.500) | (USD 38.000) |
| **Margen Bruto** | **USD 79.200 (94%)** | **USD 295.500 (95%)** | **USD 882.000 (96%)** |
| **Gastos Operativos (OPEX)** | (USD 87.200) | (USD 200.500) | (USD 407.000) |
| **EBITDA** | **(USD 8.000)** | **+ USD 95.000** | **+ USD 475.000** |
| **Margen EBITDA** | *- 9.5%* | *+ 30.6%* | *+ 51.6%* |

* **Punto de Equilibrio (Break-Even):** Se alcanza en el **mes 14**, con una base acumulada de 11 municipios contratados y 3 consorcios privados activos, generando un flujo de caja operativo mensual positivo autosostenible.

---

## 8. SOLICITUD DE FINANCIAMIENTO

### 8.1. Monto solicitado y asignación de fondos
Para acelerar la transición del MVP actual hacia la fase de despliegue masivo en el NEA y consolidación institucional, Yvy Resiliente abre una ronda de financiamiento semilla:

* **Monto Solicitado:** **USD 100.000** (a cambio de una participación societaria del 10% al 15% mediante acuerdo SAFE / Nota Convertible).

#### Asignación Estratégica del Capital:
```
           ┌───────────────────────────────────────────────┐
           │       DISTRIBUCIÓN DEL CAPITAL SOLICITADO     │
           ├───────────────────────────────────────────────┤
           │ [40%] Ingeniería de Producto & Datos (USD 40k)│
           │       • Cartografía Leaflet/MapLibre Offline  │
           │       • Conectores automáticos PNA / FIRMS    │
           │       • Desarrollo del asistente Yvy AI       │
           ├───────────────────────────────────────────────┤
           │ [30%] Expansión Comercial & GovTech (USD 30k) │
           │       • Ejecución de pilotos demostrativos    │
           │       • Venta institucional en municipios NEA │
           ├───────────────────────────────────────────────┤
           │ [15%] Despliegue en Territorio & Cap. (USD 15k)│
           │       • Talleres con cuarteles de bomberos    │
           │       • Kits de campo y validación operativa  │
           ├───────────────────────────────────────────────┤
           │ [15%] Reserva Operativa & Legal (USD 15k)     │
           │       • Constitución formal, patentes y fondo │
           │         de maniobra para ciclo de cobro B2G   │
           └───────────────────────────────────────────────┘
```

### 8.2. Hitos a alcanzar con los fondos (Runway de 14 meses)
1. **Mes 3:** Migración cartográfica completa a teselas vectoriales offline y formalización de los primeros 3 convenios piloto municipales (Corrientes, Paso de la Patria, Resistencia/Barranqueras).
2. **Mes 6:** Ingesta automática de focos satelitales NASA FIRMS y boletines de ríos PNA en producción; cierre de los primeros 5 contratos pagos de suscripción municipal.
3. **Mes 9:** Incorporación del asistente "Yvy AI" para consulta en lenguaje natural sobre protocolos de riesgo; primer acuerdo B2B con consorcio forestal de la cuenca del Iberá.
4. **Mes 12:** Alcance de 12 municipios activos; superación del punto de equilibrio operativo mensual.
5. **Mes 14:** Cierre del ejercicio con métricas listas para una ronda Serie Semilla Institucional o Serie A de USD 500k orientada a la expansión nacional.

### 8.3. Retorno de inversión para los inversionistas (ROI y Estrategia de Salida)
* **Tasa Interna de Retorno (TIR):** Estimada en **38% anual** en un horizonte de 4 años.
* **Múltiplo de Salida Proyectado:** 4.5x a 6x del capital invertido al año 4.
* **Estrategias de Salida (Exit):**
  1. *Adquisición Estratégica (Trade Sale):* Por parte de multinacionales de tecnología geoespacial o GovTech (ej. Esri, Hexagon, Indra, Siemens Smart Infrastructure) que buscan incorporar soluciones verticales de resiliencia climática validadas en el Cono Sur.
  2. *Recompra de Acciones (Share Buyback):* A partir del flujo de caja libre positivo generado por contratos gubernamentales de largo plazo a partir del Año 3.
  3. *Siguiente Ronda de Inversión (Secondary Sale):* Venta de la participación a fondos internacionales de ClimateTech / Venture Capital en rondas subsiguientes.
