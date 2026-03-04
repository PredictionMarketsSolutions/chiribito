import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticateJWT } from '../middleware/auth';
import { body } from 'express-validator';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();
const authController = new AuthController();

// Register route
router.post(
  '/register',
  [
    body('username').isString().isLength({ min: 3, max: 50 }),
    body('email').isEmail(),
    body('password').isLength({ min: 6 })
  ],
  validateRequest,
  authController.register.bind(authController)
);

// Login route
router.post(
  '/login',
  [
    body('email').isEmail(),
    body('password').exists()
  ],
  validateRequest,
  authController.login.bind(authController)
);

// Get current user
router.get('/me', authenticateJWT, authController.getProfile.bind(authController));

export default router;
