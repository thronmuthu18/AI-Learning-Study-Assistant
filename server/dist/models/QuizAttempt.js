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
exports.QuizAttempt = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const QuizAnswerSubmissionSchema = new mongoose_1.Schema({
    questionIndex: { type: Number, required: true },
    questionText: { type: String, required: true },
    selectedAnswer: { type: String, required: true },
    correctAnswer: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
    explanation: { type: String, default: '' },
    topic: { type: String, default: 'General' },
}, { _id: false });
const QuizAttemptSchema = new mongoose_1.Schema({
    quizId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Course', index: true },
    answers: { type: [QuizAnswerSubmissionSchema], default: [] },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    percentage: { type: Number, required: true },
    weakTopics: { type: [String], default: [] },
    strongTopics: { type: [String], default: [] },
    timeSpentSeconds: { type: Number, default: 0 },
    completedAt: { type: Date, default: Date.now },
}, { timestamps: true });
QuizAttemptSchema.index({ userId: 1, createdAt: -1 });
QuizAttemptSchema.index({ userId: 1, courseId: 1 });
exports.QuizAttempt = mongoose_1.default.model('QuizAttempt', QuizAttemptSchema);
exports.default = exports.QuizAttempt;
//# sourceMappingURL=QuizAttempt.js.map