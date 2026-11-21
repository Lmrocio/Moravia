import { Router } from 'express';
import { exportMyData } from '../controllers/user.controller.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

router.get('/me/export', requireAuth, exportMyData);

export default router;