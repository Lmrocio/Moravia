import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import app from './app.js';
import { User } from './models/User.js';

async function start() {
  try {
    await connectDB(env.MONGODB_URI);
    await User.init();
  } catch (err) {
    console.error('No se pudo conectar a MongoDB:', err.message);
    process.exit(1);
  }

  const server = app.listen(env.PORT, () => {
    console.log(`API escuchando en http://localhost:${env.PORT}`);
  });

  const shutdown = async (signal) => {
    console.log(`${signal} recibido, cerrando...`);
    server.close();
    await disconnectDB();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start();
