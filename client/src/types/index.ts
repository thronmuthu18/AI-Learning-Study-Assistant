export type UserLevel = 'beginner' | 'intermediate' | 'advanced';
export type LearningStyle = 'visual' | 'auditory' | 'reading_writing' | 'kinesthetic' | 'balanced';
export type ExplanationDepth = 'concise' | 'detailed' | 'socratic';

export interface UserPreferences {
  theme?: 'dark' | 'light' | 'system';
  preferredLearningStyle?: LearningStyle;
  dailyGoalMinutes?: number;
  explanationDepth?: ExplanationDepth;
}

export interface User {
  id: string;
  name: string;
  email: string;
  currentLevel: UserLevel;
  learningGoals: string[];
  subjects: string[];
  preferences: UserPreferences;
  createdAt: string;
}

export interface Course {
  _id: string;
  userId: string;
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
    totalPlans?: number;
    totalQuizzes?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export type DocumentStatus = 'uploading' | 'processing' | 'embedding' | 'ready' | 'failed';
export type FileType = 'pdf' | 'docx' | 'txt' | 'md';

export interface CourseDocument {
  _id: string;
  userId: string;
  courseId: string | Course;
  title: string;
  originalFileName: string;
  storedFileName: string;
  filePath: string;
  fileType: FileType;
  fileSize: number;
  mimeType: string;
  status: DocumentStatus;
  errorMessage?: string;
  pageCount: number;
  chunkCount: number;
  characterCount: number;
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentChunk {
  _id: string;
  chunkIndex: number;
  pageNumber: number;
  content: string;
  tokenCount: number;
}

export type ChatMode = 'course_materials' | 'general_study' | 'exam_prep';

export interface Citation {
  documentId: string;
  documentName: string;
  pageNumber?: number;
  snippet: string;
  chunkIndex?: number;
  score?: number;
}

export interface ToolInvocation {
  toolName: string;
  args: Record<string, any>;
  resultSummary?: string;
}

export interface ChatMessage {
  _id: string;
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations: Citation[];
  toolsUsed: ToolInvocation[];
  createdAt: string;
}

export interface Conversation {
  _id: string;
  userId: string;
  courseId?: Course;
  title: string;
  mode: ChatMode;
  lastMessageAt: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlanModule {
  weekNumber: number;
  title: string;
  description?: string;
  topics: string[];
  subtopics: string[];
  estimatedHours: number;
}

export type TaskType = 'topic' | 'subtopic' | 'reading' | 'practice' | 'revision' | 'quiz_checkpoint';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface LearningTask {
  _id: string;
  planId: string;
  userId: string;
  courseId?: string;
  weekNumber: number;
  dayNumber?: number;
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  estimatedMinutes: number;
  status: TaskStatus;
  completedAt?: string;
  orderIndex: number;
  sourceTopic?: string;
}

export interface LearningPlan {
  _id: string;
  userId: string;
  courseId?: Course;
  title: string;
  subject: string;
  goal: string;
  currentKnowledgeLevel: UserLevel;
  availableHoursPerDay: number;
  targetDate?: string;
  examDate?: string;
  preferredLearningStyle: string;
  summary: string;
  modules: PlanModule[];
  totalTasks: number;
  completedTasks: number;
  progressPercentage: number;
  status: 'active' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export type QuestionType = 'mcq' | 'true_false' | 'short_answer';
export type QuizDifficulty = 'easy' | 'medium' | 'hard';

export interface QuizQuestion {
  questionIndex: number;
  type: QuestionType;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: QuizDifficulty;
  topic?: string;
  sourceReference?: {
    documentId?: string;
    documentName?: string;
    pageNumber?: number;
    excerpt?: string;
  };
}

export interface Quiz {
  _id: string;
  userId: string;
  courseId?: Course;
  documentId?: string;
  title: string;
  description?: string;
  difficulty: QuizDifficulty;
  topics: string[];
  questions: QuizQuestion[];
  totalQuestions: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuizAnswerSubmission {
  questionIndex: number;
  questionText: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
  topic?: string;
}

export interface QuizAttempt {
  _id: string;
  quizId: Quiz | string;
  userId: string;
  courseId?: string;
  answers: QuizAnswerSubmission[];
  score: number;
  totalQuestions: number;
  percentage: number;
  weakTopics: string[];
  strongTopics: string[];
  timeSpentSeconds: number;
  completedAt: string;
  createdAt: string;
}

export interface Recommendation {
  id: string;
  title: string;
  topic: string;
  category: 'revision' | 'next_task' | 'quiz_prep' | 'streak_boost';
  reason: string;
  priority: 'high' | 'medium' | 'low';
  courseId?: string;
  planId?: string;
  taskId?: string;
  suggestedAction: string;
}

export interface ProgressDashboardData {
  stats: {
    totalCourses: number;
    totalDocuments: number;
    totalPlans: number;
    totalTasks: number;
    completedTasks: number;
    taskCompletionRate: number;
    totalQuizzesTaken: number;
    averageQuizScore: number;
    highestQuizScore: number;
    streakDays: number;
    totalStudyMinutes: number;
  };
  activePlan?: LearningPlan;
  upcomingTasks: LearningTask[];
  weakTopics: Array<{ topic: string; accuracy: number; questions: number }>;
  strongTopics: Array<{ topic: string; accuracy: number; questions: number }>;
  activityChart: Array<{ day: string; date: string; minutes: number; tasks: number }>;
  recommendations: Recommendation[];
  recentDocuments: CourseDocument[];
  recentConversations: Conversation[];
  recentQuizAttempts: QuizAttempt[];
}

export interface MemoryItem {
  _id: string;
  userId: string;
  type: 'learning_style' | 'preference' | 'weak_topic' | 'strong_topic' | 'goal' | 'performance_pattern' | 'study_habit';
  content: string;
  importance: number;
  source: string;
  createdAt: string;
  updatedAt: string;
}
