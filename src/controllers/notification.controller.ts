import { Request, Response } from 'express';
import { Notification } from '../models/notification.model.js';

const SEED_NOTIFICATIONS = [
  {
    type: 'workout_reminder',
    title: 'Time for Full Body Burn',
    message: 'Your 7:00 AM workout is ready. 45 min · 320 kcal',
    timestampText: '7:00 AM',
    read: false,
    section: 'Today',
    data: { workoutSlug: 'full-body-burn' },
  },
  {
    type: 'badge_unlocked',
    title: 'New badge unlocked',
    message: 'You earned 7-Day Streak. Keep it up!',
    timestampText: '2h ago',
    read: false,
    section: 'Today',
    data: { badgeId: '7-day-streak' },
  },
  {
    type: 'challenge',
    title: 'SarahFit joined your challenge',
    message: '30-Day Pushup Challenge',
    timestampText: '4h ago',
    read: true,
    section: 'Today',
    data: { challengeId: 'pushup-30' },
  },
  {
    type: 'goal_progress',
    title: 'You’re 2 workouts away',
    message: 'Finish them to hit this week’s goal.',
    timestampText: 'Yesterday',
    read: true,
    section: 'Earlier',
  },
  {
    type: 'social_like',
    title: 'Mike_Trainer liked your post',
    message: 'Small progress is still progress.',
    timestampText: '2d ago',
    read: true,
    section: 'Earlier',
  },
  {
    type: 'weekly_summary',
    title: 'Your weekly summary is ready',
    message: '5 workouts and 3,400 kcal burned.',
    timestampText: 'Mon',
    read: true,
    section: 'Earlier',
  },
];

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    let notifications: any[] = await Notification.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .lean();

    // Auto-seed for new users or if empty to match the Figma design
    if (notifications.length === 0) {
      const seeded = await Notification.insertMany(
        SEED_NOTIFICATIONS.map((item, index) => ({
          ...item,
          userId: user._id,
          createdAt: new Date(Date.now() - index * 3600000),
        }))
      );
      notifications = seeded.map((doc) => doc.toObject());
    }

    const unreadCount = notifications.filter((n) => !n.read).length;

    res.status(200).json({
      success: true,
      unreadCount,
      data: notifications,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message,
    });
  }
};

export const markAllRead = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    await Notification.updateMany({ userId: user._id, read: false }, { $set: { read: true } });

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read',
      error: error.message,
    });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: user._id },
      { $set: { read: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update notification',
      error: error.message,
    });
  }
};

export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { id } = req.params;
    await Notification.findOneAndDelete({ _id: id, userId: user._id });

    res.status(200).json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message,
    });
  }
};
