import { Router } from 'express';
import { deleteMyAccount, exportMyData } from '../controllers/user.controller.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { validateBody } from '../middlewares/validate.js';
import { deleteAccountSchema } from '../validators/user.schemas.js';

const router = Router();

router.get('/me/export', requireAuth, exportMyData);
router.delete('/me', requireAuth, validateBody(deleteAccountSchema), deleteMyAccount);

export default router;