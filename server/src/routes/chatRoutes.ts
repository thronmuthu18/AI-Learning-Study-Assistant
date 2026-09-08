import { Router } from 'express';
import {
  sendMessage,
  getConversations,
  getConversationById,
  deleteConversation,
} from '../controllers/chatController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authenticate);

router.post('/', asyncHandler(sendMessage));
router.get('/conversations', asyncHandler(getConversations));
router.get('/conversations/:id', asyncHandler(getConversationById));
router.delete('/conversations/:id', asyncHandler(deleteConversation));

export default router;
