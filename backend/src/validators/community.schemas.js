import { z } from 'zod';

export const MAX_FLOORS = 50;
export const MAX_DOORS_PER_FLOOR = 26; // de la A a la Z

// Número entero entre 0 y max, con mensajes que distinguen "falta" de "no es un número".
const count = (label, max) =>
  z
    .number({
      error: (issue) =>
        issue.input === undefined ? `${label} es obligatorio` : `${label} debe ser un número`,
    })
    .int(`${label} debe ser un número entero`)
    .min(0, `${label} no puede ser negativo`)
    .max(max, `${label} no puede superar ${max}`);

export const createCommunitySchema = z
  .object({
    name: z
      .string({ error: 'El nombre es obligatorio' })
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede superar los 100 caracteres'),
    address: z
      .string({ error: 'La dirección es obligatoria' })
      .trim()
      .min(2, 'La dirección debe tener al menos 2 caracteres')
      .max(200, 'La dirección no puede superar los 200 caracteres'),
    floors: count('El número de plantas', MAX_FLOORS),
    doorsPerFloor: count('El número de puertas por planta', MAX_DOORS_PER_FLOOR),
    floorDoorCounts: z
      .array(count('El número de viviendas de cada planta', MAX_DOORS_PER_FLOOR))
      .max(MAX_FLOORS)
      .optional(),
    groundFloorDoors: count('El número de puertas de la planta baja', MAX_DOORS_PER_FLOOR).default(
      0,
    ),
  })
  .refine((data) => !data.floorDoorCounts || data.floorDoorCounts.length === data.floors, {
    error: 'Indica el número de viviendas de cada planta',
    path: ['floorDoorCounts'],
  })
  .refine(
    (data) =>
      (data.floorDoorCounts
        ? data.floorDoorCounts.reduce((sum, n) => sum + n, 0)
        : data.floors * data.doorsPerFloor) +
        data.groundFloorDoors >
      0,
    {
      error: 'La comunidad debe tener al menos una vivienda',
      path: ['floors'],
    },
  );
