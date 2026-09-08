import { Router } from 'express';
import { getProgressDashboard } from '../controllers/progressController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(getProgressDashboard));

export default router;
