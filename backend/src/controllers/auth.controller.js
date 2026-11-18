import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { hashPassword, setAuthCookie } from '../utils/auth.js';

export async function register(req, res) {
  const { name, email, password } = req.body;

  if (await User.exists({ email })) {
    throw new AppError(409, 'Ya existe una cuenta con ese correo');
  }

  const user = await User.create({ name, email, passwordHash: await hashPassword(password) });

  setAuthCookie(res, user._id);
  res.status(201).json({ user });
}