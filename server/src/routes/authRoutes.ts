import { Router } from 'express';
import { register, login, getMe, updateProfile } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.get('/me', authenticate, asyncHandler(getMe));
router.put('/profile', authenticate, asyncHandler(updateProfile));

export default router;
