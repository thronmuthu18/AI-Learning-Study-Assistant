import { Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import LearningPlan, { IPlanModule } from '../models/LearningPlan';
import LearningTask from '../models/LearningTask';
import StudySession from '../models/StudySession';
import MemoryService from '../services/memoryService';
import { generateChatCompletion } from '../ai/openai';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const generatePlanSchema = z.object({
  subject: z.string().min(2, 'Subject name is required'),
  goal: z.string().min(3, 'Learning goal is required'),
  courseId: z.string().optional(),
  currentKnowledgeLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  availableHoursPerDay: z.number().min(0.5).max(16).optional(),
  targetDate: z.string().optional(),
  examDate: z.string().optional(),
  preferredLearningStyle: z.string().optional(),
});

export const generateLearningPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  const validated = generatePlanSchema.parse(req.body);
  const userId = req.user!._id;
  const user = req.user!;

  const learningStyle = validated.preferredLearningStyle || user.preferences?.preferredLearningStyle || 'balanced';
  const level = validated.currentKnowledgeLevel || user.currentLevel || 'intermediate';
  const dailyHours = validated.availableHoursPerDay || 2;

  // Retrieve student memory context to tailor plan
  const memoryContext = await MemoryService.getFormattedMemoryContext(userId);

  const systemPrompt = `You are a master Academic Curriculum Architect and Learning Strategist.
Generate a comprehensive, pedagogically sound, and realistic structured learning roadmap and task breakdown.

STUDENT PROFILE:
- Subject: ${validated.subject}
- Primary Goal: ${validated.goal}
- Current Knowledge Level: ${level}
- Available Hours Per Day: ${dailyHours} hours
- Preferred Learning Style: ${learningStyle}
${validated.targetDate ? `- Target Completion Date: ${validated.targetDate}` : ''}
${validated.examDate ? `- Exam Date: ${validated.examDate}` : ''}
${memoryContext}

RETURN STRICT JSON FORMAT:
{
  "title": "Inspiring Plan Title",
  "summary": "Concise summary of what the student will master and how this plan guarantees success.",
  "modules": [
    {
      "weekNumber": 1,
      "title": "Week 1: Foundational Core",
      "description": "Module overview",
      "topics": ["Topic 1", "Topic 2"],
      "subtopics": ["Subtopic A", "Subtopic B"],
      "estimatedHours": 6
    }
  ],
  "tasks": [
    {
      "weekNumber": 1,
      "dayNumber": 1,
      "title": "Read & Summarize Core Architectural Concepts",
      "description": "Actionable task instructions",
      "type": "topic" | "subtopic" | "reading" | "practice" | "revision" | "quiz_checkpoint",
      "priority": "high" | "medium" | "low",
      "estimatedMinutes": 45,
      "sourceTopic": "Core Architecture"
    }
  ]
}
Include at least 3-4 progressive weeks, with balanced theory, practice problems, revision days, and quiz checkpoints.`;

  const completion = await generateChatCompletion({
    messages: [{ role: 'system', content: systemPrompt }],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  let planData: any = {};
  try {
    planData = JSON.parse(completion.choices[0]?.message?.content || '{}');
  } catch (err) {
    throw new AppError('Failed to parse AI generated learning plan.', 500);
  }

  const modules: IPlanModule[] = Array.isArray(planData.modules) ? planData.modules : [];
  const rawTasks: any[] = Array.isArray(planData.tasks) ? planData.tasks : [];

  // Create Learning Plan in DB
  const learningPlan = await LearningPlan.create({
    userId,
    courseId: validated.courseId && mongoose.Types.ObjectId.isValid(validated.courseId)
      ? new mongoose.Types.ObjectId(validated.courseId)
      : undefined,
    title: planData.title || `Learning Roadmap: ${validated.subject}`,
    subject: validated.subject,
    goal: validated.goal,
    currentKnowledgeLevel: level,
    availableHoursPerDay: dailyHours,
    targetDate: validated.targetDate ? new Date(validated.targetDate) : undefined,
    examDate: validated.examDate ? new Date(validated.examDate) : undefined,
    preferredLearningStyle: learningStyle,
    summary: planData.summary || '',
    modules,
    totalTasks: rawTasks.length,
    completedTasks: 0,
    progressPercentage: 0,
    status: 'active',
  });

  // Create individual tasks
  const taskDocs = rawTasks.map((t, idx) => ({
    planId: learningPlan._id,
    userId,
    courseId: learningPlan.courseId,
    weekNumber: t.weekNumber || 1,
    dayNumber: t.dayNumber || 1,
    title: t.title || `Task ${idx + 1}`,
    description: t.description || '',
    type: ['topic', 'subtopic', 'reading', 'practice', 'revision', 'quiz_checkpoint'].includes(t.type)
      ? t.type
      : 'topic',
    priority: ['low', 'medium', 'high'].includes(t.priority) ? t.priority : 'medium',
    estimatedMinutes: t.estimatedMinutes || 45,
    status: 'todo',
    orderIndex: idx,
    sourceTopic: t.sourceTopic || '',
  }));

  const createdTasks = await LearningTask.insertMany(taskDocs);

  // Save learning goal to user's memory
  MemoryService.saveMemory({
    userId,
    type: 'goal',
    content: `Active Goal: Master ${validated.subject} (${validated.goal})`,
    importance: 8,
    source: 'learning_plan',
  }).catch(() => {});

  res.status(201).json({
    success: true,
    message: 'Personalized learning plan generated successfully',
    plan: learningPlan,
    tasks: createdTasks,
  });
};

export const getLearningPlans = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!._id;
  const { courseId, status } = req.query;

  const filter: any = { userId };
  if (courseId && mongoose.Types.ObjectId.isValid(courseId as string)) {
    filter.courseId = new mongoose.Types.ObjectId(courseId as string);
  }
  if (status) {
    filter.status = status;
  }

  const plans = await LearningPlan.find(filter)
    .populate('courseId', 'title color icon')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    plans,
  });
};

export const getLearningPlanById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid learning plan ID', 400);
  }

  const plan = await LearningPlan.findOne({ _id: id, userId }).populate('courseId', 'title color icon');
  if (!plan) {
    throw new AppError('Learning plan not found', 404);
  }

  const tasks = await LearningTask.find({ planId: plan._id, userId }).sort({
    weekNumber: 1,
    orderIndex: 1,
  });

  res.status(200).json({
    success: true,
    plan,
    tasks,
  });
};

export const updateTaskStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id, taskId } = req.params;
  const { status } = req.body;
  const userId = req.user!._id;

  if (!['todo', 'in_progress', 'completed'].includes(status)) {
    throw new AppError('Invalid task status. Must be todo, in_progress, or completed.', 400);
  }

  const task = await LearningTask.findOne({
    _id: taskId,
    planId: id,
    userId,
  });

  if (!task) {
    throw new AppError('Learning task not found', 404);
  }

  const wasCompleted = task.status === 'completed';
  task.status = status;
  if (status === 'completed') {
    task.completedAt = new Date();
  } else {
    task.completedAt = undefined;
  }
  await task.save();

  // Recalculate plan completion metrics
  const totalTasks = await LearningTask.countDocuments({ planId: id });
  const completedTasks = await LearningTask.countDocuments({ planId: id, status: 'completed' });
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const plan = await LearningPlan.findOneAndUpdate(
    { _id: id, userId },
    {
      totalTasks,
      completedTasks,
      progressPercentage,
      status: progressPercentage === 100 ? 'completed' : 'active',
    },
    { new: true }
  );

  // If newly completed, record study session
  if (status === 'completed' && !wasCompleted) {
    await StudySession.create({
      userId,
      courseId: task.courseId,
      sessionType: 'plan_task',
      durationMinutes: task.estimatedMinutes || 30,
      completedTasksCount: 1,
      activityDate: new Date(),
    });
  }

  res.status(200).json({
    success: true,
    task,
    planProgress: {
      totalTasks,
      completedTasks,
      progressPercentage,
      status: plan?.status,
    },
  });
};

export const deleteLearningPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid learning plan ID', 400);
  }

  const plan = await LearningPlan.findOneAndDelete({ _id: id, userId });
  if (!plan) {
    throw new AppError('Learning plan not found', 404);
  }

  await LearningTask.deleteMany({ planId: id, userId });

  res.status(200).json({
    success: true,
    message: 'Learning plan and associated tasks deleted successfully',
  });
};
