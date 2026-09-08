"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LearningPlan = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PlanModuleSchema = new mongoose_1.Schema({
    weekNumber: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    topics: { type: [String], default: [] },
    subtopics: { type: [String], default: [] },
    estimatedHours: { type: Number, default: 5 },
}, { _id: false });
const LearningPlanSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Course', index: true },
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    goal: { type: String, required: true, trim: true },
    currentKnowledgeLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'intermediate',
    },
    availableHoursPerDay: { type: Number, default: 2 },
    targetDate: { type: Date },
    examDate: { type: Date },
    preferredLearningStyle: { type: String, default: 'balanced' },
    summary: { type: String, default: '' },
    modules: { type: [PlanModuleSchema], default: [] },
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
    status: {
        type: String,
        enum: ['active', 'completed', 'archived'],
        default: 'active',
        index: true,
    },
}, { timestamps: true });
LearningPlanSchema.index({ userId: 1, status: 1, createdAt: -1 });
exports.LearningPlan = mongoose_1.default.model('LearningPlan', LearningPlanSchema);
exports.default = exports.LearningPlan;
//# sourceMappingURL=LearningPlan.js.map