import { z } from 'zod';

export const onboardingStepSchema = z.object({
  step: z.number().int().min(1).max(6).optional(),
  completed: z.boolean().optional(),
  goals: z.array(z.string()).optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  weeklyDays: z.array(z.string()).optional(),
  preferredTime: z.string().optional(),
  remindersEnabled: z.boolean().optional(),
  gender: z.string().optional(),
  age: z.number().int().min(10).max(120).optional(),
  heightCm: z.number().positive().max(300).optional(),
  weightKg: z.number().positive().max(500).optional(),
  targetWeightKg: z.number().positive().max(500).optional(),
  units: z.enum(['metric', 'imperial']).optional(),
  healthKitConnected: z.boolean().optional(),
  notificationsAllowed: z.boolean().optional(),
  timezone: z.string().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, 'Name cannot be empty').max(60).optional(),
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(25, 'Username must be at most 25 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .toLowerCase()
    .optional(),
  bio: z.string().max(250, 'Bio cannot exceed 250 characters').optional(),
  avatarUrl: z.string().url('Avatar must be a valid URL').optional().or(z.literal('')),
  timezone: z.string().optional(),
  units: z.enum(['metric', 'imperial']).optional(),
});

export const checkUsernameSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(25, 'Username must be at most 25 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .toLowerCase(),
});

