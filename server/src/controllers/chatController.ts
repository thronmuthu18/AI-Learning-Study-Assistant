import { Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import Conversation, { ChatMode } from '../models/Conversation';
import Message, { ICitation, IToolInvocation } from '../models/Message';
import StudySession from '../models/StudySession';
import RAGPipeline from '../rag/ragPipeline';
import MemoryService from '../services/memoryService';
import { AI_TOOLS } from '../tools/toolRegistry';
import ToolExecutor from '../tools/toolExecutor';
import { generateChatCompletion } from '../ai/openai';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const chatSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1, 'Message cannot be empty'),
  mode: z.enum(['course_materials', 'general_study', 'exam_prep']).optional(),
  courseId: z.string().optional(),
});

export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  const validated = chatSchema.parse(req.body);
  const userId = req.user!._id;
  const userPreferences = req.user!.preferences;

  // 1. Get or Create Conversation
  let conversation;
  if (validated.conversationId && mongoose.Types.ObjectId.isValid(validated.conversationId)) {
    conversation = await Conversation.findOne({ _id: validated.conversationId, userId });
    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }
    if (validated.mode) conversation.mode = validated.mode;
    if (validated.courseId) conversation.courseId = new mongoose.Types.ObjectId(validated.courseId);
  } else {
    // Generate an automatic conversation title from first few words of message
    const title = validated.message.slice(0, 45) + (validated.message.length > 45 ? '...' : '');
    conversation = await Conversation.create({
      userId,
      courseId: validated.courseId ? new mongoose.Types.ObjectId(validated.courseId) : undefined,
      title,
      mode: validated.mode || 'course_materials',
      messageCount: 0,
    });
  }

  // 2. Save User Message
  const userMessageDoc = await Message.create({
    conversationId: conversation._id,
    userId,
    role: 'user',
    content: validated.message,
    citations: [],
    toolsUsed: [],
  });

  // Fetch recent message history
  const priorMessages = await Message.find({ conversationId: conversation._id })
    .sort({ createdAt: 1 })
    .limit(10)
    .lean();

  const formattedHistory = priorMessages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  let assistantReplyText = '';
  let citations: ICitation[] = [];
  const toolsUsed: IToolInvocation[] = [];

  // 3. Process based on Mode
  const activeMode: ChatMode = conversation.mode;

  if (activeMode === 'course_materials') {
    // RAG Pipeline execution
    const ragResult = await RAGPipeline.answerQuestion(validated.message, {
      userId,
      courseId: conversation.courseId,
      chatHistory: formattedHistory,
      userPreferences,
    });

    assistantReplyText = ragResult.answer;
    citations = ragResult.citations;
  } else {
    // General Study or Exam Prep with AI Tools & Memory Injection
    const memoryContext = await MemoryService.getFormattedMemoryContext(userId);

    const modeInstructions =
      activeMode === 'exam_prep'
        ? `You are an expert Exam Preparation Coach and Socratic Professor.
Help the student master the topic, identify gaps, ask diagnostic questions, challenge misconceptions, and prepare for exams.
${memoryContext}`
        : `You are an encouraging, expert AI Study Tutor.
Explain difficult concepts with clean analogies, code samples, and structured breakdowns tailored to the student's background.
${memoryContext}`;

    const systemPrompt = `${modeInstructions}
Format your responses with clean Markdown, headings, lists, and code blocks.
You have access to tools if you need to look up course materials, check student progress, save insights, or generate practice items.`;

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...formattedHistory.map((m) => ({ role: m.role, content: m.content })),
    ];

    // Query with tools enabled
    const completion = await generateChatCompletion({
      messages,
      tools: AI_TOOLS,
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
          } catch (e) {
            fnArgs = {};
          }

          const toolResult = await ToolExecutor.executeTool(fnName, fnArgs, userId);
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
      const finalCompletion = await generateChatCompletion({
        messages,
        temperature: 0.3,
      });
      assistantReplyText = finalCompletion.choices[0]?.message?.content || 'Here is your requested study response.';
    } else {
      assistantReplyText = responseMsg?.content || 'How else can I assist your study session?';
    }
  }

  // 4. Save Assistant Message
  const assistantMessageDoc = await Message.create({
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
  await StudySession.create({
    userId,
    courseId: conversation.courseId,
    sessionType: 'chat',
    durationMinutes: 5,
    completedTasksCount: 0,
    activityDate: new Date(),
  });

  // 7. Background Auto-extract useful learner insights
  MemoryService.extractAndStoreLearnerInsights(userId, validated.message, assistantReplyText).catch((err) =>
    console.warn('[Chat] Background memory extraction error:', err)
  );

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

export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!._id;
  const { courseId, mode } = req.query;

  const filter: any = { userId };
  if (courseId && mongoose.Types.ObjectId.isValid(courseId as string)) {
    filter.courseId = new mongoose.Types.ObjectId(courseId as string);
  }
  if (mode) {
    filter.mode = mode;
  }

  const conversations = await Conversation.find(filter)
    .populate('courseId', 'title color icon')
    .sort({ lastMessageAt: -1 });

  res.status(200).json({
    success: true,
    conversations,
  });
};

export const getConversationById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid conversation ID', 400);
  }

  const conversation = await Conversation.findOne({ _id: id, userId }).populate('courseId', 'title color icon');
  if (!conversation) {
    throw new AppError('Conversation not found', 404);
  }

  const messages = await Message.find({ conversationId: conversation._id, userId }).sort({ createdAt: 1 });

  res.status(200).json({
    success: true,
    conversation,
    messages,
  });
};

export const deleteConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid conversation ID', 400);
  }

  const conversation = await Conversation.findOneAndDelete({ _id: id, userId });
  if (!conversation) {
    throw new AppError('Conversation not found', 404);
  }

  await Message.deleteMany({ conversationId: id, userId });

  res.status(200).json({
    success: true,
    message: 'Conversation and messages deleted successfully',
  });
};
