import mongoose, { Document, Schema } from 'mongoose';

export type QuestionType = 'mcq' | 'true_false' | 'short_answer';
export type QuizDifficulty = 'easy' | 'medium' | 'hard';

export interface IQuizQuestion {
  questionIndex: number;
  type: QuestionType;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: QuizDifficulty;
  topic?: string;
  sourceReference?: {
    documentId?: mongoose.Types.ObjectId;
    documentName?: string;
    pageNumber?: number;
    excerpt?: string;
  };
}

export interface IQuiz extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  courseId?: mongoose.Types.ObjectId;
  documentId?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  difficulty: QuizDifficulty;
  topics: string[];
  questions: IQuizQuestion[];
  totalQuestions: number;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSourceSchema = new Schema(
  {
    documentId: { type: Schema.Types.ObjectId, ref: 'Document' },
    documentName: { type: String },
    pageNumber: { type: Number },
    excerpt: { type: String },
  },
  { _id: false }
);

const QuizQuestionSchema = new Schema<IQuizQuestion>(
  {
    questionIndex: { type: Number, required: true },
    type: { type: String, enum: ['mcq', 'true_false', 'short_answer'], default: 'mcq' },
    question: { type: String, required: true },
    options: { type: [String], default: [] },
    correctAnswer: { type: String, required: true },
    explanation: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    topic: { type: String, default: 'General' },
    sourceReference: { type: QuestionSourceSchema },
  },
  { _id: false }
);

const QuizSchema = new Schema<IQuiz>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', index: true },
    documentId: { type: Schema.Types.ObjectId, ref: 'Document', index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    topics: { type: [String], default: [] },
    questions: { type: [QuizQuestionSchema], default: [] },
    totalQuestions: { type: Number, default: 0 },
  },
  { timestamps: true }
);

QuizSchema.index({ userId: 1, courseId: 1, createdAt: -1 });

export const Quiz = mongoose.model<IQuiz>('Quiz', QuizSchema);
export default Quiz;
