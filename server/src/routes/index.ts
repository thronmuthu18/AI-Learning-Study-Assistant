import { Router } from 'express';
import authRoutes from './authRoutes';
import courseRoutes from './courseRoutes';
import documentRoutes from './documentRoutes';
import chatRoutes from './chatRoutes';
import learningPlanRoutes from './learningPlanRoutes';
import quizRoutes from './quizRoutes';
import progressRoutes from './progressRoutes';
import memoryRoutes from './memoryRoutes';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/courses', courseRoutes);
apiRouter.use('/documents', documentRoutes);
apiRouter.use('/chat', chatRoutes);
apiRouter.use('/learning-plans', learningPlanRoutes);
apiRouter.use('/quizzes', quizRoutes);
apiRouter.use('/progress', progressRoutes);
apiRouter.use('/memory', memoryRoutes);

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'AI Learning & Study Assistant API',
    timestamp: new Date().toISOString(),
  });
});

export default apiRouter;
