"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProgressDashboard = void 0;
const Course_1 = __importDefault(require("../models/Course"));
const Document_1 = __importDefault(require("../models/Document"));
const LearningPlan_1 = __importDefault(require("../models/LearningPlan"));
const LearningTask_1 = __importDefault(require("../models/LearningTask"));
const QuizAttempt_1 = __importDefault(require("../models/QuizAttempt"));
const Conversation_1 = __importDefault(require("../models/Conversation"));
const StudySession_1 = __importDefault(require("../models/StudySession"));
const recommendationService_1 = __importDefault(require("../services/recommendationService"));
const getProgressDashboard = async (req, res) => {
    const userId = req.user._id;
    // 1. Basic entity counts
    const totalCourses = await Course_1.default.countDocuments({ userId });
    const totalDocuments = await Document_1.default.countDocuments({ userId, status: 'ready' });
    const totalPlans = await LearningPlan_1.default.countDocuments({ userId });
    // 2. Learning Plan Task Progress
    const totalTasks = await LearningTask_1.default.countDocuments({ userId });
    const completedTasks = await LearningTask_1.default.countDocuments({ userId, status: 'completed' });
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    // Active Plan & Today's tasks
    const activePlan = await LearningPlan_1.default.findOne({ userId, status: 'active' })
        .populate('courseId', 'title color icon')
        .sort({ updatedAt: -1 });
    let upcomingTasks = [];
    if (activePlan) {
        upcomingTasks = await LearningTask_1.default.find({
            planId: activePlan._id,
            status: { $in: ['todo', 'in_progress'] },
        })
            .sort({ weekNumber: 1, orderIndex: 1 })
            .limit(6);
    }
    // 3. Quiz Performance Stats
    const quizAttempts = await QuizAttempt_1.default.find({ userId }).sort({ createdAt: -1 });
    const totalQuizzesTaken = quizAttempts.length;
    const averageQuizScore = totalQuizzesTaken > 0
        ? Math.round(quizAttempts.reduce((sum, a) => sum + a.percentage, 0) / totalQuizzesTaken)
        : 0;
    const highestQuizScore = totalQuizzesTaken > 0 ? Math.max(...quizAttempts.map((a) => a.percentage)) : 0;
    // Aggregate Weak & Strong Topics
    const topicErrorCounts = {};
    for (const attempt of quizAttempts) {
        for (const ans of attempt.answers) {
            const topic = ans.topic || 'General';
            if (!topicErrorCounts[topic]) {
                topicErrorCounts[topic] = { total: 0, correct: 0 };
            }
            topicErrorCounts[topic].total += 1;
            if (ans.isCorrect)
                topicErrorCounts[topic].correct += 1;
        }
    }
    const weakTopics = [];
    const strongTopics = [];
    for (const [topic, stat] of Object.entries(topicErrorCounts)) {
        const accuracy = Math.round((stat.correct / stat.total) * 100);
        if (stat.total >= 2) {
            if (accuracy < 65) {
                weakTopics.push({ topic, accuracy, questions: stat.total });
            }
            else if (accuracy >= 80) {
                strongTopics.push({ topic, accuracy, questions: stat.total });
            }
        }
    }
    weakTopics.sort((a, b) => a.accuracy - b.accuracy);
    strongTopics.sort((a, b) => b.accuracy - a.accuracy);
    // 4. Study Streak & Sessions
    const sessions = await StudySession_1.default.find({ userId }).sort({ activityDate: -1 });
    const totalStudyMinutes = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
    // Calculate consecutive active days streak
    const streak = calculateStudyStreak(sessions.map((s) => s.activityDate));
    // 7-day Activity breakdown
    const last7DaysData = generateLast7DaysActivity(sessions);
    // 5. Recommendations
    const recommendations = await recommendationService_1.default.generateRecommendations(userId);
    // 6. Recent Materials & Recent Chats
    const recentDocuments = await Document_1.default.find({ userId, status: 'ready' })
        .populate('courseId', 'title color')
        .sort({ createdAt: -1 })
        .limit(4);
    const recentConversations = await Conversation_1.default.find({ userId })
        .populate('courseId', 'title color')
        .sort({ lastMessageAt: -1 })
        .limit(4);
    const recentQuizAttempts = await QuizAttempt_1.default.find({ userId })
        .populate('quizId', 'title difficulty')
        .sort({ createdAt: -1 })
        .limit(4);
    res.status(200).json({
        success: true,
        data: {
            stats: {
                totalCourses,
                totalDocuments,
                totalPlans,
                totalTasks,
                completedTasks,
                taskCompletionRate,
                totalQuizzesTaken,
                averageQuizScore,
                highestQuizScore,
                streakDays: streak,
                totalStudyMinutes,
            },
            activePlan,
            upcomingTasks,
            weakTopics: weakTopics.slice(0, 5),
            strongTopics: strongTopics.slice(0, 5),
            activityChart: last7DaysData,
            recommendations,
            recentDocuments,
            recentConversations,
            recentQuizAttempts,
        },
    });
};
exports.getProgressDashboard = getProgressDashboard;
/**
 * Calculates current consecutive study streak in days
 */
function calculateStudyStreak(dates) {
    if (!dates || dates.length === 0)
        return 0;
    // Normalize dates to YYYY-MM-DD unique set
    const uniqueDays = new Set();
    for (const d of dates) {
        const dayStr = new Date(d).toISOString().split('T')[0];
        uniqueDays.add(dayStr);
    }
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    // If user hasn't studied today or yesterday, streak is broken
    let currentCheckDate = new Date();
    if (!uniqueDays.has(todayStr)) {
        if (uniqueDays.has(yesterdayStr)) {
            currentCheckDate = yesterday;
        }
        else {
            return 0;
        }
    }
    let streak = 0;
    while (true) {
        const checkStr = currentCheckDate.toISOString().split('T')[0];
        if (uniqueDays.has(checkStr)) {
            streak++;
            currentCheckDate.setDate(currentCheckDate.getDate() - 1);
        }
        else {
            break;
        }
    }
    return streak;
}
/**
 * Generates last 7 days study minutes and task completion timeline
 */
function generateLast7DaysActivity(sessions) {
    const result = [];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayName = daysOfWeek[d.getDay()];
        const matchingSessions = sessions.filter((s) => {
            const sDate = new Date(s.activityDate).toISOString().split('T')[0];
            return sDate === dateStr;
        });
        const minutes = matchingSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
        const tasks = matchingSessions.reduce((sum, s) => sum + (s.completedTasksCount || 0), 0);
        result.push({
            day: dayName,
            date: dateStr,
            minutes,
            tasks,
        });
    }
    return result;
}
//# sourceMappingURL=progressController.js.map