import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUserPreferences {
  theme?: 'dark' | 'light' | 'system';
  preferredLearningStyle?: 'visual' | 'auditory' | 'reading_writing' | 'kinesthetic' | 'balanced';
  dailyGoalMinutes?: number;
  explanationDepth?: 'concise' | 'detailed' | 'socratic';
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  preferences: IUserPreferences;
  learningGoals: string[];
  currentLevel: 'beginner' | 'intermediate' | 'advanced';
  subjects: string[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserPreferencesSchema = new Schema<IUserPreferences>(
  {
    theme: { type: String, enum: ['dark', 'light', 'system'], default: 'dark' },
    preferredLearningStyle: {
      type: String,
      enum: ['visual', 'auditory', 'reading_writing', 'kinesthetic', 'balanced'],
      default: 'balanced',
    },
    dailyGoalMinutes: { type: Number, default: 45 },
    explanationDepth: { type: String, enum: ['concise', 'detailed', 'socratic'], default: 'detailed' },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address format'],
    },
    passwordHash: { type: String, required: true, select: false },
    preferences: { type: UserPreferencesSchema, default: () => ({}) },
    learningGoals: { type: [String], default: [] },
    currentLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
    subjects: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Method to verify password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User = mongoose.model<IUser>('User', UserSchema);
export default User;
