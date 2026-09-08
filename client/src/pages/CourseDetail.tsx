import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  Upload,
  Files,
  Trash2,
  Sparkles,
  Map,
  HelpCircle,
  MessageSquare,
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import api from '../services/api';
import { Course, CourseDocument, LearningPlan, Quiz } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Skeleton } from '../components/common/Skeleton';
import { FileUploadZone } from '../components/documents/FileUploadZone';

export const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'documents' | 'plans' | 'quizzes'>('documents');
  const [showUploadZone, setShowUploadZone] = useState(false);

  const { data, isLoading } = useQuery<{
    course: Course;
    documents: CourseDocument[];
    learningPlans: LearningPlan[];
    quizzes: Quiz[];
  }>({
    queryKey: ['course', id],
    queryFn: async () => {
      const res = await api.get(`/courses/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const deleteDocMutation = useMutation({
    mutationFn: async (docId: string) => {
      await api.delete(`/documents/${docId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', id] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/courses/${id}`);
    },
    onSuccess: () => {
      navigate('/courses');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 rounded-3xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  if (!data?.course) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400">Course not found.</p>
        <Button className="mt-4" onClick={() => navigate('/courses')}>
          Back to Courses
        </Button>
      </div>
    );
  }

  const { course, documents = [], learningPlans = [], quizzes = [] } = data;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/courses')}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Courses
        </button>

        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to delete this course and all its materials?')) {
              deleteCourseMutation.mutate();
            }
          }}
          className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition-colors p-2 rounded-xl hover:bg-rose-500/10"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete Course
        </button>
      </div>

      {/* Course Hero Banner */}
      <div className="glass-panel p-8 rounded-3xl border border-violet-500/20 shadow-2xl relative overflow-hidden space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-xs font-semibold border border-violet-500/30">
                {course.category}
              </span>
              {course.code && <Badge variant="neutral">{course.code}</Badge>}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{course.title}</h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">{course.description}</p>
          </div>

          {/* Quick AI Action Buttons */}
          <div className="flex flex-wrap gap-2.5 shrink-0">
            <Button
              onClick={() => navigate(`/chat?courseId=${course._id}&mode=course_materials`)}
              icon={<MessageSquare className="w-4 h-4" />}
            >
              Ask Course AI (RAG)
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowUploadZone((p) => !p)}
              icon={<Upload className="w-4 h-4" />}
            >
              {showUploadZone ? 'Hide Uploader' : 'Upload Material'}
            </Button>
          </div>
        </div>

        {/* Tags */}
        {course.tags && course.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/80">
            {course.tags.map((tag, idx) => (
              <span key={idx} className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-slate-300 text-xs border border-slate-800">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Upload Zone (Expandable) */}
      {showUploadZone && (
        <Card variant="glass" className="p-6 border border-violet-500/30 animate-scale-up">
          <FileUploadZone
            courseId={course._id}
            onUploadSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['course', id] });
              setShowUploadZone(false);
            }}
          />
        </Card>
      )}

      {/* Tabs Header */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'documents'
              ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Files className="w-3.5 h-3.5" />
          Course Materials ({documents.length})
        </button>

        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'plans'
              ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Map className="w-3.5 h-3.5" />
          Learning Plans ({learningPlans.length})
        </button>

        <button
          onClick={() => setActiveTab('quizzes')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'quizzes'
              ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Quizzes ({quizzes.length})
        </button>
      </div>

      {/* Tab 1: Documents */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          {documents.length === 0 ? (
            <Card variant="glass" className="text-center py-12">
              <FileText className="w-10 h-10 text-slate-500 mx-auto mb-3 animate-float" />
              <h3 className="text-sm font-semibold text-white">No documents uploaded yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                Upload your lecture slides, syllabus, or PDF notes to enable AI question answering.
              </p>
              <Button size="sm" onClick={() => setShowUploadZone(true)} icon={<Upload className="w-3.5 h-3.5" />}>
                Upload Document
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <Card key={doc._id} variant="glass" className="p-5 flex flex-col justify-between space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 overflow-hidden">
                      <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-sm font-semibold text-white truncate">{doc.title}</h4>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {doc.originalFileName} • {(doc.fileSize / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (window.confirm('Delete this document and all its vector embeddings?')) {
                          deleteDocMutation.mutate(doc._id);
                        }
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {doc.summary && (
                    <p className="text-xs text-slate-300 line-clamp-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                      {doc.summary}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                        {doc.chunkCount} Vector Chunks
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                        {doc.pageCount} Pages
                      </span>
                    </div>

                    <Badge
                      variant={doc.status === 'ready' ? 'success' : doc.status === 'failed' ? 'danger' : 'warning'}
                      size="sm"
                    >
                      {doc.status.toUpperCase()}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Learning Plans */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          {learningPlans.length === 0 ? (
            <Card variant="glass" className="text-center py-12">
              <Map className="w-10 h-10 text-slate-500 mx-auto mb-3 animate-float" />
              <h3 className="text-sm font-semibold text-white">No learning plans for this course</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                Generate an AI learning roadmap tailored specifically to this course.
              </p>
              <Button size="sm" onClick={() => navigate('/learning-plans')} icon={<Sparkles className="w-3.5 h-3.5" />}>
                Generate Plan
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {learningPlans.map((plan) => (
                <Card
                  key={plan._id}
                  variant="glass"
                  hoverEffect
                  onClick={() => navigate(`/learning-plans/${plan._id}`)}
                  className="p-5 flex flex-col justify-between space-y-4"
                >
                  <div>
                    <Badge variant="brand" size="sm" className="mb-2">
                      {plan.subject}
                    </Badge>
                    <h4 className="text-sm font-bold text-white">{plan.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{plan.goal}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      {plan.completedTasks}/{plan.totalTasks} Tasks Done
                    </span>
                    <span className="text-violet-400 font-semibold">{plan.progressPercentage}%</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Quizzes */}
      {activeTab === 'quizzes' && (
        <div className="space-y-4">
          {quizzes.length === 0 ? (
            <Card variant="glass" className="text-center py-12">
              <HelpCircle className="w-10 h-10 text-slate-500 mx-auto mb-3 animate-float" />
              <h3 className="text-sm font-semibold text-white">No quizzes generated yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                Create an AI quiz generated directly from this course's uploaded materials.
              </p>
              <Button size="sm" onClick={() => navigate('/quizzes')} icon={<Sparkles className="w-3.5 h-3.5" />}>
                Generate Quiz
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizzes.map((quiz) => (
                <Card
                  key={quiz._id}
                  variant="glass"
                  hoverEffect
                  onClick={() => navigate(`/quizzes/${quiz._id}`)}
                  className="p-5 flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="neutral" size="sm">
                        {quiz.difficulty.toUpperCase()}
                      </Badge>
                      <span className="text-xs font-mono text-slate-400">{quiz.totalQuestions} Questions</span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{quiz.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{quiz.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-violet-400 font-semibold">
                    <span>Take Practice Quiz</span>
                    <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CourseDetail;
