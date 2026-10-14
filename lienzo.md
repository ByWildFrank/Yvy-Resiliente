# LIENZO DEL MODELO DE NEGOCIOS (BUSINESS MODEL CANVAS) — YVY RESILIENTE
## Guía y Prompts Optimizados para Lucidspark

> Este documento contiene el diseño completo del **Lienzo del Modelo de Negocios (Canvas de 9 bloques)** basado en la metodología ágil explicada en el documento de referencia (*Lic. María Jose Gonzalez Gervasoni*), adaptado exhaustivamente al MVP y visión de **Yvy Resiliente**.
> Incluye el **Prompt Maestro para Lucidspark AI**, las instrucciones paso a paso para ejecutarlo en la herramienta y el desglose detallado de tarjetas adhesivas (Sticky Notes) con códigos de color.

---

## 1. PROMPT MAESTRO PARA LUCIDSPARK AI

Copia y pega el siguiente bloque de texto en el asistente de inteligencia artificial de Lucidspark (**Collaborative AI / Generar con IA** o en la herramienta de generación de ideas/notas adhesivas):

```text
Actúa como un consultor experto en diseño de modelos de negocio ágiles (Lean Startup y Business Model Canvas) y especialista en GovTech y ClimateTech.

Genera en este tablero un "Lienzo de Modelo de Negocios (Business Model Canvas)" completo, profesional y altamente detallado para la startup "Yvy Resiliente".

CONTEXTO DE LA STARTUP:
"Yvy Resiliente" es una plataforma web responsive de inteligencia territorial y gestión anticipatoria de riesgos ambientales en Corrientes y Chaco (Argentina). Integra datos de incendios de pastizales/bosques (Esteros del Iberá) e inundaciones fluviales/anegamientos (Río Paraná/ENOS). Conecta observaciones satelitales (NASA FIRMS), meteorología (Open-Meteo), hidrometría oficial de ríos (Prefectura Naval Argentina), telemetría de sensores IoT de campo y reportes ciudadanos verificables con fotos. Cuenta con 3 experiencias diferenciadas: Ciudadano (/ciudadano), Agente Operativo (/agente) y Administrador (/admin), operando bajo un principio de honestidad de datos (distingue datos observados, reportados, verificados, simulados y desactualizados).

ESTRUCTURA VISUAL REQUERIDA:
Organiza el tablero en los 9 bloques clásicos del Business Model Canvas, distribuidos de izquierda a derecha y de arriba a abajo. Para cada bloque, genera notas adhesivas (Sticky Notes) claras, concisas y orientadas a la acción, utilizando los siguientes códigos de color temáticos:

1. SEGMENTO DE CLIENTES (Color: Verde Claro)
   - Gobiernos Municipales (Secretarías de Gobierno, Obras Públicas y Defensa Civil de ciudades y pueblos ribereños o forestales).
   - Direcciones Provinciales de Defensa Civil y Ministerios de Seguridad/Ambiente (Corrientes y Chaco).
   - Cuerpos de Bomberos Voluntarios y Brigadas de Lucha contra el Fuego (cuarteles de primera respuesta).
   - Sector Agroindustrial y Forestal Privado (consorcios de pino, eucalipto, arroz y ganadería expuestos a fuego e inundación).
   - Ciudadanía General del NEA (usuarios del servicio público gratuito de alertas tempranas y reporte barrial).

2. PROPUESTA DE VALOR (Color: Púrpura / Violeta)
   - Para Municipios e Intendencias: Reducción drástica del costo económico de reconstrucción post-desastre y canal oficial de comunicación cívica sin colapsos.
   - Para Bomberos y Defensa Civil: Centro de comando único que reduce 40% el tiempo de triaje; cruza focos satelitales, vientos y accesibilidad de rutas en tiempo real.
   - Para el Sector Agroforestal: Detección temprana de focos de calor circundantes y mitigación de pérdidas patrimoniales millonarias.
   - Para la Ciudadanía: Alertas tempranas confiables en el celular, recomendaciones oficiales de autoprotección y trazabilidad real de sus reportes.
   - Diferenciador Clave de Yvy: Honestidad ontológica (nunca inventa datos; etiqueta qué es observado, reportado, modelado o pendiente) + Auditoría inmutable de decisiones.

3. CANALES DE DISTRIBUCIÓN (Color: Naranja Claro)
   - Web App Responsive / Progressive Web App (PWA): Acceso instantáneo multidispositivo (PC en sala de situación, tablets en patrullas, celulares de vecinos).
   - Venta Directa y Consultiva B2G: Reuniones con intendentes, concejos deliberantes y comités de crisis municipales.
   - Convenios Marco con Federaciones de Bomberos Voluntarios: Canal de recomendación y adopción en territorio.
   - Programas y Fondos de Financiamiento Verde y Ciudades Inteligentes (BID, Banco Mundial, RAMCC).

4. RELACIONES CON CLIENTES (Color: Azul Cielo)
   - Programa "Municipio Resiliente Piloto": Prueba de 45 días sin costo con datos reales para demostrar impacto operativo inmediato.
   - Mesa de Enlace y Soporte Crítico 24/7: Asistencia prioritaria durante alertas meteorológicas rojas o contingencias declaradas.
   - Capacitación Continua en Territorio: Talleres prácticos con cuarteles de bomberos y operadores de defensa civil.
   - Co-diseño Comunitario (Feedback Loop): Ajustes ágiles del producto basados en la retroalimentación de brigadistas en el terreno.

5. FUENTES DE INGRESOS (Color: Verde Oscuro / Esmeralda)
   - Suscripción Anual SaaS B2G Municipal: Tiers escalonados según población (Tier 1 <30k hab: USD 4.200/año; Tier 2 30k-100k hab: USD 9.000/año; Tier 3 Grandes Ciudades: USD 18.000/año).
   - Licencias Provinciales / Regionales: Plataforma centralizada para Ministerios de Seguridad (USD 35.000 - USD 50.000/año).
   - Suscripción B2B Agroforestal: Monitoreo perimetral y satelital continuo para grandes productores (USD 6.000 a USD 14.000/año).
   - Servicios de Parametrización y Despliegue IoT: Consultoría inicial de cuencas de drenaje e instalación de telemetría (USD 2.500 - USD 6.000 por proyecto).

6. RECURSOS CLAVE (Color: Amarillo / Dorado)
   - Plataforma de Software MVP: Código base tipado y probado (Vue 3, TypeScript, Tailwind 4, Firebase / LocalStorage).
   - Infraestructura Cloud Escalable: Firestore, Storage y Cloud Functions con reglas de seguridad estrictas (RBAC).
   - Equipo Humano Multidisciplinario: Ingenieros de software, especialistas GIS / teledetección satelital y expertos en gestión de emergencias.
   - Datos e Integraciones: APIs de NASA FIRMS, Open-Meteo, boletines hidrométricos de Prefectura Naval y red de sensores.

7. ACTIVIDADES CLAVE (Color: Rosa / Fucsia)
   - Desarrollo e Ingeniería Continua: Integración de mapas vectoriales offline (MapLibre), ingesta continua de fuentes y asistente "Yvy AI".
   - Soporte Técnico y Monitoreo en Tiempo Real: Supervisión de la disponibilidad de servidores y salud de la telemetría.
   - Despliegue y Entrenamiento en Campo: Capacitación presencial a operadores de sala de situación y brigadistas.
   - Gestión Comercial B2G y Cumplimiento Normativo: Licitaciones públicas, contrataciones directas por ordenanza y convenios estatales.

8. SOCIOS CLAVE (Color: Marrón Claro / Mostaza)
   - Organismos Oficiales y Técnicos: Prefectura Naval Argentina (PNA), Servicio Meteorológico Nacional (SMN), Instituto Nacional del Agua (INA) e IGN.
   - Federaciones Provinciales de Bomberos Voluntarios (Corrientes y Chaco): Clave para validación y uso táctico.
   - Universidades Regionales (UNNE, UTN): Validación científica de los modelos de simulación de incendios e inundaciones.
   - Redes de Municipios (RAMCC, Red de Innovación Local - RIL): Impulsores de adopción de tecnología cívica y resiliencia climática.
   - Proveedores de Sensores IoT y Cámaras Térmicas en Torres de Comunicación.

9. ESTRUCTURA DE COSTES (Color: Rojo Suave / Coral)
   - Costes Variables / Nube: Consumo elástico de Firebase / Google Cloud, almacenamiento de fotos de reportes y consumo de APIs de pago.
   - Costes Fijos - Talento e Ingeniería: Sueldos de desarrolladores full-stack, analista GIS y diseñador UX.
   - Costes Fijos - Operaciones y Comercial: Equipo de relaciones institucionales GovTech, viáticos a municipios y capacitaciones en cuarteles.
   - Costes de Marketing y Difusión: Participación en congresos de Ciudades Inteligentes y materiales cívicos para vecinos.
   - Costes Legales y de Cumplimiento: Asesoría legal en contratación pública, auditorías de seguridad y constitución corporativa.

Genera el lienzo con marcos visuales (Frames) para cada bloque, encabezados claros y las notas adhesivas bien distribuidas y legibles.
```

---

## 2. INSTRUCCIONES PASO A PASO PARA USAR EN LUCIDSPARK

### Opción A: Mediante la Inteligencia Artificial de Lucidspark (Collaborative AI)
1. Abre tu cuenta en [Lucidspark](https://lucidspark.com/) y crea un nuevo tablero en blanco (**Blank Board**).
2. Haz clic en el botón de **IA (Collaborative AI)** ubicado en la barra de herramientas izquierda o superior (ícono de chispas/estrellas ✨).
3. Selecciona la opción **"Generar tablero" (Generate Board)** o **"Lluvia de ideas" (Brainstorm)**.
4. Pega el **Prompt Maestro** provisto en la Sección 1.
5. Presiona **Enter** o haz clic en **Generar**. Lucidspark organizará automáticamente los 9 contenedores con sus notas adhesivas correspondientes.

### Opción B: Mediante la Plantilla de Business Model Canvas de Lucidspark
1. Abre Lucidspark y busca en la galería de plantillas (**Templates**): `Business Model Canvas` o `Lienzo de Modelo de Negocios`.
2. Inserta la plantilla prediseñada en el lienzo.
3. Copia y pega las tarjetas del **Desglose Contenido Bloque por Bloque** (Sección 3 de este documento) en cada casilla respectiva con su color asignado.

---

## 3. DESGLOSE CONTENIDO BLOQUE POR BLOQUE (DETALLE PARA POST-ITS)

A continuación se detalla el contenido exacto de cada tarjeta para organizar manualmente o validar la generación de la IA:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     BUSINESS MODEL CANVAS — YVY                                       │
├───────────────────┬───────────────────┬───────────────────┬───────────────────┬────────────────────────┤
│ 8. SOCIOS CLAVE   │ 7. ACTIVIDADES    │ 2. PROPUESTA      │ 4. RELACIONES     │ 1. SEGMENTO DE         │
│                   │    CLAVE          │    DE VALOR       │    CON CLIENTES   │    CLIENTES            │
│ [Post-it Mostaza] │ [Post-it Fucsia]  │ [Post-it Violeta] │ [Post-it Azul]    │ [Post-it Verde Claro]  │
│                   ├───────────────────┤                   ├───────────────────┤                        │
│                   │ 6. RECURSOS       │                   │ 3. CANALES        │                        │
│                   │    CLAVE          │                   │                   │                        │
│                   │ [Post-it Dorado]  │                   │ [Post-it Naranja] │                        │
├───────────────────┴───────────────────┴───────────────────┴───────────────────┴────────────────────────┤
│ 9. ESTRUCTURA DE COSTES                                   │ 5. FUENTES DE INGRESOS                     │
│ [Post-it Rojo Suave / Coral]                              │ [Post-it Verde Esmeralda]                  │
└───────────────────────────────────────────────────────────┴────────────────────────────────────────────┘
```

### Bloque 1: Segmento de Clientes (Customer Segments)
*Color de tarjeta sugerido: Verde Claro (#D4EDDA)*
* **Tarjeta 1.1:** *Intendencias y Gobiernos Municipales del NEA:* Secretarías de Obras Públicas, Servicios y Defensas Civiles locales en zonas inundables o de pastizales.
* **Tarjeta 1.2:** *Direcciones Provinciales de Defensa Civil:* Ministerios de Seguridad y Ambiente (Corrientes, Chaco, Formosa, Misiones) que necesitan coordinación interjurisdiccional.
* **Tarjeta 1.3:** *Cuarteles de Bomberos Voluntarios y Brigadas Forestales:* Operadores de primera línea que gestionan emergencias en el terreno.
* **Tarjeta 1.4:** *Grandes Productores y Consorcios Forestales/Agropecuarios:* Empresas con activos forestales de alto valor (pino, eucalipto) y arroceras amenazadas por fuego o déficit hídrico.
* **Tarjeta 1.5:** *Comunidad Ciudadana:* Vecinos ribereños, productores rurales y familias que necesitan información fidedigna para proteger sus vidas y bienes.

### Bloque 2: Propuesta de Valor (Value Proposition)
*Color de tarjeta sugerido: Violeta / Púrpura (#E2D9F3)*
* **Tarjeta 2.1:** *Para el Gobierno Local:* Reducción sustancial del costo de respuesta a desastres y mitigación del daño a la infraestructura pública.
* **Tarjeta 2.2:** *Para la Sala de Situación / Bomberos:* Reducción del 40% en tiempos de triaje; centralización de focos satelitales, vientos y estado de ríos en un solo visor.
* **Tarjeta 2.3:** *Para la Ciudadanía:* Alertas tempranas transparentes, sin pánico ni desinformación, con canal directo para reportar y seguir el estado de su reporte.
* **Tarjeta 2.4:** *Honestidad Ontológica de Datos:* Clara diferenciación entre datos observados, reportados por vecinos, verificados por agentes, modelados y simulaciones hipotéticas.
* **Tarjeta 2.5:** *Auditoría Inmutable y Gobernanza:* Trazabilidad completa con registro de quién, cuándo y por qué se verificó o descartó una alerta o incidente.

### Bloque 3: Canales de Distribución (Channels)
*Color de tarjeta sugerido: Naranja Claro (#FFE8D6)*
* **Tarjeta 3.1:** *Web App Responsive / PWA:* Acceso universal vía navegador sin requerir descargas complejas; accesible en computadoras de escritorio, tablets y móviles.
* **Tarjeta 3.2:** *Venta Consultiva B2G Directa:* Presentaciones técnicas en concejos deliberantes, ministerios y comités de emergencia.
* **Tarjeta 3.3:** *Alianzas con Federaciones de Bomberos:* Demostraciones en asambleas federativas de cuarteles.
* **Tarjeta 3.4:** *Redes de Innovación Local y Cambio Climático:* Presencia activa en foros de la RAMCC y RIL.

### Bloque 4: Relaciones con Clientes (Customer Relationships)
*Color de tarjeta sugerido: Azul Cielo (#CCE5FF)*
* **Tarjeta 4.1:** *Piloto Demostrativo Gratuito (45 Días):* Instalación inicial para que el municipio experimente el valor operativo antes de comprometer fondos presupuestarios.
* **Tarjeta 4.2:** *Soporte Crítico 24/7 en Contingencias:* Canal prioritario de asistencia técnica durante activaciones de alerta meteorológica.
* **Tarjeta 4.3:** *Acompañamiento y Capacitación Humana:* Talleres de formación presencial y virtual para guardias y operadores de despacho.
* **Tarjeta 4.4:** *Cultura de Co-Diseño Ágil (Lean Feedback):* Integración regular de sugerencias de los propios brigadistas en el roadmap de producto.

### Bloque 5: Fuentes de Ingresos (Revenue Streams)
*Color de tarjeta sugerido: Verde Esmeralda (#C3E6CB)*
* **Tarjeta 5.1:** *Suscripción SaaS Municipal Anual:*
  * Municipios pequeños (<30k hab.): USD 4.200 / año.
  * Municipios medianos (30k-100k hab.): USD 9.000 / año.
  * Grandes capitales (>100k hab.): USD 18.000 / año.
* **Tarjeta 5.2:** *Licenciamiento Provincial / Interjurisdiccional:* USD 35.000 a USD 50.000 / año para ministerios provinciales de seguridad.
* **Tarjeta 5.3:** *Suscripciones Corporativas B2B (Agro / Forestal):* USD 6.000 a USD 14.000 / año por consorcio de productores.
* **Tarjeta 5.4:** *Servicios Profesionales de Despliegue y Parametrización:* USD 2.500 a USD 6.000 por parametrización de cuencas e integración de telemetría IoT propia.

### Bloque 6: Recursos Clave (Key Resources)
*Color de tarjeta sugerido: Amarillo Dorado (#FFF3CD)*
* **Tarjeta 6.1:** *Base de Código del MVP:* SPA modular y tipada en Vue 3, Vite, TypeScript, Tailwind 4 y Firebase con arquitectura desacoplada por repositorios.
* **Tarjeta 6.2:** *Infraestructura Cloud Segura:* Firestore con reglas estrictas de autorización (RBAC), Storage autenticado y Cloud Functions.
* **Tarjeta 6.3:** *Equipo Fundador Especializado:* Perfiles complementarios en ingeniería de software, teledetección/GIS y gestión pública de emergencias.
* **Tarjeta 6.4:** *Acceso a Datos e Integraciones:* Conectores con NASA FIRMS (satélites VIIRS/MODIS), Open-Meteo, Prefectura Naval y sensores locales.

### Bloque 7: Actividades Clave (Key Activities)
*Color de tarjeta sugerido: Fucsia / Rosa (#F8D7DA)*
* **Tarjeta 7.1:** *Desarrollo Continuo y Mantenimiento:* Evolución a cartografía vectorial MapLibre offline-first y desarrollo del asistente inteligente "Yvy AI".
* **Tarjeta 7.2:** *Monitoreo y Confiabilidad del Servicio (SRE):* Aseguramiento del 99.8% de disponibilidad de servidores y latencias mínimas.
* **Tarjeta 7.3:** *Gestión de la Venta B2G:* Confección de pliegos, dictámenes técnicos y seguimiento de expedientes de contratación en municipios.
* **Tarjeta 7.4:** *Entrenamiento en el Terreno:* Pruebas de campo y simulacros de crisis junto a defensas civiles locales.

### Bloque 8: Socios Clave (Key Partners)
*Color de tarjeta sugerido: Mostaza / Marrón Claro (#EADBCA)*
* **Tarjeta 8.1:** *Organismos Técnico-Científicos del Estado:* Prefectura Naval Argentina (alturas de ríos), Servicio Meteorológico Nacional (SMN), Instituto Geográfico Nacional (IGN) e Instituto Nacional del Agua (INA).
* **Tarjeta 8.2:** *Federaciones Provinciales de Bomberos:* Aliados tácticos para la validación y despliegue del sistema.
* **Tarjeta 8.3:** *Universidad Nacional del Nordeste (UNNE):* Auditoría académica y validación de los modelos predictivos de riesgo.
* **Tarjeta 8.4:** *Redes Municipalistas (RAMCC, RIL):* Canales institucionales para difusión y réplica de la solución en múltiples comunas.
* **Tarjeta 8.5:** *Empresas de Telecomunicaciones e Infraestructura:* Convenios para montaje de sensores y cámaras térmicas en torres existentes.

### Bloque 9: Estructura de Costes (Cost Structure)
*Color de tarjeta sugerido: Rojo Suave / Coral (#F5C6CB)*
* **Tarjeta 9.1:** *Costes Directos de Plataforma (Cloud):* Consumo de base de datos Firebase, Cloud Storage para imágenes de reportes y procesamiento de Cloud Functions.
* **Tarjeta 9.2:** *Sueldos del Equipo Central:* Equipo de ingeniería full-stack, especialista GIS y líder de producto.
* **Tarjeta 9.3:** *Gastos Comerciales y de Territorio:* Viajes a municipios, demostraciones in situ en salas de crisis y stands en congresos de protección civil.
* **Tarjeta 9.4:** *Gastos Legales y Regulatorios:* Contratos administrativos, cumplimiento de ley de protección de datos personales y auditorías contables.
* **Tarjeta 9.5:** *Materiales de Capacitación y Difusión Cívica:* Guías operativas para cuarteles y kits gráficos para difusión vecinal.

---

## 4. CONEXIÓN ENTRE EL PLAN DE NEGOCIOS Y EL LIENZO EN LUCIDSPARK

Al trasladar estos datos al lienzo de Lucidspark, se evidencian tres dinámicas estratégicas fundamentales del negocio:
1. **La Coherencia de la Propuesta de Valor con el Segmento:** Cada tipo de usuario de Yvy cuenta con una interfaz y un beneficio exclusivo (`/ciudadano` recibe alertas claras y reporte ágil; `/agente` recibe triaje y control de incidentes; `/admin` recibe auditoría y gobernanza).
2. **El Bucle de Retroalimentación Lean (Lean Feedback Loop):** El producto ya superó la fase de idea mediante este MVP operativo. El siguiente paso en el lienzo es validar las hipótesis en los 3 municipios piloto para ajustar las métricas antes del escalamiento masivo.
3. **Eficiencia en Costes de Arranque:** Al estar construido sobre tecnologías modernas serverless (Firebase) y soportar modo demo local sin costos fijos altos, la startup opera con un punto de equilibrio accesible en el mes 14 con solo 11 municipios activos.
