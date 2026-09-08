import mongoose, { Document, Schema } from 'mongoose';

export type ChatMode = 'course_materials' | 'general_study' | 'exam_prep';

export interface IConversation extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  courseId?: mongoose.Types.ObjectId;
  title: string;
  mode: ChatMode;
  lastMessageAt: Date;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', index: true },
    title: { type: String, default: 'New Study Session', trim: true },
    mode: {
      type: String,
      enum: ['course_materials', 'general_study', 'exam_prep'],
      default: 'course_materials',
      required: true,
    },
    lastMessageAt: { type: Date, default: Date.now },
    messageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ConversationSchema.index({ userId: 1, updatedAt: -1 });

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);
export default Conversation;
