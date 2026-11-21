import { Router } from 'express';
import { createCommunity } from '../controllers/community.controller.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { validateBody } from '../middlewares/validate.js';
import { createCommunitySchema } from '../validators/community.schemas.js';

const router = Router();

router.post('/', requireAuth, validateBody(createCommunitySchema), createCommunity);

export default router;