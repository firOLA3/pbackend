import { Router } from 'express';
import { getExercises, getExerciseBySlug } from '../controllers/exercise.controller.js';

const router = Router();

router.get('/', getExercises);
router.get('/:slug', getExerciseBySlug);

export default router;

