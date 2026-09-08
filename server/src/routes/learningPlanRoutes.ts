import { Router } from 'express';
import {
  generateLearningPlan,
  getLearningPlans,
  getLearningPlanById,
  updateTaskStatus,
  deleteLearningPlan,
} from '../controllers/learningPlanController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authenticate);

router.post('/', asyncHandler(generateLearningPlan));
router.get('/', asyncHandler(getLearningPlans));
router.get('/:id', asyncHandler(getLearningPlanById));
router.patch('/:id/tasks/:taskId', asyncHandler(updateTaskStatus));
router.delete('/:id', asyncHandler(deleteLearningPlan));

export default router;
