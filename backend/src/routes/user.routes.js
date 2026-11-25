import { Router } from 'express';
import {
  deleteMyAccount,
  exportMyData,
  transferPresidency,
} from '../controllers/user.controller.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { validateBody } from '../middlewares/validate.js';
import { deleteAccountSchema, transferPresidencySchema } from '../validators/user.schemas.js';

const router = Router();

router.get('/me/export', requireAuth, exportMyData);
router.delete('/me', requireAuth, validateBody(deleteAccountSchema), deleteMyAccount);
router.post(
  '/me/presidency/transfer',
  requireAuth,
  validateBody(transferPresidencySchema),
  transferPresidency,
);

export default router;