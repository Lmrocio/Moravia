import { z } from 'zod';

const email = z
  .string({ error: 'El correo es obligatorio' })
  .trim()
  .toLowerCase()
  .pipe(z.email('Correo no válido').max(254));

export const registerSchema = z.object({
  name: z
    .string({ error: 'El nombre es obligatorio' })
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(80, 'El nombre no puede superar los 80 caracteres'),
  email,
  // bcrypt solo tiene en cuenta los primeros 72 bytes de la contraseña.
  password: z
    .string({ error: 'La contraseña es obligatoria' })
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(72, 'La contraseña no puede superar los 72 caracteres'),
});

export const loginSchema = z.object({
  email,
  password: z.string({ error: 'La contraseña es obligatoria' }).min(1, 'La contraseña es obligatoria'),
});