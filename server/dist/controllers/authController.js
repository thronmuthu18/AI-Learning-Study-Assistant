"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getMe = exports.login = exports.register = void 0;
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const config_1 = __importDefault(require("../config"));
const errorHandler_1 = require("../middleware/errorHandler");
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    email: zod_1.z.string().email('Invalid email address format'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    currentLevel: zod_1.z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    learningGoals: zod_1.z.array(zod_1.z.string()).optional(),
    subjects: zod_1.z.array(zod_1.z.string()).optional(),
    preferences: zod_1.z
        .object({
        theme: zod_1.z.enum(['dark', 'light', 'system']).optional(),
        preferredLearningStyle: zod_1.z
            .enum(['visual', 'auditory', 'reading_writing', 'kinesthetic', 'balanced'])
            .optional(),
        dailyGoalMinutes: zod_1.z.number().min(5).max(480).optional(),
        explanationDepth: zod_1.z.enum(['concise', 'detailed', 'socratic']).optional(),
    })
        .optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
const generateToken = (userId, email) => {
    return jsonwebtoken_1.default.sign({ id: userId, email }, config_1.default.jwtSecret, {
        expiresIn: config_1.default.jwtExpiresIn,
    });
};
const register = async (req, res) => {
    const validated = registerSchema.parse(req.body);
    const existing = await User_1.default.findOne({ email: validated.email.toLowerCase() });
    if (existing) {
        throw new errorHandler_1.AppError('An account with this email address already exists.', 409);
    }
    const salt = await bcryptjs_1.default.genSalt(10);
    const passwordHash = await bcryptjs_1.default.hash(validated.password, salt);
    const user = await User_1.default.create({
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
exports.register = register;
const login = async (req, res) => {
    const validated = loginSchema.parse(req.body);
    const user = await User_1.default.findOne({ email: validated.email.toLowerCase() }).select('+passwordHash');
    if (!user) {
        throw new errorHandler_1.AppError('Invalid email or password.', 401);
    }
    const isMatch = await user.comparePassword(validated.password);
    if (!isMatch) {
        throw new errorHandler_1.AppError('Invalid email or password.', 401);
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
exports.login = login;
const getMe = async (req, res) => {
    const user = req.user;
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
exports.getMe = getMe;
const updateProfile = async (req, res) => {
    const user = req.user;
    const { name, currentLevel, learningGoals, subjects, preferences } = req.body;
    if (name)
        user.name = name;
    if (currentLevel)
        user.currentLevel = currentLevel;
    if (learningGoals)
        user.learningGoals = learningGoals;
    if (subjects)
        user.subjects = subjects;
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
exports.updateProfile = updateProfile;
//# sourceMappingURL=authController.js.map