import mongoose, { Document, Schema } from 'mongoose';

export interface IQuizAnswerSubmission {
  questionIndex: number;
  questionText: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
  topic?: string;
}

export interface IQuizAttempt extends Document {
  _id: mongoose.Types.ObjectId;
  quizId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  courseId?: mongoose.Types.ObjectId;
  answers: IQuizAnswerSubmission[];
  score: number;
  totalQuestions: number;
  percentage: number;
  weakTopics: string[];
  strongTopics: string[];
  timeSpentSeconds: number;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QuizAnswerSubmissionSchema = new Schema<IQuizAnswerSubmission>(
  {
    questionIndex: { type: Number, required: true },
    questionText: { type: String, required: true },
    selectedAnswer: { type: String, required: true },
    correctAnswer: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
    explanation: { type: String, default: '' },
    topic: { type: String, default: 'General' },
  },
  { _id: false }
);

const QuizAttemptSchema = new Schema<IQuizAttempt>(
  {
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', index: true },
    answers: { type: [QuizAnswerSubmissionSchema], default: [] },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    percentage: { type: Number, required: true },
    weakTopics: { type: [String], default: [] },
    strongTopics: { type: [String], default: [] },
    timeSpentSeconds: { type: Number, default: 0 },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

QuizAttemptSchema.index({ userId: 1, createdAt: -1 });
QuizAttemptSchema.index({ userId: 1, courseId: 1 });

export const QuizAttempt = mongoose.model<IQuizAttempt>('QuizAttempt', QuizAttemptSchema);
export default QuizAttempt;
