import mongoose, { Document, Schema } from 'mongoose';

export type SessionType = 'reading' | 'chat' | 'quiz' | 'plan_task' | 'general';

export interface IStudySession extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  courseId?: mongoose.Types.ObjectId;
  sessionType: SessionType;
  durationMinutes: number;
  completedTasksCount: number;
  activityDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudySessionSchema = new Schema<IStudySession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', index: true },
    sessionType: {
      type: String,
      enum: ['reading', 'chat', 'quiz', 'plan_task', 'general'],
      default: 'general',
      required: true,
    },
    durationMinutes: { type: Number, default: 15 },
    completedTasksCount: { type: Number, default: 0 },
    activityDate: { type: Date, default: Date.now, index: true },
    notes: { type: String },
  },
  { timestamps: true }
);

StudySessionSchema.index({ userId: 1, activityDate: -1 });

export const StudySession = mongoose.model<IStudySession>('StudySession', StudySessionSchema);
export default StudySession;
