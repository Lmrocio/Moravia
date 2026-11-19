# VecinHub — Backend

API REST de VecinHub con Node.js, Express 5 y MongoDB (Mongoose 8).

## Requisitos

- Node.js 22 o superior (recomendado 24 LTS)
- Acceso al clúster de MongoDB Atlas del proyecto, con un usuario de base de datos y tu IP permitida en **Database & Network Access**

## Puesta en marcha

```bash
cd backend
npm install
cp .env.example .env   # en PowerShell: copy .env.example .env
```

Rellena `MONGODB_URI` en `.env` con la cadena de conexión de Atlas y después:

```bash
npm run db:check       # comprueba la conexión con Atlas
npm run dev            # arranca la API con recarga automática
```

La API queda en `http://localhost:4000`. `GET /api/health` devuelve `200` si la base de datos está conectada y `503` si no lo está.

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Arranca la API y la reinicia al guardar cambios en los `.js`. |
| `npm start` | Arranca la API (producción). |
| `npm run db:check` | Crea un usuario y una comunidad de prueba en Atlas, los lee y los borra. |
| `npm test` | Ejecuta los tests con una MongoDB en memoria (no toca Atlas). |

## Estructura

```
backend/
├── scripts/db-check.js     # comprobación de la conexión con Atlas
├── src/
│   ├── app.js              # aplicación Express (rutas y middlewares)
│   ├── server.js           # conexión a la base de datos y arranque
│   ├── config/
│   │   ├── db.js           # conexión con Mongoose
│   │   └── env.js          # lectura y validación de variables de entorno
│   └── models/
│       ├── Community.js
│       └── User.js
└── tests/                  # tests con Vitest y mongodb-memory-server
```

## Modelos

- **User:** `name`, `email` (único y en minúsculas), `passwordHash` (no se devuelve nunca), `role` (`president` | `resident`), `communityId` y `dwellingId` (null hasta unirse a una comunidad), `membershipStatus` (`none` | `pending` | `validated`).
- **Community:** `name`, `address`, `presidentId`.