import { Router } from 'express';
import { generateUserPlan, getMyPlan } from '../controllers/plan.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateToken as any);

router.post('/generate', generateUserPlan);
router.get('/my-plan', getMyPlan);

export default router;

