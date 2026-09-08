"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteConversation = exports.getConversationById = exports.getConversations = exports.sendMessage = void 0;
const zod_1 = require("zod");
const mongoose_1 = __importDefault(require("mongoose"));
const Conversation_1 = __importDefault(require("../models/Conversation"));
const Message_1 = __importDefault(require("../models/Message"));
const StudySession_1 = __importDefault(require("../models/StudySession"));
const ragPipeline_1 = __importDefault(require("../rag/ragPipeline"));
const memoryService_1 = __importDefault(require("../services/memoryService"));
const toolRegistry_1 = require("../tools/toolRegistry");
const toolExecutor_1 = __importDefault(require("../tools/toolExecutor"));
const openai_1 = require("../ai/openai");
const errorHandler_1 = require("../middleware/errorHandler");
const chatSchema = zod_1.z.object({
    conversationId: zod_1.z.string().optional(),
    message: zod_1.z.string().min(1, 'Message cannot be empty'),
    mode: zod_1.z.enum(['course_materials', 'general_study', 'exam_prep']).optional(),
    courseId: zod_1.z.string().optional(),
});
const sendMessage = async (req, res) => {
    const validated = chatSchema.parse(req.body);
    const userId = req.user._id;
    const userPreferences = req.user.preferences;
    // 1. Get or Create Conversation
    let conversation;
    if (validated.conversationId && mongoose_1.default.Types.ObjectId.isValid(validated.conversationId)) {
        conversation = await Conversation_1.default.findOne({ _id: validated.conversationId, userId });
        if (!conversation) {
            throw new errorHandler_1.AppError('Conversation not found', 404);
        }
        if (validated.mode)
            conversation.mode = validated.mode;
        if (validated.courseId)
            conversation.courseId = new mongoose_1.default.Types.ObjectId(validated.courseId);
    }
    else {
        // Generate an automatic conversation title from first few words of message
        const title = validated.message.slice(0, 45) + (validated.message.length > 45 ? '...' : '');
        conversation = await Conversation_1.default.create({
            userId,
            courseId: validated.courseId ? new mongoose_1.default.Types.ObjectId(validated.courseId) : undefined,
            title,
            mode: validated.mode || 'course_materials',
            messageCount: 0,
        });
    }
    // 2. Save User Message
    const userMessageDoc = await Message_1.default.create({
        conversationId: conversation._id,
        userId,
        role: 'user',
        content: validated.message,
        citations: [],
        toolsUsed: [],
    });
    // Fetch recent message history
    const priorMessages = await Message_1.default.find({ conversationId: conversation._id })
        .sort({ createdAt: 1 })
        .limit(10)
        .lean();
    const formattedHistory = priorMessages.map((m) => ({
        role: m.role,
        content: m.content,
    }));
    let assistantReplyText = '';
    let citations = [];
    const toolsUsed = [];
    // 3. Process based on Mode
    const activeMode = conversation.mode;
    if (activeMode === 'course_materials') {
        // RAG Pipeline execution
        const ragResult = await ragPipeline_1.default.answerQuestion(validated.message, {
            userId,
            courseId: conversation.courseId,
            chatHistory: formattedHistory,
            userPreferences,
        });
        assistantReplyText = ragResult.answer;
        citations = ragResult.citations;
    }
    else {
        // General Study or Exam Prep with AI Tools & Memory Injection
        const memoryContext = await memoryService_1.default.getFormattedMemoryContext(userId);
        const modeInstructions = activeMode === 'exam_prep'
            ? `You are an expert Exam Preparation Coach and Socratic Professor.
Help the student master the topic, identify gaps, ask diagnostic questions, challenge misconceptions, and prepare for exams.
${memoryContext}`
            : `You are an encouraging, expert AI Study Tutor.
Explain difficult concepts with clean analogies, code samples, and structured breakdowns tailored to the student's background.
${memoryContext}`;
        const systemPrompt = `${modeInstructions}
Format your responses with clean Markdown, headings, lists, and code blocks.
You have access to tools if you need to look up course materials, check student progress, save insights, or generate practice items.`;
        const messages = [
            { role: 'system', content: systemPrompt },
            ...formattedHistory.map((m) => ({ role: m.role, content: m.content })),
        ];
        // Query with tools enabled
        const completion = await (0, openai_1.generateChatCompletion)({
            messages,
            tools: toolRegistry_1.AI_TOOLS,
            tool_choice: 'auto',
            temperature: 0.4,
        });
        const choice = completion.choices[0];
        const responseMsg = choice?.message;
        // Check if the LLM called any tool
        if (responseMsg?.tool_calls && responseMsg.tool_calls.length > 0) {
            for (const call of responseMsg.tool_calls) {
                if (call.type === 'function') {
                    const fnName = call.function.name;
                    let fnArgs = {};
                    try {
                        fnArgs = JSON.parse(call.function.arguments || '{}');
                    }
                    catch (e) {
                        fnArgs = {};
                    }
                    const toolResult = await toolExecutor_1.default.executeTool(fnName, fnArgs, userId);
                    toolsUsed.push({
                        toolName: fnName,
                        args: fnArgs,
                        resultSummary: toolResult.summary,
                    });
                    // Feed tool response back into LLM
                    messages.push(responseMsg);
                    messages.push({
                        role: 'tool',
                        tool_call_id: call.id,
                        content: JSON.stringify(toolResult.data),
                    });
                }
            }
            // Final completion after tool results
            const finalCompletion = await (0, openai_1.generateChatCompletion)({
                messages,
                temperature: 0.3,
            });
            assistantReplyText = finalCompletion.choices[0]?.message?.content || 'Here is your requested study response.';
        }
        else {
            assistantReplyText = responseMsg?.content || 'How else can I assist your study session?';
        }
    }
    // 4. Save Assistant Message
    const assistantMessageDoc = await Message_1.default.create({
        conversationId: conversation._id,
        userId,
        role: 'assistant',
        content: assistantReplyText,
        citations,
        toolsUsed,
    });
    // 5. Update Conversation metadata
    conversation.lastMessageAt = new Date();
    conversation.messageCount += 2;
    await conversation.save();
    // 6. Record Study Session for streak & progress tracking
    await StudySession_1.default.create({
        userId,
        courseId: conversation.courseId,
        sessionType: 'chat',
        durationMinutes: 5,
        completedTasksCount: 0,
        activityDate: new Date(),
    });
    // 7. Background Auto-extract useful learner insights
    memoryService_1.default.extractAndStoreLearnerInsights(userId, validated.message, assistantReplyText).catch((err) => console.warn('[Chat] Background memory extraction error:', err));
    res.status(200).json({
        success: true,
        conversation: {
            id: conversation._id,
            title: conversation.title,
            mode: conversation.mode,
            courseId: conversation.courseId,
            updatedAt: conversation.updatedAt,
        },
        userMessage: userMessageDoc,
        assistantMessage: assistantMessageDoc,
    });
};
exports.sendMessage = sendMessage;
const getConversations = async (req, res) => {
    const userId = req.user._id;
    const { courseId, mode } = req.query;
    const filter = { userId };
    if (courseId && mongoose_1.default.Types.ObjectId.isValid(courseId)) {
        filter.courseId = new mongoose_1.default.Types.ObjectId(courseId);
    }
    if (mode) {
        filter.mode = mode;
    }
    const conversations = await Conversation_1.default.find(filter)
        .populate('courseId', 'title color icon')
        .sort({ lastMessageAt: -1 });
    res.status(200).json({
        success: true,
        conversations,
    });
};
exports.getConversations = getConversations;
const getConversationById = async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new errorHandler_1.AppError('Invalid conversation ID', 400);
    }
    const conversation = await Conversation_1.default.findOne({ _id: id, userId }).populate('courseId', 'title color icon');
    if (!conversation) {
        throw new errorHandler_1.AppError('Conversation not found', 404);
    }
    const messages = await Message_1.default.find({ conversationId: conversation._id, userId }).sort({ createdAt: 1 });
    res.status(200).json({
        success: true,
        conversation,
        messages,
    });
};
exports.getConversationById = getConversationById;
const deleteConversation = async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new errorHandler_1.AppError('Invalid conversation ID', 400);
    }
    const conversation = await Conversation_1.default.findOneAndDelete({ _id: id, userId });
    if (!conversation) {
        throw new errorHandler_1.AppError('Conversation not found', 404);
    }
    await Message_1.default.deleteMany({ conversationId: id, userId });
    res.status(200).json({
        success: true,
        message: 'Conversation and messages deleted successfully',
    });
};
exports.deleteConversation = deleteConversation;
//# sourceMappingURL=chatController.js.map