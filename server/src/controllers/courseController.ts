import { Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import Course from '../models/Course';
import DocumentModel from '../models/Document';
import VectorStore from '../rag/vectorStore';
import LearningPlan from '../models/LearningPlan';
import Quiz from '../models/Quiz';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const createCourseSchema = z.object({
  title: z.string().min(2, 'Course title is required'),
  code: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export const createCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  const validated = createCourseSchema.parse(req.body);
  const userId = req.user!._id;

  const course = await Course.create({
    userId,
    title: validated.title,
    code: validated.code,
    description: validated.description || '',
    category: validated.category || 'General',
    tags: validated.tags || [],
    color: validated.color || '#6366f1',
    icon: validated.icon || 'BookOpen',
  });

  res.status(201).json({
    success: true,
    message: 'Course created successfully',
    course,
  });
};

export const getCourses = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!._id;
  const courses = await Course.find({ userId }).sort({ createdAt: -1 });

  // Update real-time counts for each course
  const coursesWithCounts = await Promise.all(
    courses.map(async (course) => {
      const docCount = await DocumentModel.countDocuments({ courseId: course._id, status: 'ready' });
      const planCount = await LearningPlan.countDocuments({ courseId: course._id });
      const quizCount = await Quiz.countDocuments({ courseId: course._id });

      const courseObj = course.toObject();
      return {
        ...courseObj,
        stats: {
          ...courseObj.stats,
          totalDocuments: docCount,
          totalPlans: planCount,
          totalQuizzes: quizCount,
        },
      };
    })
  );

  res.status(200).json({
    success: true,
    courses: coursesWithCounts,
  });
};

export const getCourseById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid course ID format', 400);
  }

  const course = await Course.findOne({ _id: id, userId });
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  const documents = await DocumentModel.find({ courseId: course._id, userId }).sort({ createdAt: -1 });
  const learningPlans = await LearningPlan.find({ courseId: course._id, userId }).sort({ createdAt: -1 });
  const quizzes = await Quiz.find({ courseId: course._id, userId }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    course,
    documents,
    learningPlans,
    quizzes,
  });
};

export const updateCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid course ID', 400);
  }

  const course = await Course.findOne({ _id: id, userId });
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  const { title, code, description, category, tags, color, icon } = req.body;
  if (title) course.title = title;
  if (code !== undefined) course.code = code;
  if (description !== undefined) course.description = description;
  if (category) course.category = category;
  if (tags) course.tags = tags;
  if (color) course.color = color;
  if (icon) course.icon = icon;

  await course.save();

  res.status(200).json({
    success: true,
    message: 'Course updated successfully',
    course,
  });
};

export const deleteCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid course ID', 400);
  }

  const course = await Course.findOneAndDelete({ _id: id, userId });
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  // Cascade delete chunks, documents, quizzes, plans
  await VectorStore.deleteCourseChunks(id);
  await DocumentModel.deleteMany({ courseId: id, userId });
  await Quiz.deleteMany({ courseId: id, userId });
  await LearningPlan.deleteMany({ courseId: id, userId });

  res.status(200).json({
    success: true,
    message: 'Course and all associated materials deleted successfully',
  });
};
