import { z } from 'zod';
import { PASSWORD_MAX_BYTES } from './auth.schemas.js';

export const deleteAccountSchema = z.object({
  password: z
    .string({ error: 'Confirma tu contraseña para eliminar la cuenta' })
    .min(1, 'Confirma tu contraseña para eliminar la cuenta')
    .refine((value) => Buffer.byteLength(value, 'utf8') <= PASSWORD_MAX_BYTES, {
      error: 'La contraseña es demasiado larga',
    }),
});

export const transferPresidencySchema = z.object({
  userId: z
    .string({ error: 'Elige al nuevo presidente' })
    .regex(/^[a-f0-9]{24}$/i, 'Elige un vecino válido'),
});
