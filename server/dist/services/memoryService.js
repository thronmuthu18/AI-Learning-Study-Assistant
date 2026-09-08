"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Memory_1 = __importDefault(require("../models/Memory"));
const openai_1 = require("../ai/openai");
class MemoryService {
    /**
     * Save or update a student memory
     */
    static async saveMemory(params) {
        const userId = new mongoose_1.default.Types.ObjectId(params.userId.toString());
        const cleanContent = params.content.trim();
        // Check if an existing memory of same type has very similar content
        const existing = await Memory_1.default.findOne({
            userId,
            type: params.type,
            content: { $regex: new RegExp(`^${cleanContent.slice(0, 30)}`, 'i') },
        });
        if (existing) {
            existing.content = cleanContent;
            if (params.importance)
                existing.importance = params.importance;
            if (params.source)
                existing.source = params.source;
            return existing.save();
        }
        return Memory_1.default.create({
            userId,
            type: params.type,
            content: cleanContent,
            importance: params.importance || 5,
            source: params.source || 'chat',
            courseId: params.courseId ? new mongoose_1.default.Types.ObjectId(params.courseId.toString()) : undefined,
        });
    }
    /**
     * Retrieve all memories for a user formatted as clean context strings
     */
    static async getMemoriesForUser(userId, limit = 20) {
        return Memory_1.default.find({ userId: new mongoose_1.default.Types.ObjectId(userId.toString()) })
            .sort({ importance: -1, updatedAt: -1 })
            .limit(limit);
    }
    /**
     * Format memories into a string for LLM system prompt injection
     */
    static async getFormattedMemoryContext(userId) {
        const memories = await this.getMemoriesForUser(userId, 15);
        if (memories.length === 0)
            return '';
        const lines = memories.map((m) => `- [${m.type.toUpperCase()}] ${m.content} (Importance: ${m.importance}/10)`);
        return `\nSTUDENT PROFILE & MEMORY (Use these to personalize explanations, examples, and plans):\n${lines.join('\n')}\n`;
    }
    /**
     * Analyze conversation or text and automatically extract useful student learning memories
     */
    static async extractAndStoreLearnerInsights(userId, userMessage, assistantReply) {
        // Only extract if message contains indicators of preferences/weaknesses/goals
        const text = userMessage.toLowerCase();
        const learningKeywords = [
            'i struggle with',
            'i am weak at',
            'i find it hard',
            'my goal is',
            'i prefer',
            'i like visual',
            'explain like',
            'i am studying',
            'exam is on',
            'i dont understand',
            'confused about',
        ];
        const hasMatch = learningKeywords.some((k) => text.includes(k));
        if (!hasMatch)
            return;
        try {
            const prompt = `Analyze this student interaction and extract ONLY concrete, useful, non-sensitive study facts (like learning style, weak concepts, target goals).
If no clear lasting fact is present, return {"insights": []}.

STUDENT: "${userMessage}"
ASSISTANT: "${assistantReply.slice(0, 300)}"

Return JSON format:
{
  "insights": [
    {
      "type": "learning_style" | "preference" | "weak_topic" | "strong_topic" | "goal" | "study_habit",
      "content": "Short specific summary statement about the student",
      "importance": 1-10
    }
  ]
}`;
            const response = await (0, openai_1.generateChatCompletion)({
                messages: [{ role: 'system', content: prompt }],
                response_format: { type: 'json_object' },
                temperature: 0.1,
            });
            const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
            if (Array.isArray(parsed.insights)) {
                for (const item of parsed.insights) {
                    if (item.type && item.content) {
                        await this.saveMemory({
                            userId,
                            type: item.type,
                            content: item.content,
                            importance: item.importance || 6,
                            source: 'chat',
                        });
                    }
                }
            }
        }
        catch (err) {
            console.warn('[MemoryService] Auto-extraction skipped:', err.message);
        }
    }
    /**
     * Delete a memory by ID
     */
    static async deleteMemory(memoryId, userId) {
        const result = await Memory_1.default.deleteOne({
            _id: new mongoose_1.default.Types.ObjectId(memoryId),
            userId: new mongoose_1.default.Types.ObjectId(userId.toString()),
        });
        return result.deletedCount > 0;
    }
}
exports.MemoryService = MemoryService;
exports.default = MemoryService;
//# sourceMappingURL=memoryService.js.map