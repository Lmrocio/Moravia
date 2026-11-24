# Cookies y almacenamiento de Moravía

| Cookie | Para qué sirve | Cuándo se crea | Cuánto dura por defecto |
| --- | --- | --- | --- |
| `moravia_token` | Mantiene la sesión iniciada. | Al iniciar sesión o crear una cuenta. | 24 horas o hasta que cierres sesión. |
| `moravia_csrf` | Protege las operaciones que cambian datos. | Cuando el navegador pide un token en `GET /api/auth/csrf`, incluso antes del alta. | 24 horas o hasta que pidas otro token. |

La API establece ambas cookies. Usa `HttpOnly`, la ruta `/` y los ajustes `COOKIE_SECURE` y `COOKIE_SAMESITE`. La duración se configura con `JWT_EXPIRES_IN_HOURS`. Moravía no usa cookies de publicidad ni de analítica.

Cuando pulsas «Aceptar técnicas», el navegador guarda tu preferencia en `localStorage` con la clave `moravia-cookie-notice`. Así recuerda que ya viste el aviso. En la demo, `sessionStorage` guarda la invitación de prueba.
