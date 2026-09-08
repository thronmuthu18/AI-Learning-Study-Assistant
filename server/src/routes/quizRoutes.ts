import { Router } from 'express';
import {
  generateQuiz,
  getQuizzes,
  getQuizById,
  submitQuiz,
} from '../controllers/quizController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authenticate);

router.post('/generate', asyncHandler(generateQuiz));
router.get('/', asyncHandler(getQuizzes));
router.get('/:id', asyncHandler(getQuizById));
router.post('/:id/submit', asyncHandler(submitQuiz));

export default router;
