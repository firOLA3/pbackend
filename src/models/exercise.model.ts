import mongoose, { Document, Schema } from 'mongoose';

export interface IMultilingualText {
  en: string;
  de?: string;
  es?: string;
  fr?: string;
}

export interface IMultilingualList {
  en: string[];
  de?: string[];
  es?: string[];
  fr?: string[];
}

export interface IExerciseMedia {
  type: 'image' | 'animation' | 'video';
  subtype?: 'start' | 'peak' | 'main' | 'thumbnail';
  url: string;
  gender?: 'neutral' | 'female' | 'male';
}

export interface IExerciseRelation {
  to: string;
  relationType: 'alternative' | 'progression_of' | 'regression_of' | 'variant';
}

export interface IExercise extends Document {
  slug: string;
  name: IMultilingualText;
  description: IMultilingualText;
  instructions: IMultilingualList;
  tips: IMultilingualList;
  category: 'strength' | 'cardio' | 'stretching' | 'plyometrics' | 'olympic' | 'strongman' | string;
  forceType?: 'push' | 'pull' | 'dynamic' | 'static' | string;
  mechanic?: 'compound' | 'isolation' | string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  equipment: string;
  bodyPart: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  goals: string[];
  tags: string[];
  met: number;
  isUnilateral: boolean;
  isBodyweight: boolean;
  media: IExerciseMedia[];
  relations: IExerciseRelation[];
  attribution: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExerciseMediaSchema = new Schema<IExerciseMedia>(
  {
    type: { type: String, enum: ['image', 'animation', 'video'], required: true },
    subtype: { type: String, enum: ['start', 'peak', 'main', 'thumbnail'] },
    url: { type: String, required: true },
    gender: { type: String, enum: ['neutral', 'female', 'male'], default: 'neutral' },
  },
  { _id: false }
);

const ExerciseRelationSchema = new Schema<IExerciseRelation>(
  {
    to: { type: String, required: true },
    relationType: { type: String, required: true },
  },
  { _id: false }
);

const ExerciseSchema = new Schema<IExercise>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: {
      en: { type: String, required: true },
      de: { type: String },
      es: { type: String },
      fr: { type: String },
    },
    description: {
      en: { type: String, default: '' },
      de: { type: String },
      es: { type: String },
      fr: { type: String },
    },
    instructions: {
      en: [{ type: String }],
      de: [{ type: String }],
      es: [{ type: String }],
      fr: [{ type: String }],
    },
    tips: {
      en: [{ type: String }],
      de: [{ type: String }],
      es: [{ type: String }],
      fr: [{ type: String }],
    },
    category: { type: String, required: true, index: true },
    forceType: { type: String },
    mechanic: { type: String },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
      index: true,
    },
    equipment: { type: String, default: 'bodyweight', index: true },
    bodyPart: { type: String, required: true, index: true },
    primaryMuscles: [{ type: String, index: true }],
    secondaryMuscles: [{ type: String }],
    goals: [{ type: String }],
    tags: [{ type: String }],
    met: { type: Number, required: true, default: 5.0 },
    isUnilateral: { type: Boolean, default: false },
    isBodyweight: { type: Boolean, default: false },
    media: [ExerciseMediaSchema],
    relations: [ExerciseRelationSchema],
    attribution: {
      type: String,
      default: 'Exercise data & images: RepDB (https://repdb.co)',
    },
  },
  {
    timestamps: true,
  }
);

// Search indexes for Explore search (Phase 1.7)
ExerciseSchema.index({
  'name.en': 'text',
  'name.es': 'text',
  'name.de': 'text',
  category: 'text',
  bodyPart: 'text',
  equipment: 'text',
});

export const Exercise = mongoose.model<IExercise>('Exercise', ExerciseSchema);

