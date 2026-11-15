import { Router } from 'express';
import {
  getWorkouts,
  getWorkoutBySlug,
  getSavedWorkouts,
  saveWorkout,
  unsaveWorkout,
} from '../controllers/workout.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.get('/', getWorkouts);

// Protected routes (order matters: /saved before /:slug so 'saved' is not treated as a slug)
router.get('/saved', authenticateToken as any, getSavedWorkouts);
router.post('/:slug/save', authenticateToken as any, saveWorkout);
router.delete('/:slug/save', authenticateToken as any, unsaveWorkout);

// Public route for workout details
router.get('/:slug', getWorkoutBySlug);

export default router;

