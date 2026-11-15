import { Router } from 'express';
import {
  getMe,
  updateOnboarding,
  updateProfile,
  checkUsername,
} from '../controllers/user.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Current user profile
router.get('/me', authenticateToken, getMe);

// Onboarding progress
router.put('/onboarding', authenticateToken, updateOnboarding);

// Profile management
router.put('/profile', authenticateToken, updateProfile);

// Username availability check
router.get('/check-username', checkUsername);

export default router;

