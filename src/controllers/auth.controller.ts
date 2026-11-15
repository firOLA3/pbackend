import { type Request, type Response, type NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { User, type IUser } from '../models/user.model.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js';
import {
  generateSixDigitCode,
  verifySixDigitCode,
  sendVerificationEmail,
  sendPasswordResetEmail,
} from '../services/email.service.js';
import {
  signupSchema,
  signinSchema,
  verifyEmailSchema,
  resendCodeSchema,
  forgotPasswordSchema,
  verifyResetCodeSchema,
  resetPasswordSchema,
  oauthAuthSchema,
  refreshTokenSchema,
  deleteAccountSchema,
} from '../validations/auth.validation.js';
import { type AuthenticatedRequest } from '../middleware/auth.middleware.js';

// Sanitize user object for API responses
const sanitizeUser = (user: IUser) => {
  return {
    id: user._id,
    email: user.email,
    name: user.name,
    username: user.username,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    isEmailVerified: user.isEmailVerified,
    authProviders: user.authProviders.map((p) => p.provider),
    timezone: user.timezone,
    onboarding: user.onboarding,
    stats: user.stats,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

export const signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = signupSchema.parse(req.body);
    const existingUser = await User.findOne({ email: validated.email });

    if (existingUser) {
      if (existingUser.passwordHash) {
        res.status(400).json({
          success: false,
          message: 'An account with this email already exists. Please sign in.',
        });
        return;
      }
      // If user signed up previously via Google/Apple, add password credentials
      const passwordHash = await bcrypt.hash(validated.password, 12);
      existingUser.passwordHash = passwordHash;
      if (!existingUser.authProviders.some((p) => p.provider === 'email')) {
        existingUser.authProviders.push({ provider: 'email' });
      }
      await existingUser.save();
      res.status(200).json({
        success: true,
        message: 'Password linked to your existing account. Please sign in.',
      });
      return;
    }

    const passwordHash = await bcrypt.hash(validated.password, 12);
    const { rawCode, codeHash, expiresAt } = await generateSixDigitCode(15);

    const newUser = new User({
      email: validated.email,
      passwordHash,
      name: validated.name || '',
      timezone: validated.timezone || 'UTC',
      authProviders: [{ provider: 'email' }],
      isEmailVerified: false,
      verificationCode: {
        codeHash,
        expiresAt,
        lastSentAt: new Date(),
      },
    });

    await newUser.save();
    await sendVerificationEmail(validated.email, rawCode);

    res.status(201).json({
      success: true,
      message: 'Account created. A 6-digit verification code has been sent to your email.',
      email: validated.email,
      cooldownSeconds: 30,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = verifyEmailSchema.parse(req.body);
    const user = await User.findOne({ email: validated.email });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found.',
      });
      return;
    }

    if (user.isEmailVerified) {
      const accessToken = generateAccessToken({ userId: user._id.toString(), email: user.email, role: user.role });
      const refreshToken = generateRefreshToken({ userId: user._id.toString(), email: user.email, role: user.role });
      user.refreshTokens.push(refreshToken);
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Email is already verified.',
        user: sanitizeUser(user),
        tokens: { accessToken, refreshToken },
      });
      return;
    }

    const verification = await verifySixDigitCode(
      validated.code,
      user.verificationCode?.codeHash,
      user.verificationCode?.expiresAt
    );

    if (!verification.valid) {
      res.status(400).json({
        success: false,
        message: verification.reason || 'Invalid verification code.',
      });
      return;
    }

    user.isEmailVerified = true;
    user.verificationCode = undefined; // single-use: cleared immediately

    const accessToken = generateAccessToken({ userId: user._id.toString(), email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user._id.toString(), email: user.email, role: user.role });

    user.refreshTokens = [refreshToken];
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully.',
      user: sanitizeUser(user),
      tokens: { accessToken, refreshToken },
    });
  } catch (error) {
    next(error);
  }
};

export const resendVerificationCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = resendCodeSchema.parse(req.body);
    const user = await User.findOne({ email: validated.email });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User with this email not found.',
      });
      return;
    }

    if (user.isEmailVerified) {
      res.status(400).json({
        success: false,
        message: 'Email is already verified.',
      });
      return;
    }

    // Enforce 30-second cooldown as specified in the design
    const lastSent = user.verificationCode?.lastSentAt;
    if (lastSent) {
      const elapsedSeconds = Math.floor((Date.now() - new Date(lastSent).getTime()) / 1000);
      if (elapsedSeconds < 30) {
        const remaining = 30 - elapsedSeconds;
        res.status(429).json({
          success: false,
          message: `Please wait ${remaining} seconds before requesting a new code.`,
          retryAfterSeconds: remaining,
        });
        return;
      }
    }

    const { rawCode, codeHash, expiresAt } = await generateSixDigitCode(15);
    user.verificationCode = {
      codeHash,
      expiresAt,
      lastSentAt: new Date(),
    };
    await user.save();
    await sendVerificationEmail(user.email, rawCode);

    res.status(200).json({
      success: true,
      message: 'A new 6-digit verification code has been sent.',
      cooldownSeconds: 30,
    });
  } catch (error) {
    next(error);
  }
};

export const signin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = signinSchema.parse(req.body);
    const user = await User.findOne({ email: validated.email });

    if (!user || !user.passwordHash) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
      return;
    }

    const isMatch = await user.comparePassword(validated.password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
      return;
    }

    if (!user.isEmailVerified) {
      res.status(403).json({
        success: false,
        message: 'Your email address has not been verified yet.',
        requiresVerification: true,
        email: user.email,
      });
      return;
    }

    const accessToken = generateAccessToken({ userId: user._id.toString(), email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user._id.toString(), email: user.email, role: user.role });

    user.refreshTokens.push(refreshToken);
    // Keep max 5 active devices/refresh tokens
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }
    await user.save();

    res.status(200).json({
      success: true,
      user: sanitizeUser(user),
      tokens: { accessToken, refreshToken },
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = forgotPasswordSchema.parse(req.body);
    const user = await User.findOne({ email: validated.email });

    // Prevent user enumeration: always return 200 even if email not registered
    if (!user) {
      res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a 6-digit password reset code has been sent.',
        cooldownSeconds: 30,
      });
      return;
    }

    // 30-second cooldown
    const lastSent = user.passwordResetCode?.lastSentAt;
    if (lastSent) {
      const elapsedSeconds = Math.floor((Date.now() - new Date(lastSent).getTime()) / 1000);
      if (elapsedSeconds < 30) {
        const remaining = 30 - elapsedSeconds;
        res.status(429).json({
          success: false,
          message: `Please wait ${remaining} seconds before requesting another code.`,
          retryAfterSeconds: remaining,
        });
        return;
      }
    }

    const { rawCode, codeHash, expiresAt } = await generateSixDigitCode(15);
    user.passwordResetCode = {
      codeHash,
      expiresAt,
      lastSentAt: new Date(),
    };
    await user.save();
    await sendPasswordResetEmail(user.email, rawCode);

    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a 6-digit password reset code has been sent.',
      cooldownSeconds: 30,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyResetCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = verifyResetCodeSchema.parse(req.body);
    const user = await User.findOne({ email: validated.email });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid code or email.',
      });
      return;
    }

    const verification = await verifySixDigitCode(
      validated.code,
      user.passwordResetCode?.codeHash,
      user.passwordResetCode?.expiresAt
    );

    if (!verification.valid) {
      res.status(400).json({
        success: false,
        message: verification.reason || 'Invalid reset code.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Code verified successfully. You may now reset your password.',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = resetPasswordSchema.parse(req.body);
    const user = await User.findOne({ email: validated.email });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid code or email.',
      });
      return;
    }

    const verification = await verifySixDigitCode(
      validated.code,
      user.passwordResetCode?.codeHash,
      user.passwordResetCode?.expiresAt
    );

    if (!verification.valid) {
      res.status(400).json({
        success: false,
        message: verification.reason || 'Invalid reset code.',
      });
      return;
    }

    const newPasswordHash = await bcrypt.hash(validated.newPassword, 12);
    user.passwordHash = newPasswordHash;
    user.passwordResetCode = undefined;
    // Invalidate all active sessions upon password reset for security
    user.refreshTokens = [];
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. Please sign in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

export const oauthLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = oauthAuthSchema.parse(req.body);
    let user = await User.findOne({ email: validated.email });

    if (user) {
      // Account linking: if user exists, link provider if not already linked
      const hasProvider = user.authProviders.some(
        (p) => p.provider === validated.provider && p.providerId === validated.providerId
      );

      if (!hasProvider) {
        user.authProviders.push({
          provider: validated.provider,
          providerId: validated.providerId,
        });
      }

      // OAuth providers verify email by default
      user.isEmailVerified = true;
      if (!user.name && validated.name) user.name = validated.name;
      if (!user.avatarUrl && validated.avatarUrl) user.avatarUrl = validated.avatarUrl;
    } else {
      // Create new user via OAuth
      user = new User({
        email: validated.email,
        name: validated.name || '',
        avatarUrl: validated.avatarUrl || '',
        isEmailVerified: true,
        authProviders: [
          {
            provider: validated.provider,
            providerId: validated.providerId,
          },
        ],
      });
    }

    const accessToken = generateAccessToken({ userId: user._id.toString(), email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user._id.toString(), email: user.email, role: user.role });

    user.refreshTokens.push(refreshToken);
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }
    await user.save();

    res.status(200).json({
      success: true,
      user: sanitizeUser(user),
      tokens: { accessToken, refreshToken },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = refreshTokenSchema.parse(req.body);
    let payload;

    try {
      payload = verifyRefreshToken(validated.refreshToken);
    } catch {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token.',
      });
      return;
    }

    const user = await User.findById(payload.userId);
    if (!user || !user.refreshTokens.includes(validated.refreshToken)) {
      res.status(401).json({
        success: false,
        message: 'Refresh token has been revoked or is invalid.',
      });
      return;
    }

    // Issue new access token and rotate refresh token
    const newAccessToken = generateAccessToken({ userId: user._id.toString(), email: user.email, role: user.role });
    const newRefreshToken = generateRefreshToken({ userId: user._id.toString(), email: user.email, role: user.role });

    user.refreshTokens = user.refreshTokens.filter((t) => t !== validated.refreshToken);
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    res.status(200).json({
      success: true,
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    const { refreshToken: tokenToRevoke } = req.body;

    if (user) {
      if (tokenToRevoke) {
        user.refreshTokens = user.refreshTokens.filter((t) => t !== tokenToRevoke);
      } else {
        user.refreshTokens = [];
      }
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = deleteAccountSchema.parse(req.body);
    const user = req.user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // Double check confirmation: must type DELETE
    if (validated.confirmText !== 'DELETE') {
      res.status(400).json({
        success: false,
        message: 'You must type DELETE to confirm account deletion.',
      });
      return;
    }

    const userId = user._id;

    // Phase 1 Cascade deletion:
    // Delete user document
    await User.findByIdAndDelete(userId);

    // Also delete any user plans, workout sessions, or saved items if collections exist
    try {
      const db = user.db;
      await Promise.allSettled([
        db.collection('userplans').deleteMany({ userId }),
        db.collection('workoutsessions').deleteMany({ userId }),
        db.collection('savedworkouts').deleteMany({ userId }),
      ]);
    } catch {
      // Collections might not be initialized yet in early Phase 1
    }

    res.status(200).json({
      success: true,
      message: 'Your account and all associated data have been permanently deleted.',
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    res.status(200).json({
      success: true,
      data: sanitizeUser(req.user),
    });
  } catch (error) {
    next(error);
  }
};

