"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMemory = exports.createMemory = exports.getMemories = void 0;
const zod_1 = require("zod");
const mongoose_1 = __importDefault(require("mongoose"));
const memoryService_1 = __importDefault(require("../services/memoryService"));
const errorHandler_1 = require("../middleware/errorHandler");
const createMemorySchema = zod_1.z.object({
    type: zod_1.z.enum([
        'learning_style',
        'preference',
        'weak_topic',
        'strong_topic',
        'goal',
        'performance_pattern',
        'study_habit',
    ]),
    content: zod_1.z.string().min(2, 'Content is required'),
    importance: zod_1.z.number().min(1).max(10).optional(),
});
const getMemories = async (req, res) => {
    const userId = req.user._id;
    const memories = await memoryService_1.default.getMemoriesForUser(userId, 50);
    res.status(200).json({
        success: true,
        memories,
    });
};
exports.getMemories = getMemories;
const createMemory = async (req, res) => {
    const validated = createMemorySchema.parse(req.body);
    const userId = req.user._id;
    const memory = await memoryService_1.default.saveMemory({
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
exports.createMemory = createMemory;
const deleteMemory = async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new errorHandler_1.AppError('Invalid memory ID', 400);
    }
    const success = await memoryService_1.default.deleteMemory(id, userId);
    if (!success) {
        throw new errorHandler_1.AppError('Memory not found or already deleted', 404);
    }
    res.status(200).json({
        success: true,
        message: 'Memory deleted successfully',
    });
};
exports.deleteMemory = deleteMemory;
//# sourceMappingURL=memoryController.js.map