import { Router } from 'express';
import {
  getNotifications,
  markAllRead,
  markAsRead,
  deleteNotification,
} from '../controllers/notification.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// All notification routes are protected
router.use(authenticateToken as any);

router.get('/', getNotifications);
router.put('/mark-all-read', markAllRead);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;

