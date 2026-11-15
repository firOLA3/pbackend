import { Router } from 'express';
import { getPrograms, getProgramBySlug } from '../controllers/program.controller.js';

const router = Router();

router.get('/', getPrograms);
router.get('/:slug', getProgramBySlug);

export default router;

