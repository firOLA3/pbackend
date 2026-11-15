import mongoose, { Document, Schema } from 'mongoose';

export interface IWorkoutStep {
  order: number;
  exerciseSlug: string;
  exerciseName: string;
  stepType: 'timed' | 'counted';
  durationSeconds?: number;
  sets?: number;
  reps?: number;
  restSeconds: number;
  notes?: string;
}

export interface IWorkout extends Document {
  slug: string;
  title: string;
  description: string;
  category: 'strength' | 'cardio' | 'hiit' | 'flexibility' | 'core';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  durationMinutes: number;
  estimatedCalories: number;
  badge: string;
  bannerImage: string;
  primaryMuscles: string[];
  equipment: string[];
  steps: IWorkoutStep[];
  isFeatured: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const WorkoutStepSchema = new Schema<IWorkoutStep>(
  {
    order: { type: Number, required: true },
    exerciseSlug: { type: String, required: true },
    exerciseName: { type: String, required: true },
    stepType: { type: String, enum: ['timed', 'counted'], default: 'counted' },
    durationSeconds: { type: Number },
    sets: { type: Number, default: 3 },
    reps: { type: Number, default: 12 },
    restSeconds: { type: Number, default: 30 },
    notes: { type: String },
  },
  { _id: false }
);

const WorkoutSchema = new Schema<IWorkout>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['strength', 'cardio', 'hiit', 'flexibility', 'core'],
      required: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
      index: true,
    },
    durationMinutes: { type: Number, required: true },
    estimatedCalories: { type: Number, required: true },
    badge: { type: String, default: 'Workout' },
    bannerImage: { type: String, default: '' },
    primaryMuscles: [{ type: String }],
    equipment: [{ type: String }],
    steps: [WorkoutStepSchema],
    isFeatured: { type: Boolean, default: false, index: true },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

export const Workout = mongoose.model<IWorkout>('Workout', WorkoutSchema);

