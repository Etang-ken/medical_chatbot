import { Router } from 'express';
import { signupController, loginController, meController } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/signup', signupController);
router.post('/login', loginController);
router.get('/me', authenticate, meController);

export default router;
