import { Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import MemoryService from '../services/memoryService';
import Memory from '../models/Memory';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const createMemorySchema = z.object({
  type: z.enum([
    'learning_style',
    'preference',
    'weak_topic',
    'strong_topic',
    'goal',
    'performance_pattern',
    'study_habit',
  ]),
  content: z.string().min(2, 'Content is required'),
  importance: z.number().min(1).max(10).optional(),
});

export const getMemories = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!._id;
  const memories = await MemoryService.getMemoriesForUser(userId, 50);

  res.status(200).json({
    success: true,
    memories,
  });
};

export const createMemory = async (req: AuthRequest, res: Response): Promise<void> => {
  const validated = createMemorySchema.parse(req.body);
  const userId = req.user!._id;

  const memory = await MemoryService.saveMemory({
    userId,
    type: validated.type,
    content: validated.content,
    importance: validated.importance || 6,
    source: 'manual',
  });

  res.status(201).json({
    success: true,
    message: 'Memory saved successfully',
    memory,
  });
};

export const deleteMemory = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid memory ID', 400);
  }

  const success = await MemoryService.deleteMemory(id, userId);
  if (!success) {
    throw new AppError('Memory not found or already deleted', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Memory deleted successfully',
  });
};
