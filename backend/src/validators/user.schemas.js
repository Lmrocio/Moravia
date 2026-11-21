import { z } from 'zod';

export const deleteAccountSchema = z.object({
  password: z
    .string({ error: 'Confirma tu contraseña para eliminar la cuenta' })
    .min(1, 'Confirma tu contraseña para eliminar la cuenta'),
});