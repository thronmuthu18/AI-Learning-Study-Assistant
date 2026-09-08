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
exports.Memory = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const MemorySchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
        type: String,
        enum: [
            'learning_style',
            'preference',
            'weak_topic',
            'strong_topic',
            'goal',
            'performance_pattern',
            'study_habit',
        ],
        required: true,
        index: true,
    },
    content: { type: String, required: true, trim: true, maxlength: 1000 },
    importance: { type: Number, min: 1, max: 10, default: 5 },
    source: {
        type: String,
        enum: ['chat', 'quiz', 'learning_plan', 'user_profile', 'manual'],
        default: 'chat',
    },
    courseId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Course' },
    metadata: { type: mongoose_1.Schema.Types.Mixed, default: {} },
}, { timestamps: true });
MemorySchema.index({ userId: 1, type: 1 });
MemorySchema.index({ userId: 1, importance: -1 });
exports.Memory = mongoose_1.default.model('Memory', MemorySchema);
exports.default = exports.Memory;
//# sourceMappingURL=Memory.js.map