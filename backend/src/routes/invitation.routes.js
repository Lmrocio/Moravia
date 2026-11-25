import { Router } from 'express';
import { z } from 'zod';
import {
  acceptInvitation,
  registerResident,
  validateInvitation,
} from '../controllers/membership.controller.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { validateBody } from '../middlewares/validate.js';
import { registerSchema } from '../validators/auth.schemas.js';

const router = Router();
const schema = z.object({ token: z.string().regex(/^[A-Za-z0-9_-]{43}$/) });

router.post('/validate', validateBody(schema), validateInvitation);
router.post(
  '/accept',
  requireAuth,
  validateBody(
    schema.extend({
      dwellingId: z.string().regex(/^[a-f0-9]{24}$/i, 'Selecciona una vivienda válida'),
    }),
  ),
  acceptInvitation,
);
router.post(
  '/register',
  validateBody(
    registerSchema.extend({
      ...schema.shape,
      dwellingId: z.string().regex(/^[a-f0-9]{24}$/i, 'Selecciona una vivienda válida'),
    }),
  ),
  registerResident,
);

export default router;
