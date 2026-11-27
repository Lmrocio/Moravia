# Moravía — Frontend

El presidente puede crear una comunidad, generar o revocar un QR y gestionar las solicitudes de vinculación. Al abrir el enlace del QR, el vecino selecciona una vivienda disponible y crea su cuenta. El panel muestra el estado de la solicitud al volver a abrirlo o recargarlo.

## Demo académica con backend

Configura el backend con una base de datos de pruebas separada, por ejemplo `moravia-demo`. Crea la cuenta `presidencia@example.com` con una contraseña de prueba y registra una finca ficticia, como Comunidad Los Olivos en Calle del Ejemplo 1. Genera una invitación y abre el QR en una ventana privada. Registra allí a `vecina@example.com` y elige una vivienda. Desde la sesión de presidencia, actualiza las solicitudes y aprueba o deniega el alta. Recarga el panel de la vecina para comprobar el resultado.

Si alojas la demo para la entrega, configura el acceso al frontend y a la API para el equipo y el tutor. El aviso de datos ficticios es informativo. Usa credenciales exclusivas del entorno y evita compartir los QR fuera de la prueba.

## Configuración

En desarrollo, ejecuta el backend en el puerto 4000 y después:

```bash
cd frontend
npm install
npm run dev
```

Vite redirige `/api` al backend local. En producción, configura `VITE_API_URL` con el origen HTTPS público de la API antes de compilar; es una URL pública, no un secreto. Configura también `CLIENT_ORIGIN` del backend con el origen público exacto del frontend. Al servir la aplicación, `/unirse` debe redirigirse a `index.html` para permitir abrir el QR directamente.

El token de invitación solo se muestra una vez: tras recargar hay que generar otro para compartirlo, lo que invalida el anterior. Se puede revocar desde el panel incluso después de recargar.

El pie de página enlaza a privacidad, cookies y términos de uso. El alojamiento debe servir `index.html` cuando alguien abra directamente cualquiera de esas rutas.

## Demostración sin backend

Con `npm run dev`, abre `http://localhost:5173/?demo=1`. El modo de demostración permite probar la creación de una comunidad y la interfaz del QR con datos ficticios, sin servidor ni base de datos. El enlace de prueba solo se valida en la misma pestaña; no crea una invitación real y no sirve para incorporar vecinos. El modo está deshabilitado en compilaciones de producción.
