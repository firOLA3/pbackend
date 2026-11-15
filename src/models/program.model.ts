import mongoose, { Document, Schema } from 'mongoose';

export interface IProgramDaySchedule {
  day: number; // 1 to 7
  isRestDay: boolean;
  workoutSlug?: string;
  workoutTitle?: string;
}

export interface IProgramWeek {
  weekNumber: number;
  title: string;
  schedule: IProgramDaySchedule[];
}

export interface IProgram extends Document {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  durationWeeks: number;
  sessionsPerWeek: number;
  badge: string;
  bannerImage: string;
  isFeatured: boolean;
  tags: string[];
  weeks: IProgramWeek[];
  createdAt: Date;
  updatedAt: Date;
}

const ProgramDayScheduleSchema = new Schema<IProgramDaySchedule>(
  {
    day: { type: Number, required: true },
    isRestDay: { type: Boolean, default: false },
    workoutSlug: { type: String },
    workoutTitle: { type: String },
  },
  { _id: false }
);

const ProgramWeekSchema = new Schema<IProgramWeek>(
  {
    weekNumber: { type: Number, required: true },
    title: { type: String, required: true },
    schedule: [ProgramDayScheduleSchema],
  },
  { _id: false }
);

const ProgramSchema = new Schema<IProgram>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    description: { type: String, required: true },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
      index: true,
    },
    durationWeeks: { type: Number, default: 4 },
    sessionsPerWeek: { type: Number, default: 3 },
    badge: { type: String, default: 'Program' },
    bannerImage: { type: String, default: '' },
    isFeatured: { type: Boolean, default: false, index: true },
    tags: [{ type: String }],
    weeks: [ProgramWeekSchema],
  },
  { timestamps: true }
);

export const Program = mongoose.model<IProgram>('Program', ProgramSchema);

