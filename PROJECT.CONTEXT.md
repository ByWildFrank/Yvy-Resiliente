# YVY RESILIENTE — CONTEXTO MAESTRO DEL PROYECTO

## 1. Identidad del producto

**Nombre:** Yvy  
**Nombre completo:** Yvy Resiliente  
**Tipo:** Web App responsive de inteligencia territorial y apoyo a la gestión de riesgos ambientales.  
**Región inicial:** Corrientes y Chaco, Argentina.  
**Escalabilidad:** Preparada conceptualmente para incorporar otros municipios, provincias y regiones.

Yvy es una plataforma que integra información ambiental, meteorológica, hidrológica, satelital y geoespacial para ayudar a comprender amenazas ambientales, evaluar escenarios, identificar zonas vulnerables y mejorar la toma de decisiones.

La plataforma está orientada a tres grandes grupos de usuarios:

1. Ciudadanos.
2. Agentes y organismos que trabajan con información territorial o gestionan emergencias.
3. Administradores de la plataforma.

Yvy no es únicamente un mapa, una aplicación meteorológica ni un sistema de notificaciones. Es una herramienta de inteligencia territorial que busca conectar fuentes de información, amenazas, población, infraestructura y acciones de respuesta.

## 2. Problema que busca resolver

La información relevante para gestionar eventos ambientales suele encontrarse distribuida entre distintas fuentes, sistemas, organismos y formatos.

Un dato meteorológico aislado no necesariamente permite entender qué zonas podrían verse afectadas. Una detección de incendio no describe por sí sola la posible evolución del fuego. Una medición de lluvia no indica automáticamente qué calles podrían inundarse.

Yvy busca relacionar estos datos con las características del territorio para convertirlos en información comprensible y útil.

Su objetivo es contribuir a pasar de una gestión predominantemente reactiva a una gestión preventiva y anticipatoria.

La plataforma debe facilitar respuestas a preguntas como:

- ¿Qué está ocurriendo en un territorio?
- ¿Dónde se encuentran las amenazas?
- ¿Qué información respalda una alerta?
- ¿Qué zonas podrían verse afectadas?
- ¿Qué condiciones ambientales influyen en el riesgo?
- ¿Qué infraestructura podría quedar comprometida?
- ¿Qué información falta o necesita verificación?
- ¿Qué acciones deberían evaluar los responsables?

Yvy es un sistema de apoyo a decisiones. No sustituye el criterio profesional, las autoridades competentes ni los protocolos oficiales de emergencia.

## 3. Las dos problemáticas principales

### 3.1. Incendios forestales, rurales y de pastizales

Este módulo se inspira en el concepto de PyroScan Iberá.

Busca integrar información procedente de observaciones satelitales, condiciones meteorológicas, datos territoriales, sensores y reportes para apoyar la detección, el seguimiento y el análisis de incendios.

Funcionalidades previstas:

- Visualización geográfica de focos detectados.
- Registro y seguimiento de incidentes.
- Historial de incendios.
- Visualización de áreas afectadas cuando existan datos.
- Consulta de viento, humedad, temperatura y precipitaciones.
- Análisis de factores relacionados con la propagación.
- Evaluación de infraestructura, rutas y áreas naturales potencialmente expuestas.
- Predicción de propagación cuando exista un modelo adecuado.
- Integración futura de cámaras térmicas instaladas en torres de telecomunicaciones.
- Coordinación informativa entre bomberos, Defensa Civil y organismos ambientales.

Un foco detectado no debe considerarse automáticamente un incendio confirmado. El sistema debe distinguir entre detecciones, reportes, incidentes verificados y eventos cerrados.

### 3.2. Inundaciones y eventos hídricos extremos

Este módulo se inspira en la Plataforma Integral de Resiliencia ante El Niño (ENOS).

Contempla inundaciones fluviales, anegamientos urbanos, lluvias intensas y problemas relacionados con el drenaje.

Funcionalidades previstas:

- Consulta de precipitaciones y antecedentes meteorológicos.
- Monitoreo de niveles de ríos y cursos de agua.
- Visualización de zonas inundables.
- Integración de topografía, modelos de elevación y redes de drenaje.
- Identificación de puntos críticos.
- Registro de calles anegadas y caminos bloqueados.
- Seguimiento de sensores de nivel de agua y lluvia.
- Análisis de exposición de barrios e infraestructura.
- Evaluación de vulnerabilidad territorial.
- Simulación de escenarios hipotéticos de precipitación y niveles hídricos.
- Identificación de rutas potencialmente afectadas.
- Reportes ciudadanos sobre inundaciones y drenajes obstruidos.

ENOS es un factor climático relevante, pero no determina por sí solo la ocurrencia de cada evento local.

## 4. Inteligencia territorial

El diferencial de Yvy consiste en relacionar información que normalmente se consulta por separado.

La plataforma debe contemplar la integración conceptual de:

- Incendios.
- Meteorología.
- Hidrología.
- Imágenes y productos satelitales.
- Topografía.
- Cobertura del suelo.
- Drenajes.
- Infraestructura crítica.
- Población agregada.
- Vulnerabilidad territorial.
- Rutas y accesibilidad.
- Sensores y cámaras.
- Reportes ciudadanos.
- Antecedentes históricos.
- Modelos y escenarios predictivos.

La lógica funcional es:

DATOS → DETECCIÓN → ANÁLISIS → PREDICCIÓN → PRIORIZACIÓN → RESPUESTA.

No es obligatorio que todas las fuentes estén disponibles en la primera versión. La arquitectura debe permitir incorporarlas progresivamente.

## 5. Perfiles de usuario y separación de responsabilidades

La aplicación debe distinguir claramente tres ámbitos de uso.

### 5.1. Ciudadano

El ciudadano necesita información comprensible, accesible y relevante para su seguridad.

Su experiencia debe ser más sencilla que la de un operador profesional.

Funcionalidades previstas:

- Consultar alertas públicas.
- Explorar un mapa de amenazas e información ambiental.
- Consultar información pública de su localidad.
- Ver recomendaciones e instrucciones publicadas por organismos autorizados.
- Consultar el estado de reportes enviados.
- Reportar un posible incendio.
- Reportar humo, inundaciones, calles anegadas o caminos bloqueados.
- Adjuntar fotografías opcionales.
- Guardar ubicaciones de interés.
- Consultar información pública de refugios y recursos disponibles, si está verificada.
- Consultar fuentes y horarios de actualización.

Los ciudadanos no deben poder modificar datos oficiales, confirmar emergencias, cambiar niveles de alerta ni acceder a información interna de organismos.

El reporte ciudadano es información por verificar, no una confirmación oficial.

### 5.2. Agentes y usuarios institucionales

Son usuarios que pertenecen a un organismo o que trabajan con información técnica u operativa.

El término agente describe un rol de la aplicación, no un agente autónomo de inteligencia artificial.

Pueden existir distintas especialidades:

**Meteorología**
- Consultar variables meteorológicas y su evolución.
- Analizar precipitaciones, viento, humedad y temperatura.
- Consultar fuentes y estaciones.
- Analizar escenarios meteorológicos disponibles.
- Registrar observaciones técnicas según permisos.

**Bomberos y gestión de incendios**
- Consultar focos e incidentes.
- Revisar reportes pendientes.
- Registrar verificaciones y observaciones.
- Actualizar estados de incidentes autorizados.
- Consultar condiciones meteorológicas relacionadas.
- Analizar mapas y escenarios disponibles.
- Consultar infraestructura potencialmente expuesta.

**Gestión hídrica y ambiental**
- Consultar niveles de ríos, precipitaciones y sensores.
- Analizar antecedentes de inundaciones.
- Consultar mapas de riesgo y drenaje.
- Evaluar escenarios hídricos.
- Registrar observaciones técnicas.

**Gobierno, municipio y Defensa Civil**
- Consultar la situación territorial.
- Supervisar alertas e incidentes.
- Analizar vulnerabilidad.
- Consultar infraestructura crítica.
- Priorizar la atención de incidentes.
- Registrar actuaciones y responsables.
- Consultar rutas potencialmente afectadas.
- Generar informes.
- Consultar indicadores agregados y antecedentes.

**Analista**
- Consultar datos históricos.
- Comparar períodos.
- Analizar capas territoriales.
- Ejecutar o consultar simulaciones autorizadas.
- Generar informes técnicos.

Un usuario puede tener más de una especialidad si sus permisos lo permiten. Los permisos deben ser explícitos y no depender únicamente de que el frontend oculte botones.

### 5.3. Administrador de la plataforma

El administrador gestiona la configuración técnica y funcional de Yvy.

Funcionalidades previstas:

- Gestionar usuarios.
- Asignar roles y permisos.
- Administrar organismos.
- Gestionar territorios.
- Configurar fuentes de información.
- Consultar el estado de las integraciones.
- Gestionar sensores registrados.
- Configurar categorías de incidentes.
- Gestionar parámetros de alertas.
- Revisar reportes y posibles duplicados.
- Consultar registros de auditoría.
- Gestionar configuraciones generales.

El administrador de la plataforma no debe considerarse automáticamente una autoridad que pueda declarar cualquier emergencia. Las funciones operativas y de publicación de alertas oficiales deben depender de permisos específicos.

Toda acción privilegiada debe quedar registrada.

## 6. Módulos funcionales previstos

### Inicio y centro de inteligencia territorial
Resumen del territorio, indicadores, alertas recientes, incidentes, fuentes y acceso al mapa.

### Mapa territorial
Mapa interactivo con capas activables, filtros, leyendas y paneles de detalle.

### Incendios
Detecciones, incidentes, verificación, evolución y condiciones ambientales.

### Riesgo hídrico
Ríos, precipitaciones, sensores, zonas inundables, drenajes y antecedentes.

### Escenarios
Herramientas para configurar parámetros y visualizar resultados de modelos disponibles.

### Vulnerabilidad
Análisis territorial de exposición, población agregada, infraestructura y accesibilidad.

### Rutas y evacuación
Visualización de rutas y áreas potencialmente comprometidas, siempre diferenciando hechos confirmados de estimaciones.

### Sensores
Registro, estado, telemetría e historial de dispositivos.

### Reportes ciudadanos
Recepción, seguimiento, verificación y resolución de reportes.

### Fuentes de información
Registro de fuentes, cobertura, actualización, estado y procedencia de datos.

### Historial
Consulta y comparación de eventos, mediciones e incidentes anteriores.

### Informes
Generación y exportación de informes técnicos.

### Yvy AI
Asistente conceptual para consultar datos del sistema, explicar resultados y orientar hacia módulos relevantes. Solo debe responder sobre información disponible y mostrar sus fuentes.

### Administración
Gestión de usuarios, permisos, organismos, territorios, fuentes, sensores y configuración.

## 7. Principios de datos y confiabilidad

Todos los módulos deben diferenciar:

- Observado: dato recibido de una fuente.
- Reportado: dato enviado por una persona u organización.
- Verificado: información confirmada mediante un proceso definido.
- Derivado: dato calculado a partir de otros.
- Modelado: resultado de un modelo.
- Simulado: resultado de un escenario hipotético.
- Sin verificar: información pendiente de confirmación.
- Desactualizado: dato que excede el período de vigencia esperado.
- No disponible: información que no se ha recibido.

Los datos importantes deben incluir procedencia y fecha de actualización.

Las predicciones deben comunicar incertidumbre, horizonte temporal, supuestos y limitaciones.

No deben inventarse datos oficiales, fuentes conectadas, sensores desplegados, convenios, modelos científicos ni alertas reales.

Los datos de demostración deben estar separados de los datos operativos y etiquetados explícitamente.

## 8. Principios de seguridad

- Autenticación para las áreas privadas.
- Autorización basada en roles y permisos.
- Validación de datos en el backend.
- Protección de rutas y operaciones privadas.
- Separación entre información pública e institucional.
- Auditoría de operaciones privilegiadas.
- Protección de credenciales mediante variables de entorno.
- No exponer secretos en el frontend.
- Limitar la información sensible.
- Validar los archivos adjuntos.
- No permitir que un ciudadano modifique incidentes verificados.
- No permitir que un usuario de un organismo acceda automáticamente a todos los datos internos de otros organismos.
- Evitar la exposición de ubicaciones personales sensibles.

## 9. Principios de experiencia de usuario

La plataforma debe ser responsive en desktop, tablet y móvil.

El escritorio debe optimizar el análisis territorial y las tareas operativas.

El móvil debe priorizar consultas rápidas, alertas, mapas, incidentes y reportes.

La interfaz debe ser accesible, legible y consistente.

Los mapas, las alertas y los indicadores deben tener leyendas y explicaciones.

Las funciones de demostración deben distinguirse de las funciones conectadas a datos reales.

## 10. Objetivo técnico

La arquitectura debe ser modular, mantenible y extensible.

Debe permitir incorporar nuevas fuentes de información, territorios, tipos de amenazas, especialidades de agentes y organismos sin tener que reescribir toda la aplicación.

No se impone una tecnología específica en este documento: el stack debe determinarse mediante la inspección del repositorio existente.

La implementación debe priorizar la separación entre presentación, lógica de negocio, persistencia, autenticación, autorización e integración con fuentes externas.

## 11. Alcance del producto

Yvy debe evolucionar progresivamente:

1. Base funcional y datos correctamente estructurados.
2. Autenticación y roles.
3. Módulos de consulta y mapas.
4. Gestión de incidentes y reportes.
5. Integración de fuentes verificables.
6. Análisis histórico.
7. Modelos y simulaciones científicamente sustentados.
8. Coordinación institucional y funciones avanzadas.

La prioridad es construir una base sólida y honesta respecto de sus capacidades, no simular que todo está conectado desde el principio.

## 12. Definición de éxito

El proyecto será exitoso si permite:

- Comprender rápidamente la situación de un territorio.
- Diferenciar observaciones, reportes y predicciones.
- Consultar la fuente y antigüedad de la información.
- Ofrecer experiencias diferenciadas por rol.
- Gestionar incidentes con trazabilidad.
- Incorporar nuevas fuentes sin acoplarlas a la interfaz.
- Evitar datos hardcodeados en los componentes de presentación.
- Mantener una separación clara entre demostración y operación real.
- Funcionar correctamente en distintos tamaños de pantalla.
