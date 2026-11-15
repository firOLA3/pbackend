import { Router } from 'express';
import {
  signup,
  signin,
  verifyEmail,
  resendVerificationCode,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  oauthLogin,
  refreshToken,
  logout,
  deleteAccount,
  getMe,
} from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import {
  authLimiter,
  codeVerifyLimiter,
  passwordResetLimiter,
} from '../middleware/rate-limit.middleware.js';

const router = Router();

// Sign up and verification
router.post('/signup', authLimiter, signup);
router.post('/verify-email', codeVerifyLimiter, verifyEmail);
router.post('/resend-code', codeVerifyLimiter, resendVerificationCode);

// Sign in and session management
router.post('/signin', authLimiter, signin);
router.post('/refresh', refreshToken);
router.post('/oauth', oauthLogin);
router.post('/logout', authenticateToken, logout);

// Password recovery
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/verify-reset-code', codeVerifyLimiter, verifyResetCode);
router.post('/reset-password', passwordResetLimiter, resetPassword);

// Current user profile & account deletion
router.get('/me', authenticateToken, getMe);
router.delete('/account', authenticateToken, deleteAccount);

export default router;

