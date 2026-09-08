import { Router } from 'express';
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
} from '../controllers/courseController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authenticate);

router.post('/', asyncHandler(createCourse));
router.get('/', asyncHandler(getCourses));
router.get('/:id', asyncHandler(getCourseById));
router.put('/:id', asyncHandler(updateCourse));
router.delete('/:id', asyncHandler(deleteCourse));

export default router;
