import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  name: z.string().trim().min(1, 'Name cannot be empty').optional(),
  timezone: z.string().optional(),
});

export const signinSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const verifyEmailSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  code: z.string().regex(/^\d{6}$/, 'Code must be exactly 6 digits'),
});

export const resendCodeSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
});

export const verifyResetCodeSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  code: z.string().regex(/^\d{6}$/, 'Code must be exactly 6 digits'),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  code: z.string().regex(/^\d{6}$/, 'Code must be exactly 6 digits'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
});

export const oauthAuthSchema = z.object({
  provider: z.enum(['google', 'apple']),
  providerId: z.string().min(1, 'Provider user ID is required'),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  name: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const deleteAccountSchema = z.object({
  confirmText: z.literal('DELETE', {
    errorMap: () => ({ message: 'You must type DELETE to confirm account deletion' }),
  }),
  password: z.string().optional(),
});

