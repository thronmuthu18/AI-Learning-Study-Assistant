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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const UserPreferencesSchema = new mongoose_1.Schema({
    theme: { type: String, enum: ['dark', 'light', 'system'], default: 'dark' },
    preferredLearningStyle: {
        type: String,
        enum: ['visual', 'auditory', 'reading_writing', 'kinesthetic', 'balanced'],
        default: 'balanced',
    },
    dailyGoalMinutes: { type: Number, default: 45 },
    explanationDepth: { type: String, enum: ['concise', 'detailed', 'socratic'], default: 'detailed' },
}, { _id: false });
const UserSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true,
        match: [/^\S+@\S+\.\S+$/, 'Invalid email address format'],
    },
    passwordHash: { type: String, required: true, select: false },
    preferences: { type: UserPreferencesSchema, default: () => ({}) },
    learningGoals: { type: [String], default: [] },
    currentLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'intermediate',
    },
    subjects: { type: [String], default: [] },
}, { timestamps: true });
// Method to verify password
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcryptjs_1.default.compare(candidatePassword, this.passwordHash);
};
exports.User = mongoose_1.default.model('User', UserSchema);
exports.default = exports.User;
//# sourceMappingURL=User.js.map