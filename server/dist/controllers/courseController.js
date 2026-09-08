"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCourse = exports.updateCourse = exports.getCourseById = exports.getCourses = exports.createCourse = void 0;
const zod_1 = require("zod");
const mongoose_1 = __importDefault(require("mongoose"));
const Course_1 = __importDefault(require("../models/Course"));
const Document_1 = __importDefault(require("../models/Document"));
const vectorStore_1 = __importDefault(require("../rag/vectorStore"));
const LearningPlan_1 = __importDefault(require("../models/LearningPlan"));
const Quiz_1 = __importDefault(require("../models/Quiz"));
const errorHandler_1 = require("../middleware/errorHandler");
const createCourseSchema = zod_1.z.object({
    title: zod_1.z.string().min(2, 'Course title is required'),
    code: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    color: zod_1.z.string().optional(),
    icon: zod_1.z.string().optional(),
});
const createCourse = async (req, res) => {
    const validated = createCourseSchema.parse(req.body);
    const userId = req.user._id;
    const course = await Course_1.default.create({
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
exports.createCourse = createCourse;
const getCourses = async (req, res) => {
    const userId = req.user._id;
    const courses = await Course_1.default.find({ userId }).sort({ createdAt: -1 });
    // Update real-time counts for each course
    const coursesWithCounts = await Promise.all(courses.map(async (course) => {
        const docCount = await Document_1.default.countDocuments({ courseId: course._id, status: 'ready' });
        const planCount = await LearningPlan_1.default.countDocuments({ courseId: course._id });
        const quizCount = await Quiz_1.default.countDocuments({ courseId: course._id });
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
    }));
    res.status(200).json({
        success: true,
        courses: coursesWithCounts,
    });
};
exports.getCourses = getCourses;
const getCourseById = async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new errorHandler_1.AppError('Invalid course ID format', 400);
    }
    const course = await Course_1.default.findOne({ _id: id, userId });
    if (!course) {
        throw new errorHandler_1.AppError('Course not found', 404);
    }
    const documents = await Document_1.default.find({ courseId: course._id, userId }).sort({ createdAt: -1 });
    const learningPlans = await LearningPlan_1.default.find({ courseId: course._id, userId }).sort({ createdAt: -1 });
    const quizzes = await Quiz_1.default.find({ courseId: course._id, userId }).sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        course,
        documents,
        learningPlans,
        quizzes,
    });
};
exports.getCourseById = getCourseById;
const updateCourse = async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new errorHandler_1.AppError('Invalid course ID', 400);
    }
    const course = await Course_1.default.findOne({ _id: id, userId });
    if (!course) {
        throw new errorHandler_1.AppError('Course not found', 404);
    }
    const { title, code, description, category, tags, color, icon } = req.body;
    if (title)
        course.title = title;
    if (code !== undefined)
        course.code = code;
    if (description !== undefined)
        course.description = description;
    if (category)
        course.category = category;
    if (tags)
        course.tags = tags;
    if (color)
        course.color = color;
    if (icon)
        course.icon = icon;
    await course.save();
    res.status(200).json({
        success: true,
        message: 'Course updated successfully',
        course,
    });
};
exports.updateCourse = updateCourse;
const deleteCourse = async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new errorHandler_1.AppError('Invalid course ID', 400);
    }
    const course = await Course_1.default.findOneAndDelete({ _id: id, userId });
    if (!course) {
        throw new errorHandler_1.AppError('Course not found', 404);
    }
    // Cascade delete chunks, documents, quizzes, plans
    await vectorStore_1.default.deleteCourseChunks(id);
    await Document_1.default.deleteMany({ courseId: id, userId });
    await Quiz_1.default.deleteMany({ courseId: id, userId });
    await LearningPlan_1.default.deleteMany({ courseId: id, userId });
    res.status(200).json({
        success: true,
        message: 'Course and all associated materials deleted successfully',
    });
};
exports.deleteCourse = deleteCourse;
//# sourceMappingURL=courseController.js.map