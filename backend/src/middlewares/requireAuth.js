import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { AUTH_COOKIE, verifyToken } from '../utils/auth.js';

// Exige una sesión válida. Si la hay, deja el usuario en req.user.
export async function requireAuth(req, res, next) {
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token) {
    throw new AppError(401, 'Debes iniciar sesión');
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new AppError(401, 'Sesión no válida o caducada');
  }

  const user = await User.findById(payload.sub);
  // Una cuenta eliminada no puede seguir usando sesiones abiertas antes del borrado.
  if (!user || user.deletedAt) {
    throw new AppError(401, 'Sesión no válida o caducada');
  }

  req.user = user;
  next();
}