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
exports.Quiz = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const QuestionSourceSchema = new mongoose_1.Schema({
    documentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Document' },
    documentName: { type: String },
    pageNumber: { type: Number },
    excerpt: { type: String },
}, { _id: false });
const QuizQuestionSchema = new mongoose_1.Schema({
    questionIndex: { type: Number, required: true },
    type: { type: String, enum: ['mcq', 'true_false', 'short_answer'], default: 'mcq' },
    question: { type: String, required: true },
    options: { type: [String], default: [] },
    correctAnswer: { type: String, required: true },
    explanation: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    topic: { type: String, default: 'General' },
    sourceReference: { type: QuestionSourceSchema },
}, { _id: false });
const QuizSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Course', index: true },
    documentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Document', index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    topics: { type: [String], default: [] },
    questions: { type: [QuizQuestionSchema], default: [] },
    totalQuestions: { type: Number, default: 0 },
}, { timestamps: true });
QuizSchema.index({ userId: 1, courseId: 1, createdAt: -1 });
exports.Quiz = mongoose_1.default.model('Quiz', QuizSchema);
exports.default = exports.Quiz;
//# sourceMappingURL=Quiz.js.map