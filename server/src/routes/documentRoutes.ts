import { Router } from 'express';
import {
  uploadDocument,
  getDocuments,
  getDocumentById,
  deleteDocument,
} from '../controllers/documentController';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authenticate);

router.post('/upload', upload.single('file'), asyncHandler(uploadDocument));
router.get('/', asyncHandler(getDocuments));
router.get('/:id', asyncHandler(getDocumentById));
router.delete('/:id', asyncHandler(deleteDocument));

export default router;
