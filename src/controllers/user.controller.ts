import { type Response, type NextFunction } from 'express';
import { User, type IUser } from '../models/user.model.js';
import { type AuthenticatedRequest } from '../middleware/auth.middleware.js';
import {
  onboardingStepSchema,
  updateProfileSchema,
  checkUsernameSchema,
} from '../validations/user.validation.js';

export const sanitizeUser = (user: IUser) => {
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

/**
 * GET /api/users/me
 * Returns the current authenticated user's profile and state
 */
export const getMe = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
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

/**
 * PUT /api/users/onboarding
 * Progressively updates onboarding steps and stores preferences
 */
export const updateOnboarding = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const validatedData = onboardingStepSchema.parse(req.body);
    const user = req.user;

    // Merge onboarding subdocument fields
    if (validatedData.step !== undefined) user.onboarding.step = validatedData.step;
    if (validatedData.completed !== undefined) user.onboarding.completed = validatedData.completed;
    if (validatedData.goals !== undefined) user.onboarding.goals = validatedData.goals;
    if (validatedData.level !== undefined) user.onboarding.level = validatedData.level;
    if (validatedData.weeklyDays !== undefined) user.onboarding.weeklyDays = validatedData.weeklyDays;
    if (validatedData.preferredTime !== undefined) user.onboarding.preferredTime = validatedData.preferredTime;
    if (validatedData.remindersEnabled !== undefined) user.onboarding.remindersEnabled = validatedData.remindersEnabled;
    if (validatedData.gender !== undefined) user.onboarding.gender = validatedData.gender;
    if (validatedData.age !== undefined) user.onboarding.age = validatedData.age;
    if (validatedData.heightCm !== undefined) user.onboarding.heightCm = validatedData.heightCm;
    if (validatedData.weightKg !== undefined) user.onboarding.weightKg = validatedData.weightKg;
    if (validatedData.targetWeightKg !== undefined) user.onboarding.targetWeightKg = validatedData.targetWeightKg;
    if (validatedData.units !== undefined) user.onboarding.units = validatedData.units;
    if (validatedData.healthKitConnected !== undefined) user.onboarding.healthKitConnected = validatedData.healthKitConnected;
    if (validatedData.notificationsAllowed !== undefined) user.onboarding.notificationsAllowed = validatedData.notificationsAllowed;

    // Timezone update if supplied
    if (validatedData.timezone) {
      user.timezone = validatedData.timezone;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Onboarding progress saved',
      data: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/profile
 * Updates public user profile details (name, username, bio, avatar, units, timezone)
 */
export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const validatedData = updateProfileSchema.parse(req.body);
    const user = req.user;

    // Check username uniqueness if changed
    if (validatedData.username && validatedData.username !== user.username) {
      const existingUser = await User.findOne({
        username: validatedData.username,
        _id: { $ne: user._id },
      });

      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'Username is already taken. Please choose another.',
        });
        return;
      }

      user.username = validatedData.username;
    }

    if (validatedData.name !== undefined) user.name = validatedData.name;
    if (validatedData.bio !== undefined) user.bio = validatedData.bio;
    if (validatedData.avatarUrl !== undefined) user.avatarUrl = validatedData.avatarUrl;
    if (validatedData.timezone !== undefined) user.timezone = validatedData.timezone;
    if (validatedData.units !== undefined) user.onboarding.units = validatedData.units;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/check-username?username=...
 * Checks whether a proposed username is available
 */
export const checkUsername = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username } = checkUsernameSchema.parse(req.query);

    const existingUser = await User.findOne({ username });

    if (!existingUser) {
      res.status(200).json({ success: true, available: true });
      return;
    }

    // If current authenticated user already owns this username, it's available for them
    const isOwnUsername = req.user && existingUser._id.toString() === req.user._id.toString();

    res.status(200).json({
      success: true,
      available: !!isOwnUsername,
    });
  } catch (error) {
    next(error);
  }
};
