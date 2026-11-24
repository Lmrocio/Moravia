# Moravía — Frontend

El panel permite iniciar sesión o registrar una cuenta, crear una comunidad y generar, copiar, descargar o revocar una invitación. El QR contiene la URL que devuelve el backend. El enlace comprueba el token, pero la incorporación efectiva del vecino aún está pendiente.

En desarrollo, ejecuta el backend en el puerto 4000 y después:

```bash
cd frontend
npm install
npm run dev
```

Vite redirige `/api` al backend local. En producción, configura `VITE_API_URL` con el origen HTTPS público de la API antes de compilar; es una URL pública, no un secreto. Configura también `CLIENT_ORIGIN` del backend con el origen público exacto del frontend. Al servir la aplicación, `/unirse` debe redirigirse a `index.html` para permitir abrir el QR directamente.

El token de invitación solo se muestra una vez: tras recargar hay que generar otro para compartirlo, lo que invalida el anterior. Se puede revocar desde el panel incluso después de recargar.
