# Recursos y organización

## Índice

- [1. Equipo y responsabilidades](#1-equipo-y-responsabilidades)
- [2. Estimación y calendario](#2-estimación-y-calendario)
- [3. Stack y herramientas propuestas](#3-stack-y-herramientas-propuestas)
- [4. Servicios externos y costes](#4-servicios-externos-y-costes)
- [5. Gestión y configuración prevista](#5-gestión-y-configuración-prevista)

## 1. Equipo y responsabilidades

Somos Rocío Luque Montes y Pablo Sanz Aznar. Nos repartimos las tareas y revisamos el trabajo de la otra persona. Los dos participamos en las pruebas y en la documentación.

| Integrante | Responsabilidad principal | Apoyo compartido |
| --- | --- | --- |
| Rocío Luque Montes | Frontend Lead, UI/UX Designer y QA Manager: React, diseño móvil, pruebas de interfaz y documentación. | Pruebas de uso, integración, revisión y documentación. |
| Pablo Sanz Aznar | Backend Lead, Database Administrator y DevOps: Node 24, Express 5, Mongoose, transacciones, Cloudinary y despliegue. | Pruebas técnicas, integración, revisión y documentación. |

Pablo concentra varias áreas técnicas; Rocío apoyará la integración y el despliegue, y ambos revisarán semanalmente el reparto.

## 2. Estimación y calendario

El proyecto comienza el lunes 9 de noviembre de 2026 y termina con la defensa del viernes 18 de diciembre. Dedicaremos 12 horas-persona por sprint, 72 en total, con 8 horas de reserva incluidas.

| Sprint | Revisión | Resultado previsto | Horas-persona |
| --- | --- | --- | ---: |
| 1 | 13 de noviembre | Investigación inicial, diseño y prototipo técnico. | 12 |
| 2 | 20 de noviembre | Acceso, comunidad, viviendas e invitaciones. | 12 |
| 3 | 27 de noviembre | Creación y seguimiento de incidencias. | 12 |
| 4 | 4 de diciembre | Mensajes privados, avisos e imágenes. | 12 |
| 5 | 11 de diciembre | Consultas y pruebas de voto único. | 12 |
| 6 | 18 de diciembre | Integración, pruebas, correcciones y demostración final. | 12 |
| **Total** | | | **72** |

En cada revisión se mostrará el trabajo terminado y se ajustará el siguiente sprint. Los registros se recogen en [seguimiento semanal](seguimiento/README.md). Se pospondrán primero los requisitos Should y Could; si el MVP no cabe, se renegociará con el profesorado. Los festivos y compromisos pueden reducir la disponibilidad.

## 3. Stack y herramientas propuestas

Las versiones son **líneas o versiones de referencia propuestas**, no dependencias instaladas. Al iniciar el desarrollo se comprobará su compatibilidad, se fijarán versiones exactas en `package.json` y el archivo de bloqueo, y se actualizarán parches de seguridad. Node 24 es una [línea LTS](https://nodejs.org/en/about/previous-releases).

| Capa | Herramienta / versión de referencia | Uso y justificación |
| --- | --- | --- |
| Entorno | Node.js 24 LTS, npm 11 | JavaScript en servidor y herramientas de construcción. |
| Interfaz | React 19 y Vite 7 | Componentes y entorno de desarrollo del cliente. |
| Estilos | CSS | Las ramas de interfaz usan estilos propios para adaptar las vistas a móviles. |
| QR | qrcode.react 4 | Representación del enlace de invitación en pantalla. |
| API | Express 5, Mongoose 8 | Rutas HTTP y modelos/validación de MongoDB. |
| Acceso | jsonwebtoken 9, bcrypt 6, cookie-parser 1, express-rate-limit 8 | Sesiones, hash de contraseñas, cookies y limitación de intentos; añadir protección CSRF según la configuración definitiva. |
| Validación y ficheros | Zod 4, Multer 2, Cloudinary Node SDK 2 | Validar entradas y gestionar cargas privadas de imágenes. |
| Datos | MongoDB 8 / Atlas Free | Documentos, índices y transacciones en un conjunto de réplicas compatible. |
| Correo posterior al MVP | Nodemailer 7 | Transporte SMTP; requiere proveedor y credenciales, no envía correo por sí solo. |
| Pruebas | Vitest 3, React Testing Library 16, Supertest 7 | Pruebas de componentes y API; pruebas manuales móviles y de accesibilidad. |
| Calidad | ESLint 9, Prettier 3 | Detección de errores y formato común. |
| Trabajo | Git 2, GitHub, GitHub Projects, VS Code | Control de versiones, revisión, tablero y edición. |

Las herramientas de software libre no implican por sí mismas un coste de licencia para el prototipo; los servicios siguientes sí tienen cuotas y condiciones.

## 4. Servicios externos y costes

Consulta de condiciones: 6 de noviembre de 2026. Las cuotas pueden cambiar; comprobarlas antes de contratar o desplegar. El objetivo es 0 € durante pruebas dentro de planes gratuitos, sin considerar conexión, equipos, dominio o costes por consumo excedido. Las cuentas y su elegibilidad todavía no están confirmadas.

| Servicio | Uso y coste previsto | Limitaciones y plan de contingencia |
| --- | --- | --- |
| [Vercel Hobby](https://vercel.com/docs/plans/hobby) | Frontend; plan gratuito para uso personal no comercial. | 100 GB de transferencia rápida y 100 horas de compilación según sus guías de uso; al superarlos puede tocar esperar hasta el siguiente periodo. Comprobar condiciones para el proyecto y usar demostración local si no encaja. |
| [Render Free](https://render.com/docs/free) | API; 750 horas gratuitas por espacio de trabajo y mes. | Se suspende tras 15 minutos sin tráfico y puede tardar aproximadamente un minuto en arrancar; disco efímero. El ancho de banda excedido puede facturarse: vigilar consumo y configuración de facturación. |
| [MongoDB Atlas Free](https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/) | Base de datos; un clúster gratuito por proyecto, 0,5 GB. | Recursos y operaciones limitados; puede pausarse tras 30 días sin conexiones. Mantener datos de prueba exportables y revisar copias. |
| [Cloudinary Free](https://cloudinary.com/pricing) | Fotos privadas; 25 créditos mensuales compartidos entre recursos. | Un crédito equivale a 1.000 transformaciones, 1 GB de almacenamiento o 1 GB de transferencia de imágenes ([detalle](https://cloudinary.com/documentation/billing_and_plans)). Vigilar consumo, acceso autenticado y condiciones de entrega antes de usar datos reales; desactivar subida si no se garantiza privacidad. |
| [Resend Free](https://resend.com/pricing) + Nodemailer | Opción SMTP para correos posteriores al MVP; 3.000 correos/mes y 100/día gratuitos. | Requiere configurar y verificar remitente/dominio según proveedor; dominio propio puede tener coste. Si no está disponible, probar con transporte de desarrollo y dejar el envío desactivado. |

Se utilizarán datos ficticios en pruebas y demostraciones, sin subir secretos al repositorio. Cualquier uso con residentes reales requiere revisar las condiciones de los servicios y el tratamiento de datos antes de activarlo.

## 5. Gestión y configuración prevista

- **Git y GitHub:** organizamos el código en `frontend/` y `backend/`. Integramos las ramas de trabajo en `develop` mediante PR revisadas. Reservamos `main` para las versiones estables. Dejamos los ejemplos de configuración en el repositorio y guardamos las credenciales fuera de Git.
- **GitHub Projects:** usamos `Backlog`, `Todo`, `In Progress`, `In Review` y `Done`. Actualizamos el estado y las prioridades durante el sprint. Pasamos una tarea a `In Review` cuando la PR está lista para que la revise la otra persona.
- **Comunicación:** hablamos por WhatsApp y reservamos los viernes para repasar el sprint. Anotamos en cada issue las decisiones que afectan a esa tarea.
- **Pruebas:** comprobamos los cambios al preparar cada PR. Antes de la entrega probaremos los recorridos principales en móvil y anotaremos qué funciona y qué queda por corregir.
