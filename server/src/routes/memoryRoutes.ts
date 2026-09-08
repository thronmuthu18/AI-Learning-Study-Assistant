import { Router } from 'express';
import {
  getMemories,
  createMemory,
  deleteMemory,
} from '../controllers/memoryController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(getMemories));
router.post('/', asyncHandler(createMemory));
router.delete('/:id', asyncHandler(deleteMemory));

export default router;
