# Moravía

**Plataforma web para la gestión cotidiana de comunidades de vecinos autogestionadas**

## Índice

- [Descripción](#descripción)
- [Alcance del proyecto](#alcance-del-proyecto)
- [Tecnologías](#tecnologías)
- [Documentación de la propuesta](#documentación-de-la-propuesta)
- [Equipo y planificación](#equipo-y-planificación)
- [Consulta del repositorio](#consulta-del-repositorio)

## Descripción

Estamos desarrollando Moravía para comunidades autogestionadas de entre 6 y 40 viviendas. Queremos que sea más fácil encontrar avisos y seguir incidencias desde el móvil. Al hablar con personas de nuestro entorno, vimos que algunos vecinos no están en el grupo de la comunidad o prefieren no compartir su número de teléfono.

Queremos reunir las incidencias, los avisos y las consultas en un mismo sitio. Diseñamos el alta para que el presidente pueda crear la comunidad e invitar a los vecinos mediante un enlace o un código QR. Usamos MongoDB, Express, React y Node.js.

## Alcance del proyecto

El producto mínimo viable (MVP) comprende:

- **Comunidad y acceso:** registro, configuración de viviendas e invitación mediante enlace o QR; el presidente valida la incorporación de cada residente.
- **Incidencias:** creación con fotografía opcional, seguimiento por estados y mensajes privados entre el residente que la comunica y el presidente.
- **Avisos:** tablón de lectura para los miembros, con publicaciones realizadas por el presidente.
- **Consultas:** propuestas orientativas con un máximo de una respuesta por vivienda validada y resultados agregados tras el cierre.

Las consultas no sustituyen los acuerdos formales de la comunidad. La separación entre participación y respuestas reduce la vinculación directa del voto, pero no garantiza el anonimato absoluto. El MVP excluye contabilidad, pagos, aplicaciones móviles nativas y voto ponderado. El detalle de prioridades y exclusiones se encuentra en [objetivos y alcance](docs/objetivos-alcance.md).

## Tecnologías

| Capa | Tecnología prevista | Función |
|---|---|---|
| Interfaz | React y Tailwind CSS | Componentes y diseño adaptable a dispositivos móviles. |
| Servidor | Node.js y Express | API REST, autenticación y control de acceso. |
| Datos | MongoDB y Mongoose | Almacenamiento y modelado de los datos de la aplicación. |
| Servicios | Vercel, Render, MongoDB Atlas y Cloudinary | Despliegue previsto, base de datos y almacenamiento de imágenes. |

Las versiones de referencia, los límites de los servicios y las decisiones técnicas se detallan en [recursos](docs/recursos.md) y [viabilidad técnica](docs/viabilidad-tecnica.md).

## Documentación de la propuesta

| Documento | Criterio | Contenido |
|---|---|---|
| [Problema y propuesta de valor](docs/problema.md) | 2a | Necesidad identificada, usuarios, investigación exploratoria y análisis de alternativas. |
| [Viabilidad técnica](docs/viabilidad-tecnica.md) | 2b | Requisitos priorizados, arquitectura, modelo de datos, capacidades y riesgos. |
| [Objetivos y alcance](docs/objetivos-alcance.md) | 2d | Objetivos SMART, MVP, exclusiones y criterios de éxito. |
| [Recursos y organización](docs/recursos.md) | 2e | Responsabilidades, calendario, herramientas y servicios. |
| [Financiación y capital de trabajo](docs/financiacion.md) | 2g | Costes de producción, caja para seis meses y opciones de financiación. |
| [Seguimiento semanal](docs/seguimiento/README.md) | Seguimiento | Plantilla del profesor y revisiones de la semana previa y los seis sprints. |

## Equipo y planificación

| Integrante | Responsabilidades principales |
|---|---|
| **Rocío Luque Montes** | Diseño de interfaz y experiencia de usuario, frontend y pruebas de interfaz. |
| **Pablo Sanz Aznar** | Backend, base de datos, integraciones y despliegue. |

Los dos colaboramos en la integración, las pruebas, la revisión de cambios y la documentación. Contamos con autorización para trabajar en pareja. Hemos previsto seis sprints semanales del 9 de noviembre al 18 de diciembre de 2026, con 72 horas-persona y una revisión cada viernes.

## Consulta del repositorio

### Preparación del entorno

Necesitamos Node.js 22 o superior y npm. El repositorio utiliza `frontend/` para React y `backend/` para Express, siguiendo el enunciado; equivalen a las carpetas `client/` y `server/` mencionadas en la issue de configuración.

```bash
npm install
npm install --prefix frontend
npm install --prefix backend
```

Copiamos `backend/.env.example` como `backend/.env` y completamos `MONGODB_URI` con nuestra conexión de MongoDB. El frontend inicial no necesita variables de entorno. No subimos archivos `.env` ni credenciales al repositorio.

Para trabajar con el frontend usamos `npm run dev --prefix frontend`; para comprobar su compilación, `npm run build --prefix frontend`. Las instrucciones de arranque del servidor están en [backend/README.md](backend/README.md). Desde la raíz podemos ejecutar `npm run lint`, `npm run format` y `npm run format:check` para revisar y dar formato al código de ambos proyectos.

Los documentos pueden abrirse directamente desde la tabla anterior en GitHub. Para consultarlos en local, clona el repositorio con su URL desde el botón **Code** de GitHub y abre la carpeta en un editor compatible con Markdown, como VS Code.

En `docs/` recogemos la propuesta y el [seguimiento semanal](docs/seguimiento/README.md). En [recursos y organización](docs/recursos.md) explicamos el calendario y cómo nos repartimos el trabajo.
