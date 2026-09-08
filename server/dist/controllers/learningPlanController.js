"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLearningPlan = exports.updateTaskStatus = exports.getLearningPlanById = exports.getLearningPlans = exports.generateLearningPlan = void 0;
const zod_1 = require("zod");
const mongoose_1 = __importDefault(require("mongoose"));
const LearningPlan_1 = __importDefault(require("../models/LearningPlan"));
const LearningTask_1 = __importDefault(require("../models/LearningTask"));
const StudySession_1 = __importDefault(require("../models/StudySession"));
const memoryService_1 = __importDefault(require("../services/memoryService"));
const openai_1 = require("../ai/openai");
const errorHandler_1 = require("../middleware/errorHandler");
const generatePlanSchema = zod_1.z.object({
    subject: zod_1.z.string().min(2, 'Subject name is required'),
    goal: zod_1.z.string().min(3, 'Learning goal is required'),
    courseId: zod_1.z.string().optional(),
    currentKnowledgeLevel: zod_1.z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    availableHoursPerDay: zod_1.z.number().min(0.5).max(16).optional(),
    targetDate: zod_1.z.string().optional(),
    examDate: zod_1.z.string().optional(),
    preferredLearningStyle: zod_1.z.string().optional(),
});
const generateLearningPlan = async (req, res) => {
    const validated = generatePlanSchema.parse(req.body);
    const userId = req.user._id;
    const user = req.user;
    const learningStyle = validated.preferredLearningStyle || user.preferences?.preferredLearningStyle || 'balanced';
    const level = validated.currentKnowledgeLevel || user.currentLevel || 'intermediate';
    const dailyHours = validated.availableHoursPerDay || 2;
    // Retrieve student memory context to tailor plan
    const memoryContext = await memoryService_1.default.getFormattedMemoryContext(userId);
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
    const completion = await (0, openai_1.generateChatCompletion)({
        messages: [{ role: 'system', content: systemPrompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
    });
    let planData = {};
    try {
        planData = JSON.parse(completion.choices[0]?.message?.content || '{}');
    }
    catch (err) {
        throw new errorHandler_1.AppError('Failed to parse AI generated learning plan.', 500);
    }
    const modules = Array.isArray(planData.modules) ? planData.modules : [];
    const rawTasks = Array.isArray(planData.tasks) ? planData.tasks : [];
    // Create Learning Plan in DB
    const learningPlan = await LearningPlan_1.default.create({
        userId,
        courseId: validated.courseId && mongoose_1.default.Types.ObjectId.isValid(validated.courseId)
            ? new mongoose_1.default.Types.ObjectId(validated.courseId)
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
    const createdTasks = await LearningTask_1.default.insertMany(taskDocs);
    // Save learning goal to user's memory
    memoryService_1.default.saveMemory({
        userId,
        type: 'goal',
        content: `Active Goal: Master ${validated.subject} (${validated.goal})`,
        importance: 8,
        source: 'learning_plan',
    }).catch(() => { });
    res.status(201).json({
        success: true,
        message: 'Personalized learning plan generated successfully',
        plan: learningPlan,
        tasks: createdTasks,
    });
};
exports.generateLearningPlan = generateLearningPlan;
const getLearningPlans = async (req, res) => {
    const userId = req.user._id;
    const { courseId, status } = req.query;
    const filter = { userId };
    if (courseId && mongoose_1.default.Types.ObjectId.isValid(courseId)) {
        filter.courseId = new mongoose_1.default.Types.ObjectId(courseId);
    }
    if (status) {
        filter.status = status;
    }
    const plans = await LearningPlan_1.default.find(filter)
        .populate('courseId', 'title color icon')
        .sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        plans,
    });
};
exports.getLearningPlans = getLearningPlans;
const getLearningPlanById = async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new errorHandler_1.AppError('Invalid learning plan ID', 400);
    }
    const plan = await LearningPlan_1.default.findOne({ _id: id, userId }).populate('courseId', 'title color icon');
    if (!plan) {
        throw new errorHandler_1.AppError('Learning plan not found', 404);
    }
    const tasks = await LearningTask_1.default.find({ planId: plan._id, userId }).sort({
        weekNumber: 1,
        orderIndex: 1,
    });
    res.status(200).json({
        success: true,
        plan,
        tasks,
    });
};
exports.getLearningPlanById = getLearningPlanById;
const updateTaskStatus = async (req, res) => {
    const { id, taskId } = req.params;
    const { status } = req.body;
    const userId = req.user._id;
    if (!['todo', 'in_progress', 'completed'].includes(status)) {
        throw new errorHandler_1.AppError('Invalid task status. Must be todo, in_progress, or completed.', 400);
    }
    const task = await LearningTask_1.default.findOne({
        _id: taskId,
        planId: id,
        userId,
    });
    if (!task) {
        throw new errorHandler_1.AppError('Learning task not found', 404);
    }
    const wasCompleted = task.status === 'completed';
    task.status = status;
    if (status === 'completed') {
        task.completedAt = new Date();
    }
    else {
        task.completedAt = undefined;
    }
    await task.save();
    // Recalculate plan completion metrics
    const totalTasks = await LearningTask_1.default.countDocuments({ planId: id });
    const completedTasks = await LearningTask_1.default.countDocuments({ planId: id, status: 'completed' });
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const plan = await LearningPlan_1.default.findOneAndUpdate({ _id: id, userId }, {
        totalTasks,
        completedTasks,
        progressPercentage,
        status: progressPercentage === 100 ? 'completed' : 'active',
    }, { new: true });
    // If newly completed, record study session
    if (status === 'completed' && !wasCompleted) {
        await StudySession_1.default.create({
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
exports.updateTaskStatus = updateTaskStatus;
const deleteLearningPlan = async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new errorHandler_1.AppError('Invalid learning plan ID', 400);
    }
    const plan = await LearningPlan_1.default.findOneAndDelete({ _id: id, userId });
    if (!plan) {
        throw new errorHandler_1.AppError('Learning plan not found', 404);
    }
    await LearningTask_1.default.deleteMany({ planId: id, userId });
    res.status(200).json({
        success: true,
        message: 'Learning plan and associated tasks deleted successfully',
    });
};
exports.deleteLearningPlan = deleteLearningPlan;
//# sourceMappingURL=learningPlanController.js.map