import mongoose, { Document, Schema } from 'mongoose';

export type MemoryType =
  | 'learning_style'
  | 'preference'
  | 'weak_topic'
  | 'strong_topic'
  | 'goal'
  | 'performance_pattern'
  | 'study_habit';

export type MemorySource = 'chat' | 'quiz' | 'learning_plan' | 'user_profile' | 'manual';

export interface IMemory extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: MemoryType;
  content: string;
  importance: number; // 1 to 10
  source: MemorySource;
  courseId?: mongoose.Types.ObjectId;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const MemorySchema = new Schema<IMemory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'learning_style',
        'preference',
        'weak_topic',
        'strong_topic',
        'goal',
        'performance_pattern',
        'study_habit',
      ],
      required: true,
      index: true,
    },
    content: { type: String, required: true, trim: true, maxlength: 1000 },
    importance: { type: Number, min: 1, max: 10, default: 5 },
    source: {
      type: String,
      enum: ['chat', 'quiz', 'learning_plan', 'user_profile', 'manual'],
      default: 'chat',
    },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

MemorySchema.index({ userId: 1, type: 1 });
MemorySchema.index({ userId: 1, importance: -1 });

export const Memory = mongoose.model<IMemory>('Memory', MemorySchema);
export default Memory;
