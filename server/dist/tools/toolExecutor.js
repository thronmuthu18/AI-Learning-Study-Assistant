"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolExecutor = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const vectorStore_1 = __importDefault(require("../rag/vectorStore"));
const Course_1 = __importDefault(require("../models/Course"));
const LearningPlan_1 = __importDefault(require("../models/LearningPlan"));
const LearningTask_1 = __importDefault(require("../models/LearningTask"));
const QuizAttempt_1 = __importDefault(require("../models/QuizAttempt"));
const memoryService_1 = __importDefault(require("../services/memoryService"));
const recommendationService_1 = __importDefault(require("../services/recommendationService"));
class ToolExecutor {
    static async executeTool(name, args, userId) {
        const userObjectId = new mongoose_1.default.Types.ObjectId(userId.toString());
        switch (name) {
            case 'searchCourseMaterials': {
                const query = args.query;
                const courseId = args.courseId;
                const results = await vectorStore_1.default.similaritySearch(query, {
                    userId: userObjectId,
                    courseId,
                    topK: 4,
                    minScore: 0.15,
                });
                const formatted = results.map((r) => ({
                    documentName: r.chunk.documentName,
                    pageNumber: r.chunk.pageNumber,
                    content: r.chunk.content.slice(0, 300),
                    score: Math.round(r.score * 100) / 100,
                }));
                return {
                    success: true,
                    data: formatted,
                    summary: `Found ${formatted.length} relevant excerpt(s) in course materials for "${query}".`,
                };
            }
            case 'getUserProgress': {
                const totalCourses = await Course_1.default.countDocuments({ userId: userObjectId });
                const completedTasks = await LearningTask_1.default.countDocuments({
                    userId: userObjectId,
                    status: 'completed',
                });
                const totalTasks = await LearningTask_1.default.countDocuments({ userId: userObjectId });
                const attempts = await QuizAttempt_1.default.find({ userId: userObjectId }).sort({ createdAt: -1 });
                const avgScore = attempts.length > 0
                    ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length)
                    : 0;
                return {
                    success: true,
                    data: {
                        totalCourses,
                        completedTasks,
                        totalTasks,
                        taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
                        quizAttemptsCount: attempts.length,
                        averageQuizScore: avgScore,
                    },
                    summary: `Progress summary: ${completedTasks}/${totalTasks} tasks done, ${attempts.length} quizzes taken with ${avgScore}% average score.`,
                };
            }
            case 'getLearningPlan': {
                const filter = { userId: userObjectId, status: 'active' };
                if (args.courseId)
                    filter.courseId = new mongoose_1.default.Types.ObjectId(args.courseId);
                const plan = await LearningPlan_1.default.findOne(filter).sort({ updatedAt: -1 });
                if (!plan) {
                    return {
                        success: true,
                        data: null,
                        summary: 'No active learning plan found for the current subject.',
                    };
                }
                const tasks = await LearningTask_1.default.find({ planId: plan._id })
                    .sort({ weekNumber: 1, orderIndex: 1 })
                    .limit(10);
                return {
                    success: true,
                    data: {
                        planId: plan._id,
                        title: plan.title,
                        subject: plan.subject,
                        goal: plan.goal,
                        progressPercentage: plan.progressPercentage,
                        tasks: tasks.map((t) => ({
                            id: t._id,
                            title: t.title,
                            week: t.weekNumber,
                            status: t.status,
                            priority: t.priority,
                        })),
                    },
                    summary: `Active plan "${plan.title}" is ${plan.progressPercentage}% complete.`,
                };
            }
            case 'getQuizHistory': {
                const limit = args.limit || 5;
                const attempts = await QuizAttempt_1.default.find({ userId: userObjectId })
                    .sort({ createdAt: -1 })
                    .limit(limit)
                    .populate('quizId', 'title difficulty');
                return {
                    success: true,
                    data: attempts.map((a) => ({
                        id: a._id,
                        score: a.score,
                        totalQuestions: a.totalQuestions,
                        percentage: a.percentage,
                        weakTopics: a.weakTopics,
                        strongTopics: a.strongTopics,
                        date: a.createdAt,
                    })),
                    summary: `Retrieved ${attempts.length} recent quiz attempt(s).`,
                };
            }
            case 'saveMemory': {
                const memory = await memoryService_1.default.saveMemory({
                    userId: userObjectId,
                    type: args.type,
                    content: args.content,
                    importance: args.importance || 6,
                    source: 'chat',
                });
                return {
                    success: true,
                    data: memory,
                    summary: `Saved insight to long-term memory: "${args.content}" [${args.type}].`,
                };
            }
            case 'recommendNextTopic': {
                const recommendations = await recommendationService_1.default.generateRecommendations(userObjectId);
                return {
                    success: true,
                    data: recommendations,
                    summary: `Generated ${recommendations.length} recommended learning action(s).`,
                };
            }
            default:
                return {
                    success: false,
                    data: null,
                    summary: `Unknown tool "${name}".`,
                };
        }
    }
}
exports.ToolExecutor = ToolExecutor;
exports.default = ToolExecutor;
//# sourceMappingURL=toolExecutor.js.map