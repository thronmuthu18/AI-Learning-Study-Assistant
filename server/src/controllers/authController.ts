import { Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import config from '../config';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  currentLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  learningGoals: z.array(z.string()).optional(),
  subjects: z.array(z.string()).optional(),
  preferences: z
    .object({
      theme: z.enum(['dark', 'light', 'system']).optional(),
      preferredLearningStyle: z
        .enum(['visual', 'auditory', 'reading_writing', 'kinesthetic', 'balanced'])
        .optional(),
      dailyGoalMinutes: z.number().min(5).max(480).optional(),
      explanationDepth: z.enum(['concise', 'detailed', 'socratic']).optional(),
    })
    .optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const generateToken = (userId: string, email: string): string => {
  return jwt.sign({ id: userId, email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as any,
  });
};

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  const validated = registerSchema.parse(req.body);

  const existing = await User.findOne({ email: validated.email.toLowerCase() });
  if (existing) {
    throw new AppError('An account with this email address already exists.', 409);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(validated.password, salt);

  const user = await User.create({
    name: validated.name,
    email: validated.email.toLowerCase(),
    passwordHash,
    currentLevel: validated.currentLevel || 'intermediate',
    learningGoals: validated.learningGoals || [],
    subjects: validated.subjects || [],
    preferences: validated.preferences || {},
  });

  const token = generateToken(user._id.toString(), user.email);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      currentLevel: user.currentLevel,
      learningGoals: user.learningGoals,
      subjects: user.subjects,
      preferences: user.preferences,
      createdAt: user.createdAt,
    },
  });
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  const validated = loginSchema.parse(req.body);

  const user = await User.findOne({ email: validated.email.toLowerCase() }).select('+passwordHash');
  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  const isMatch = await user.comparePassword(validated.password);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401);
  }

  const token = generateToken(user._id.toString(), user.email);

  res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      currentLevel: user.currentLevel,
      learningGoals: user.learningGoals,
      subjects: user.subjects,
      preferences: user.preferences,
      createdAt: user.createdAt,
    },
  });
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!;

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      currentLevel: user.currentLevel,
      learningGoals: user.learningGoals,
      subjects: user.subjects,
      preferences: user.preferences,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const { name, currentLevel, learningGoals, subjects, preferences } = req.body;

  if (name) user.name = name;
  if (currentLevel) user.currentLevel = currentLevel;
  if (learningGoals) user.learningGoals = learningGoals;
  if (subjects) user.subjects = subjects;
  if (preferences) {
    user.preferences = {
      ...user.preferences,
      ...preferences,
    };
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      currentLevel: user.currentLevel,
      learningGoals: user.learningGoals,
      subjects: user.subjects,
      preferences: user.preferences,
      updatedAt: user.updatedAt,
    },
  });
};
