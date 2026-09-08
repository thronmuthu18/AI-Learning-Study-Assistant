import { Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import Quiz, { IQuizQuestion, QuestionType, QuizDifficulty } from '../models/Quiz';
import QuizAttempt from '../models/QuizAttempt';
import StudySession from '../models/StudySession';
import DocumentChunk from '../models/DocumentChunk';
import VectorStore from '../rag/vectorStore';
import MemoryService from '../services/memoryService';
import { generateChatCompletion } from '../ai/openai';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const generateQuizSchema = z.object({
  topic: z.string().min(2, 'Topic or subject is required'),
  courseId: z.string().optional(),
  documentId: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  questionCount: z.number().min(3).max(20).optional(),
});

const submitQuizSchema = z.object({
  answers: z.array(
    z.object({
      questionIndex: z.number(),
      selectedAnswer: z.string(),
    })
  ),
  timeSpentSeconds: z.number().optional(),
});

export const generateQuiz = async (req: AuthRequest, res: Response): Promise<void> => {
  const validated = generateQuizSchema.parse(req.body);
  const userId = req.user!._id;
  const count = validated.questionCount || 5;
  const difficulty: QuizDifficulty = validated.difficulty || 'medium';

  // 1. Gather context from Course / Documents via vector retrieval
  let contextSnippet = '';
  let sourceDocName = '';
  let sourceDocId: mongoose.Types.ObjectId | undefined;
  let sourcePage: number | undefined;

  if (validated.courseId || validated.documentId) {
    const searchResults = await VectorStore.similaritySearch(validated.topic, {
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
  const memoryContext = await MemoryService.getFormattedMemoryContext(userId);

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

  const completion = await generateChatCompletion({
    messages: [{ role: 'system', content: systemPrompt }],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  });

  let parsedQuiz: any = {};
  try {
    parsedQuiz = JSON.parse(completion.choices[0]?.message?.content || '{}');
  } catch (err) {
    throw new AppError('Failed to parse AI generated quiz format.', 500);
  }

  const rawQuestions: any[] = Array.isArray(parsedQuiz.questions) ? parsedQuiz.questions : [];
  if (rawQuestions.length === 0) {
    throw new AppError('AI could not produce questions for this topic.', 500);
  }

  const questions: IQuizQuestion[] = rawQuestions.map((q, idx) => ({
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

  const quiz = await Quiz.create({
    userId,
    courseId: validated.courseId && mongoose.Types.ObjectId.isValid(validated.courseId)
      ? new mongoose.Types.ObjectId(validated.courseId)
      : undefined,
    documentId: validated.documentId && mongoose.Types.ObjectId.isValid(validated.documentId)
      ? new mongoose.Types.ObjectId(validated.documentId)
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

export const getQuizzes = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!._id;
  const { courseId } = req.query;

  const filter: any = { userId };
  if (courseId && mongoose.Types.ObjectId.isValid(courseId as string)) {
    filter.courseId = new mongoose.Types.ObjectId(courseId as string);
  }

  const quizzes = await Quiz.find(filter)
    .populate('courseId', 'title color icon')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    quizzes,
  });
};

export const getQuizById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid quiz ID', 400);
  }

  const quiz = await Quiz.findOne({ _id: id, userId }).populate('courseId', 'title color icon');
  if (!quiz) {
    throw new AppError('Quiz not found', 404);
  }

  const attempts = await QuizAttempt.find({ quizId: quiz._id, userId }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    quiz,
    attempts,
  });
};

export const submitQuiz = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const validated = submitQuizSchema.parse(req.body);
  const userId = req.user!._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid quiz ID', 400);
  }

  const quiz = await Quiz.findOne({ _id: id, userId });
  if (!quiz) {
    throw new AppError('Quiz not found', 404);
  }

  let correctCount = 0;
  const weakTopicsSet = new Set<string>();
  const strongTopicsSet = new Set<string>();

  const answersEvaluation = quiz.questions.map((q) => {
    const submission = validated.answers.find((a) => a.questionIndex === q.questionIndex);
    const selected = submission?.selectedAnswer ? submission.selectedAnswer.trim() : '';

    let isCorrect = false;
    if (q.type === 'mcq' || q.type === 'true_false') {
      isCorrect = selected.toLowerCase() === q.correctAnswer.trim().toLowerCase();
    } else {
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
      if (q.topic) strongTopicsSet.add(q.topic);
    } else {
      if (q.topic) weakTopicsSet.add(q.topic);
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

  const attempt = await QuizAttempt.create({
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
  await StudySession.create({
    userId,
    courseId: quiz.courseId,
    sessionType: 'quiz',
    durationMinutes: Math.max(5, Math.ceil((validated.timeSpentSeconds || 60) / 60)),
    completedTasksCount: 0,
    activityDate: new Date(),
  });

  // Save weak topics to Memory if any
  if (weakTopics.length > 0 && percentage < 70) {
    MemoryService.saveMemory({
      userId,
      type: 'weak_topic',
      content: `Needs revision on: ${weakTopics.slice(0, 3).join(', ')} (Scored ${percentage}% on ${quiz.title})`,
      importance: 7,
      source: 'quiz',
      courseId: quiz.courseId,
    }).catch(() => {});
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
