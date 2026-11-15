import mongoose, { Schema, Document, Types } from 'mongoose';

export type NotificationType =
  | 'workout_reminder'
  | 'badge_unlocked'
  | 'challenge'
  | 'goal_progress'
  | 'social_like'
  | 'weekly_summary'
  | 'system';

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  timestampText: string;
  section: 'Today' | 'Earlier';
  data?: {
    workoutSlug?: string;
    badgeId?: string;
    challengeId?: string;
    url?: string;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'workout_reminder',
        'badge_unlocked',
        'challenge',
        'goal_progress',
        'social_like',
        'weekly_summary',
        'system',
      ],
      default: 'system',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    timestampText: {
      type: String,
      default: 'Just now',
    },
    section: {
      type: String,
      enum: ['Today', 'Earlier'],
      default: 'Today',
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);

