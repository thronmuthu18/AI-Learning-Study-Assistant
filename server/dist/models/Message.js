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
exports.Message = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const CitationSchema = new mongoose_1.Schema({
    documentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Document', required: true },
    documentName: { type: String, required: true },
    pageNumber: { type: Number, default: 1 },
    snippet: { type: String, required: true },
    chunkIndex: { type: Number },
    score: { type: Number },
}, { _id: false });
const ToolInvocationSchema = new mongoose_1.Schema({
    toolName: { type: String, required: true },
    args: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    resultSummary: { type: String },
}, { _id: false });
const MessageSchema = new mongoose_1.Schema({
    conversationId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    citations: { type: [CitationSchema], default: [] },
    toolsUsed: { type: [ToolInvocationSchema], default: [] },
}, { timestamps: true });
MessageSchema.index({ conversationId: 1, createdAt: 1 });
exports.Message = mongoose_1.default.model('Message', MessageSchema);
exports.default = exports.Message;
//# sourceMappingURL=Message.js.map