import mongoose, { Document, Schema } from 'mongoose';

export interface ICourse extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  code?: string;
  description: string;
  category: string;
  tags: string[];
  color: string;
  icon?: string;
  stats: {
    totalDocuments: number;
    totalChunks: number;
    completedTopics: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    code: { type: String, trim: true, uppercase: true, maxlength: 20 },
    description: { type: String, default: '', trim: true, maxlength: 2000 },
    category: { type: String, default: 'General', trim: true },
    tags: { type: [String], default: [] },
    color: { type: String, default: '#6366f1' },
    icon: { type: String, default: 'BookOpen' },
    stats: {
      totalDocuments: { type: Number, default: 0 },
      totalChunks: { type: Number, default: 0 },
      completedTopics: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Compound index for user query performance
CourseSchema.index({ userId: 1, createdAt: -1 });

export const Course = mongoose.model<ICourse>('Course', CourseSchema);
export default Course;
