import { z } from 'zod';

export const deleteAccountSchema = z.object({
  password: z
    .string({ error: 'Confirma tu contraseña para eliminar la cuenta' })
    .min(1, 'Confirma tu contraseña para eliminar la cuenta'),
});

export const transferPresidencySchema = z.object({
  userId: z
    .string({ error: 'Elige al nuevo presidente' })
    .regex(/^[a-f0-9]{24}$/i, 'Elige un vecino válido'),
});