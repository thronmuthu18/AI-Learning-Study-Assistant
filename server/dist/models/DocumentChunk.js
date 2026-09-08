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
exports.DocumentChunk = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const DocumentChunkSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    documentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    content: { type: String, required: true },
    chunkIndex: { type: Number, required: true },
    pageNumber: { type: Number, default: 1 },
    documentName: { type: String, required: true },
    tokenCount: { type: Number, default: 0 },
    embedding: { type: [Number], required: true },
    metadata: {
        userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
        courseId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Course' },
        documentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Document' },
        documentName: { type: String },
        pageNumber: { type: Number, default: 1 },
        chunkIndex: { type: Number },
        totalChunks: { type: Number },
        sectionTitle: { type: String },
    },
}, { timestamps: true });
// Compound index for user chunk filtering
DocumentChunkSchema.index({ userId: 1, courseId: 1, documentId: 1 });
exports.DocumentChunk = mongoose_1.default.model('DocumentChunk', DocumentChunkSchema);
exports.default = exports.DocumentChunk;
//# sourceMappingURL=DocumentChunk.js.map