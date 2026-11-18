import { Router } from 'express';
import { register } from '../controllers/auth.controller.js';
import { validateBody } from '../middlewares/validate.js';
import { registerSchema } from '../validators/auth.schemas.js';

const router = Router();

router.post('/register', validateBody(registerSchema), register);

export default router;