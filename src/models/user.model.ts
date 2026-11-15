import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAuthProvider {
  provider: 'email' | 'google' | 'apple';
  providerId?: string;
}

export interface ICodeDetails {
  codeHash?: string;
  expiresAt?: Date;
  lastSentAt?: Date;
}

export interface IOnboardingData {
  completed: boolean;
  step: number;
  goals: string[];
  level?: 'beginner' | 'intermediate' | 'advanced';
  weeklyDays: string[];
  preferredTime?: string;
  remindersEnabled: boolean;
  gender?: string;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  targetWeightKg?: number;
  units?: 'metric' | 'imperial';
  healthKitConnected?: boolean;
  notificationsAllowed?: boolean;
}

export interface IUserStats {
  totalWorkouts: number;
  totalCalories: number;
  totalMinutes: number;
}

export interface IUser extends Document {
  email: string;
  passwordHash?: string;
  name: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
  authProviders: IAuthProvider[];
  isEmailVerified: boolean;
  verificationCode?: ICodeDetails;
  passwordResetCode?: ICodeDetails;
  refreshTokens: string[];
  timezone: string;
  savedWorkouts: string[];
  onboarding: IOnboardingData;
  stats: IUserStats;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;

  comparePassword(candidatePassword: string): Promise<boolean>;
}

const AuthProviderSchema = new Schema<IAuthProvider>(
  {
    provider: { type: String, enum: ['email', 'google', 'apple'], required: true },
    providerId: { type: String },
  },
  { _id: false }
);

const CodeDetailsSchema = new Schema<ICodeDetails>(
  {
    codeHash: { type: String },
    expiresAt: { type: Date },
    lastSentAt: { type: Date },
  },
  { _id: false }
);

const OnboardingSchema = new Schema<IOnboardingData>(
  {
    completed: { type: Boolean, default: false },
    step: { type: Number, default: 1 },
    goals: [{ type: String }],
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    weeklyDays: [{ type: String }],
    preferredTime: { type: String, default: '08:00' },
    remindersEnabled: { type: Boolean, default: true },
    gender: { type: String },
    age: { type: Number },
    heightCm: { type: Number },
    weightKg: { type: Number },
    targetWeightKg: { type: Number },
    units: { type: String, enum: ['metric', 'imperial'], default: 'metric' },
    healthKitConnected: { type: Boolean, default: false },
    notificationsAllowed: { type: Boolean, default: false },
  },
  { _id: false }
);

const UserStatsSchema = new Schema<IUserStats>(
  {
    totalWorkouts: { type: Number, default: 0 },
    totalCalories: { type: Number, default: 0 },
    totalMinutes: { type: Number, default: 0 },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String },
    name: { type: String, default: '' },
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    bio: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    authProviders: [AuthProviderSchema],
    isEmailVerified: { type: Boolean, default: false, index: true },
    verificationCode: CodeDetailsSchema,
    passwordResetCode: CodeDetailsSchema,
    refreshTokens: [{ type: String }],
    timezone: { type: String, default: 'UTC' },
    savedWorkouts: [{ type: String, default: [] }],
    onboarding: { type: OnboardingSchema, default: () => ({}) },
    stats: { type: UserStatsSchema, default: () => ({}) },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  {
    timestamps: true,
  }
);

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User = mongoose.model<IUser>('User', UserSchema);

