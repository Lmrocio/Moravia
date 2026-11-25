# Moravía — Frontend

El presidente puede crear una comunidad, generar o revocar un QR y gestionar las solicitudes de vinculación. Al abrir el enlace del QR, el vecino selecciona una vivienda disponible y crea su cuenta. El panel muestra el estado de la solicitud al volver a abrirlo o recargarlo.

La portada permite iniciar sesión o crear una cuenta. Tras registrarse, la bienvenida ofrece crear una comunidad o introducir una invitación para solicitar una vivienda con la cuenta existente. La incorporación queda pendiente hasta que el presidente la apruebe.

Para probar ambos roles, crea una finca y genera una invitación en un navegador. Abre el enlace en una ventana privada para registrar al vecino sin cambiar la sesión del presidente. Actualiza las solicitudes desde el panel de presidencia y aprueba o deniega el alta. Recarga el panel del vecino para comprobar el resultado.

En desarrollo, ejecuta el backend en el puerto 4000 y después:

```bash
cd frontend
npm install
npm run dev
```

Vite redirige `/api` al backend local. En producción, configura `VITE_API_URL` con el origen HTTPS público de la API antes de compilar; es una URL pública, no un secreto. Configura también `CLIENT_ORIGIN` del backend con el origen público exacto del frontend. Al servir la aplicación, `/unirse` debe redirigirse a `index.html` para permitir abrir el QR directamente.

El token de invitación solo se muestra una vez: tras recargar hay que generar otro para compartirlo, lo que invalida el anterior. Se puede revocar desde el panel incluso después de recargar.

## Demostración sin backend

Con `npm run dev`, abre `http://localhost:5173/?demo=1`. El modo de demostración permite probar la creación de una comunidad y la interfaz del QR con datos ficticios, sin servidor ni base de datos. El enlace de prueba solo se valida en la misma pestaña; no crea una invitación real y no sirve para incorporar vecinos. El modo está deshabilitado en compilaciones de producción.
