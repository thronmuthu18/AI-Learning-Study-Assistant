import mongoose, { Document, Schema } from 'mongoose';

export type TaskType = 'topic' | 'subtopic' | 'reading' | 'practice' | 'revision' | 'quiz_checkpoint';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface ILearningTask extends Document {
  _id: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  courseId?: mongoose.Types.ObjectId;
  weekNumber: number;
  dayNumber?: number;
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  estimatedMinutes: number;
  status: TaskStatus;
  completedAt?: Date;
  orderIndex: number;
  sourceTopic?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LearningTaskSchema = new Schema<ILearningTask>(
  {
    planId: { type: Schema.Types.ObjectId, ref: 'LearningPlan', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
    weekNumber: { type: Number, required: true },
    dayNumber: { type: Number },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    type: {
      type: String,
      enum: ['topic', 'subtopic', 'reading', 'practice', 'revision', 'quiz_checkpoint'],
      default: 'topic',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    estimatedMinutes: { type: Number, default: 45 },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'completed'],
      default: 'todo',
      index: true,
    },
    completedAt: { type: Date },
    orderIndex: { type: Number, default: 0 },
    sourceTopic: { type: String },
  },
  { timestamps: true }
);

LearningTaskSchema.index({ planId: 1, weekNumber: 1, orderIndex: 1 });
LearningTaskSchema.index({ userId: 1, status: 1 });

export const LearningTask = mongoose.model<ILearningTask>('LearningTask', LearningTaskSchema);
export default LearningTask;
