import { Router } from 'express';
import {
  createCommunity,
  createInvitation,
  revokeInvitation,
} from '../controllers/community.controller.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { validateBody } from '../middlewares/validate.js';
import { createCommunitySchema } from '../validators/community.schemas.js';

const router = Router();

router.post('/', requireAuth, validateBody(createCommunitySchema), createCommunity);
router.post('/:id/invitation', requireAuth, createInvitation);
router.delete('/:id/invitation', requireAuth, revokeInvitation);

export default router;
