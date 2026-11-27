import { Router } from 'express';
import { z } from 'zod';
import { Invitation } from '../models/Invitation.js';
import { AppError } from '../utils/AppError.js';
import { hashToken } from '../utils/tokens.js';
import { validateBody } from '../middlewares/validate.js';

const router = Router();
const schema = z.object({ token: z.string().regex(/^[A-Za-z0-9_-]{43}$/) });

// El TTL no garantiza el borrado inmediato: hay que comprobar la fecha en la consulta.
router.post('/validate', validateBody(schema), async (req, res) => {
  const invitation = await Invitation.findOne({
    tokenHash: hashToken(req.body.token),
    expiresAt: { $gt: new Date() },
  }).select('expiresAt');
  if (!invitation) throw new AppError(404, 'La invitación no es válida o ha caducado');
  res.set('Cache-Control', 'no-store').json({ valid: true, expiresAt: invitation.expiresAt });
});

export default router;
