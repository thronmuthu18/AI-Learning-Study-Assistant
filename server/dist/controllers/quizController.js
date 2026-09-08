"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitQuiz = exports.getQuizById = exports.getQuizzes = exports.generateQuiz = void 0;
const zod_1 = require("zod");
const mongoose_1 = __importDefault(require("mongoose"));
const Quiz_1 = __importDefault(require("../models/Quiz"));
const QuizAttempt_1 = __importDefault(require("../models/QuizAttempt"));
const StudySession_1 = __importDefault(require("../models/StudySession"));
const vectorStore_1 = __importDefault(require("../rag/vectorStore"));
const memoryService_1 = __importDefault(require("../services/memoryService"));
const openai_1 = require("../ai/openai");
const errorHandler_1 = require("../middleware/errorHandler");
const generateQuizSchema = zod_1.z.object({
    topic: zod_1.z.string().min(2, 'Topic or subject is required'),
    courseId: zod_1.z.string().optional(),
    documentId: zod_1.z.string().optional(),
    difficulty: zod_1.z.enum(['easy', 'medium', 'hard']).optional(),
    questionCount: zod_1.z.number().min(3).max(20).optional(),
});
const submitQuizSchema = zod_1.z.object({
    answers: zod_1.z.array(zod_1.z.object({
        questionIndex: zod_1.z.number(),
        selectedAnswer: zod_1.z.string(),
    })),
    timeSpentSeconds: zod_1.z.number().optional(),
});
const generateQuiz = async (req, res) => {
    const validated = generateQuizSchema.parse(req.body);
    const userId = req.user._id;
    const count = validated.questionCount || 5;
    const difficulty = validated.difficulty || 'medium';
    // 1. Gather context from Course / Documents via vector retrieval
    let contextSnippet = '';
    let sourceDocName = '';
    let sourceDocId;
    let sourcePage;
    if (validated.courseId || validated.documentId) {
        const searchResults = await vectorStore_1.default.similaritySearch(validated.topic, {
            userId,
            courseId: validated.courseId,
            documentId: validated.documentId,
            topK: 6,
        });
        if (searchResults.length > 0) {
            contextSnippet = searchResults.map((r) => r.chunk.content).join('\n\n');
            const topChunk = searchResults[0].chunk;
            sourceDocName = topChunk.documentName;
            sourceDocId = topChunk.documentId;
            sourcePage = topChunk.pageNumber;
        }
    }
    // 2. Fetch student memory context to tailor quiz to weak areas or learning preferences
    const memoryContext = await memoryService_1.default.getFormattedMemoryContext(userId);
    // 3. Prompt AI for structured quiz generation
    const systemPrompt = `You are an elite Academic Examiner and Quiz Master.
Create an engaging, balanced, and rigorous ${count}-question quiz testing student comprehension.

TOPIC: ${validated.topic}
DIFFICULTY: ${difficulty}
${contextSnippet ? `SOURCE EXCERPTS (Base questions on this material):\n${contextSnippet}\n` : ''}
${memoryContext}

REQUIREMENTS:
1. Include a mix of MCQ (Multiple Choice with 4 options), True/False (2 options: ["True", "False"]), and Short Answer questions.
2. For each question provide a comprehensive, clear explanation.
3. Mark the exact topic/concept tested.
4. Ensure the correct answer precisely matches one of the options for MCQ/TF.

RETURN STRICT JSON FORMAT:
{
  "title": "Clear Engaging Quiz Title",
  "description": "Brief description of topics covered",
  "difficulty": "${difficulty}",
  "topics": ["Topic A", "Topic B"],
  "questions": [
    {
      "questionIndex": 0,
      "type": "mcq" | "true_false" | "short_answer",
      "question": "Clear, precise question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Exact text of correct option",
      "explanation": "Why this answer is correct and others are incorrect.",
      "difficulty": "${difficulty}",
      "topic": "Specific Concept"
    }
  ]
}`;
    const completion = await (0, openai_1.generateChatCompletion)({
        messages: [{ role: 'system', content: systemPrompt }],
        response_format: { type: 'json_object' },
        temperature: 0.2,
    });
    let parsedQuiz = {};
    try {
        parsedQuiz = JSON.parse(completion.choices[0]?.message?.content || '{}');
    }
    catch (err) {
        throw new errorHandler_1.AppError('Failed to parse AI generated quiz format.', 500);
    }
    const rawQuestions = Array.isArray(parsedQuiz.questions) ? parsedQuiz.questions : [];
    if (rawQuestions.length === 0) {
        throw new errorHandler_1.AppError('AI could not produce questions for this topic.', 500);
    }
    const questions = rawQuestions.map((q, idx) => ({
        questionIndex: idx,
        type: ['mcq', 'true_false', 'short_answer'].includes(q.type) ? q.type : 'mcq',
        question: q.question,
        options: Array.isArray(q.options) ? q.options : [],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || 'Review the topic materials for further details.',
        difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : difficulty,
        topic: q.topic || validated.topic,
        sourceReference: sourceDocId
            ? {
                documentId: sourceDocId,
                documentName: sourceDocName,
                pageNumber: sourcePage || 1,
                excerpt: contextSnippet.slice(0, 150) + '...',
            }
            : undefined,
    }));
    const quiz = await Quiz_1.default.create({
        userId,
        courseId: validated.courseId && mongoose_1.default.Types.ObjectId.isValid(validated.courseId)
            ? new mongoose_1.default.Types.ObjectId(validated.courseId)
            : undefined,
        documentId: validated.documentId && mongoose_1.default.Types.ObjectId.isValid(validated.documentId)
            ? new mongoose_1.default.Types.ObjectId(validated.documentId)
            : undefined,
        title: parsedQuiz.title || `Quiz: ${validated.topic}`,
        description: parsedQuiz.description || '',
        difficulty,
        topics: Array.isArray(parsedQuiz.topics) ? parsedQuiz.topics : [validated.topic],
        questions,
        totalQuestions: questions.length,
    });
    res.status(201).json({
        success: true,
        message: 'Quiz generated successfully',
        quiz,
    });
};
exports.generateQuiz = generateQuiz;
const getQuizzes = async (req, res) => {
    const userId = req.user._id;
    const { courseId } = req.query;
    const filter = { userId };
    if (courseId && mongoose_1.default.Types.ObjectId.isValid(courseId)) {
        filter.courseId = new mongoose_1.default.Types.ObjectId(courseId);
    }
    const quizzes = await Quiz_1.default.find(filter)
        .populate('courseId', 'title color icon')
        .sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        quizzes,
    });
};
exports.getQuizzes = getQuizzes;
const getQuizById = async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new errorHandler_1.AppError('Invalid quiz ID', 400);
    }
    const quiz = await Quiz_1.default.findOne({ _id: id, userId }).populate('courseId', 'title color icon');
    if (!quiz) {
        throw new errorHandler_1.AppError('Quiz not found', 404);
    }
    const attempts = await QuizAttempt_1.default.find({ quizId: quiz._id, userId }).sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        quiz,
        attempts,
    });
};
exports.getQuizById = getQuizById;
const submitQuiz = async (req, res) => {
    const { id } = req.params;
    const validated = submitQuizSchema.parse(req.body);
    const userId = req.user._id;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new errorHandler_1.AppError('Invalid quiz ID', 400);
    }
    const quiz = await Quiz_1.default.findOne({ _id: id, userId });
    if (!quiz) {
        throw new errorHandler_1.AppError('Quiz not found', 404);
    }
    let correctCount = 0;
    const weakTopicsSet = new Set();
    const strongTopicsSet = new Set();
    const answersEvaluation = quiz.questions.map((q) => {
        const submission = validated.answers.find((a) => a.questionIndex === q.questionIndex);
        const selected = submission?.selectedAnswer ? submission.selectedAnswer.trim() : '';
        let isCorrect = false;
        if (q.type === 'mcq' || q.type === 'true_false') {
            isCorrect = selected.toLowerCase() === q.correctAnswer.trim().toLowerCase();
        }
        else {
            // Short answer: check for inclusion or key phrase match
            const correctLower = q.correctAnswer.trim().toLowerCase();
            const selectedLower = selected.toLowerCase();
            isCorrect =
                selectedLower.length > 0 &&
                    (selectedLower === correctLower ||
                        correctLower.includes(selectedLower) ||
                        selectedLower.includes(correctLower));
        }
        if (isCorrect) {
            correctCount++;
            if (q.topic)
                strongTopicsSet.add(q.topic);
        }
        else {
            if (q.topic)
                weakTopicsSet.add(q.topic);
        }
        return {
            questionIndex: q.questionIndex,
            questionText: q.question,
            selectedAnswer: selected || 'No answer provided',
            correctAnswer: q.correctAnswer,
            isCorrect,
            explanation: q.explanation,
            topic: q.topic || 'General',
        };
    });
    const percentage = Math.round((correctCount / quiz.totalQuestions) * 100);
    const weakTopics = Array.from(weakTopicsSet);
    const strongTopics = Array.from(strongTopicsSet);
    const attempt = await QuizAttempt_1.default.create({
        quizId: quiz._id,
        userId,
        courseId: quiz.courseId,
        answers: answersEvaluation,
        score: correctCount,
        totalQuestions: quiz.totalQuestions,
        percentage,
        weakTopics,
        strongTopics,
        timeSpentSeconds: validated.timeSpentSeconds || 60,
        completedAt: new Date(),
    });
    // Record Study Session for streak & analytics
    await StudySession_1.default.create({
        userId,
        courseId: quiz.courseId,
        sessionType: 'quiz',
        durationMinutes: Math.max(5, Math.ceil((validated.timeSpentSeconds || 60) / 60)),
        completedTasksCount: 0,
        activityDate: new Date(),
    });
    // Save weak topics to Memory if any
    if (weakTopics.length > 0 && percentage < 70) {
        memoryService_1.default.saveMemory({
            userId,
            type: 'weak_topic',
            content: `Needs revision on: ${weakTopics.slice(0, 3).join(', ')} (Scored ${percentage}% on ${quiz.title})`,
            importance: 7,
            source: 'quiz',
            courseId: quiz.courseId,
        }).catch(() => { });
    }
    res.status(200).json({
        success: true,
        message: 'Quiz submitted and evaluated successfully',
        attempt,
        summary: {
            score: correctCount,
            totalQuestions: quiz.totalQuestions,
            percentage,
            weakTopics,
            strongTopics,
        },
    });
};
exports.submitQuiz = submitQuiz;
//# sourceMappingURL=quizController.js.map