"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const QuizAttempt_1 = __importDefault(require("../models/QuizAttempt"));
const LearningPlan_1 = __importDefault(require("../models/LearningPlan"));
const LearningTask_1 = __importDefault(require("../models/LearningTask"));
const Course_1 = __importDefault(require("../models/Course"));
const Memory_1 = __importDefault(require("../models/Memory"));
class RecommendationService {
    /**
     * Generates explainable, real data-driven recommendations for the user
     */
    static async generateRecommendations(userId) {
        const userObjectId = new mongoose_1.default.Types.ObjectId(userId.toString());
        const recommendations = [];
        // 1. Analyze Recent Quiz Attempts for Weak Topics
        const recentAttempts = await QuizAttempt_1.default.find({ userId: userObjectId })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();
        const topicStats = {};
        for (const attempt of recentAttempts) {
            for (const ans of attempt.answers) {
                const topic = ans.topic || 'General';
                if (!topicStats[topic]) {
                    topicStats[topic] = {
                        total: 0,
                        incorrect: 0,
                        courseId: attempt.courseId ? attempt.courseId.toString() : undefined,
                    };
                }
                topicStats[topic].total += 1;
                if (!ans.isCorrect) {
                    topicStats[topic].incorrect += 1;
                }
            }
        }
        // Find topics with high error rates (> 35% incorrect)
        for (const [topic, stat] of Object.entries(topicStats)) {
            const errorRate = stat.incorrect / stat.total;
            if (stat.total >= 2 && errorRate >= 0.35) {
                recommendations.push({
                    id: `quiz-rec-${topic.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                    title: `Revise Weak Topic: ${topic}`,
                    topic,
                    category: 'revision',
                    reason: `You missed ${stat.incorrect} out of ${stat.total} (${Math.round(errorRate * 100)}%) questions on this topic in recent quizzes.`,
                    priority: errorRate >= 0.6 ? 'high' : 'medium',
                    courseId: stat.courseId,
                    suggestedAction: 'Take a targeted revision quiz or ask the AI tutor to explain this concept.',
                });
            }
        }
        // 2. Check Active Learning Plans for the Next Incomplete Task
        const activePlan = await LearningPlan_1.default.findOne({
            userId: userObjectId,
            status: 'active',
        })
            .sort({ updatedAt: -1 })
            .lean();
        if (activePlan) {
            const nextTask = await LearningTask_1.default.findOne({
                planId: activePlan._id,
                status: { $in: ['todo', 'in_progress'] },
            })
                .sort({ weekNumber: 1, orderIndex: 1 })
                .lean();
            if (nextTask) {
                recommendations.push({
                    id: `task-rec-${nextTask._id}`,
                    title: `Next Up: ${nextTask.title}`,
                    topic: nextTask.title,
                    category: 'next_task',
                    reason: `Part of your active roadmap "${activePlan.title}" (Week ${nextTask.weekNumber}, ~${nextTask.estimatedMinutes} mins).`,
                    priority: 'high',
                    planId: activePlan._id.toString(),
                    taskId: nextTask._id.toString(),
                    courseId: activePlan.courseId ? activePlan.courseId.toString() : undefined,
                    suggestedAction: 'Continue with your personalized study plan roadmap.',
                });
            }
        }
        // 3. Check for Stored Weak Topic Memories
        const weakMemories = await Memory_1.default.find({
            userId: userObjectId,
            type: 'weak_topic',
        })
            .sort({ importance: -1 })
            .limit(3)
            .lean();
        for (const memory of weakMemories) {
            const alreadyRecommended = recommendations.some((r) => r.topic.toLowerCase().includes(memory.content.toLowerCase()));
            if (!alreadyRecommended) {
                recommendations.push({
                    id: `memory-rec-${memory._id}`,
                    title: `Targeted Practice: ${memory.content}`,
                    topic: memory.content,
                    category: 'revision',
                    reason: `Flagged during previous sessions as a focus area (${memory.content}).`,
                    priority: memory.importance >= 7 ? 'high' : 'medium',
                    suggestedAction: 'Generate a focused practice quiz to verify your progress.',
                });
            }
        }
        // 4. Default Fallback Recommendation if learner is completely new
        if (recommendations.length === 0) {
            const firstCourse = await Course_1.default.findOne({ userId: userObjectId }).sort({ createdAt: -1 });
            recommendations.push({
                id: 'new-user-welcome-rec',
                title: firstCourse ? `Start Studying: ${firstCourse.title}` : 'Create Your First Course & Study Plan',
                topic: firstCourse ? firstCourse.title : 'Study Assistant Setup',
                category: 'next_task',
                reason: firstCourse
                    ? 'Upload your syllabus or lecture slides to generate tailored quizzes and roadmaps.'
                    : 'Set up your learning goals and upload course notes to unlock full AI RAG assistance.',
                priority: 'high',
                courseId: firstCourse ? firstCourse._id.toString() : undefined,
                suggestedAction: 'Upload lecture materials or create an AI study plan.',
            });
        }
        return recommendations.slice(0, 5);
    }
}
exports.RecommendationService = RecommendationService;
exports.default = RecommendationService;
//# sourceMappingURL=recommendationService.js.map