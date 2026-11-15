import mongoose, { Document, Schema } from 'mongoose';

export interface IScheduledDay {
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  dayName: string;
  isRestDay: boolean;
  workoutSlug?: string;
  workoutTitle?: string;
  workoutCategory?: string;
  durationMinutes?: number;
  estimatedCalories?: number;
  badge?: string;
}

export interface IPlan extends Document {
  userId: mongoose.Types.ObjectId;
  level: 'beginner' | 'intermediate' | 'advanced';
  goals: string[];
  sessionsPerWeek: number;
  preferredDays: string[];
  preferredTime: string;
  schedule: IScheduledDay[];
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduledDaySchema = new Schema<IScheduledDay>(
  {
    dayOfWeek: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: true,
    },
    dayName: { type: String, required: true },
    isRestDay: { type: Boolean, default: false },
    workoutSlug: { type: String },
    workoutTitle: { type: String },
    workoutCategory: { type: String },
    durationMinutes: { type: Number },
    estimatedCalories: { type: Number },
    badge: { type: String },
  },
  { _id: false }
);

const PlanSchema = new Schema<IPlan>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    goals: [{ type: String }],
    sessionsPerWeek: { type: Number, default: 3 },
    preferredDays: [{ type: String }],
    preferredTime: { type: String, default: '07:00' },
    schedule: [ScheduledDaySchema],
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Plan = mongoose.model<IPlan>('Plan', PlanSchema);

