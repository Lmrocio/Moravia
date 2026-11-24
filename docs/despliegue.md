# Despliegue de Moravía

El repositorio es un monorepositorio: `frontend/` contiene React y Vite, y `backend/` contiene Express. El objetivo de producción es desplegar `main` automáticamente en Vercel y Render. Hasta que se integre en `main`, se puede validar la configuración con despliegues de prueba de una rama que ya contenga la aplicación; no deben confundirse con la producción definitiva.

## 1. Frontend en Vercel

1. En Vercel, importa el repositorio de GitHub y crea un proyecto con **Root Directory** `frontend`. Selecciona Vite si no se detecta automáticamente.
2. `frontend/vercel.json` define `npm run build` y el directorio de salida `dist`. Selecciona Node.js 24 en los ajustes del proyecto.
3. Configura `main` como rama de producción. Si `main` aún no contiene `frontend/`, la producción no funcionará hasta que se fusione la versión revisada. Usa un despliegue de vista previa para probar la rama de trabajo.
4. Comprueba que la URL HTTPS estable del proyecto carga. Esta URL, sin barra final ni ruta, es el valor de `CLIENT_ORIGIN` de la API.

El frontend actual no realiza peticiones a la API y no necesita variables de entorno. Cuando se implemente esa conexión, la URL pública de la API podrá configurarse para el frontend; las variables expuestas a Vite no son secretas.

## 2. API en Render

1. En Render, crea un **Blueprint** desde el repositorio y selecciona una rama que incluya `render.yaml`. El archivo define un Web Service Node, el directorio `backend`, el plan gratuito, la región Frankfurt, los comandos y la ruta de salud. Comprueba la disponibilidad y las condiciones del plan antes de crearlo.
2. Durante la creación, introduce en el panel `MONGODB_URI` y `CLIENT_ORIGIN`. La URI debe apuntar a la base de datos prevista y tener un usuario con los permisos necesarios. Render genera `JWT_SECRET` automáticamente; no copies credenciales al repositorio.
3. Configura en Atlas el acceso de red necesario para Render y comprueba la conexión. Usa credenciales y datos separados de desarrollo cuando corresponda.
4. El Blueprint define `NODE_ENV=production`, `COOKIE_SAMESITE=none` y `COOKIE_SECURE=true`; Render proporciona `PORT`. `CLIENT_ORIGIN` debe ser el origen HTTPS exacto de Vercel. El backend solo autoriza ese origen en CORS, de modo que las URLs de vista previa distintas requieren su propio entorno de pruebas y una configuración de origen adecuada.
5. Comprueba que el servicio arranca y abre `https://<servicio>.onrender.com/api/health`. Debe responder HTTP `200` con `{"status":"ok","db":"connected"}`. Un error de arranque o una respuesta `503` exige revisar conexión y logs sin publicar secretos.
6. Cuando la versión revisada llegue a `main`, configura el Blueprint y el servicio para seguir `main` y verifica los despliegues automáticos. No hace falta fusionar a `main` antes de la fecha acordada.

Render solicitará las variables con `sync: false` durante la creación inicial del Blueprint. Si posteriormente se añaden variables de este tipo a un Blueprint existente, deben configurarse en el panel del servicio. [Referencia de Blueprints](https://render.com/docs/blueprint-spec).

## 3. Comprobación final

- Verifica las URLs HTTPS de producción en Vercel y Render y añádelas al `README.md` sin credenciales ni tokens.
- Comprueba que una integración en `main` provoca los despliegues esperados y que `/api/health` responde `200` después de ellos.
- Cuando el frontend integre autenticación, prueba registro, sesión y cierre en navegadores reales con `credentials: 'include'`. Vercel y Render usan dominios distintos: las restricciones de cookies de terceros pueden afectar a la sesión incluso con CORS correcto.
- Mantén `.env` y credenciales fuera de Git. En el plan gratuito, el servicio de Render puede suspenderse por inactividad y tardar en responder al despertar.
