import mongoose, { Document, Schema } from 'mongoose';

export interface IPlanModule {
  weekNumber: number;
  title: string;
  description?: string;
  topics: string[];
  subtopics: string[];
  estimatedHours: number;
}

export interface ILearningPlan extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  courseId?: mongoose.Types.ObjectId;
  title: string;
  subject: string;
  goal: string;
  currentKnowledgeLevel: 'beginner' | 'intermediate' | 'advanced';
  availableHoursPerDay: number;
  targetDate?: Date;
  examDate?: Date;
  preferredLearningStyle: string;
  summary: string;
  modules: IPlanModule[];
  totalTasks: number;
  completedTasks: number;
  progressPercentage: number;
  status: 'active' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

const PlanModuleSchema = new Schema<IPlanModule>(
  {
    weekNumber: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    topics: { type: [String], default: [] },
    subtopics: { type: [String], default: [] },
    estimatedHours: { type: Number, default: 5 },
  },
  { _id: false }
);

const LearningPlanSchema = new Schema<ILearningPlan>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', index: true },
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    goal: { type: String, required: true, trim: true },
    currentKnowledgeLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
    availableHoursPerDay: { type: Number, default: 2 },
    targetDate: { type: Date },
    examDate: { type: Date },
    preferredLearningStyle: { type: String, default: 'balanced' },
    summary: { type: String, default: '' },
    modules: { type: [PlanModuleSchema], default: [] },
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
    status: {
      type: String,
      enum: ['active', 'completed', 'archived'],
      default: 'active',
      index: true,
    },
  },
  { timestamps: true }
);

LearningPlanSchema.index({ userId: 1, status: 1, createdAt: -1 });

export const LearningPlan = mongoose.model<ILearningPlan>('LearningPlan', LearningPlanSchema);
export default LearningPlan;
