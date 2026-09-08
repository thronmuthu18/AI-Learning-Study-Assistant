import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  HelpCircle,
  Sparkles,
  Plus,
  BookOpen,
  ArrowRight,
  Award,
  Clock,
  Layers,
} from 'lucide-react';
import api from '../services/api';
import { Quiz, Course } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { Skeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';

export const Quizzes: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  // Form State
  const [topic, setTopic] = useState('');
  const [courseId, setCourseId] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState(5);

  const { data: quizzes = [], isLoading } = useQuery<Quiz[]>({
    queryKey: ['quizzes'],
    queryFn: async () => {
      const res = await api.get('/quizzes');
      return res.data.quizzes;
    },
  });

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: async () => {
      const res = await api.get('/courses');
      return res.data.courses;
    },
  });

  const generateQuizMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/quizzes/generate', payload);
      return res.data.quiz;
    },
    onSuccess: (newQuiz) => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      setIsGenerateModalOpen(false);
      navigate(`/quizzes/${newQuiz._id}`);
    },
  });

  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    generateQuizMutation.mutate({
      topic: topic.trim(),
      courseId: courseId || undefined,
      difficulty,
      questionCount,
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-300 text-xs font-semibold border border-violet-500/25">
              Assessment Engine
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Interactive Practice Quizzes</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Test conceptual retention with AI quizzes generated directly from course notes
          </p>
        </div>
        <Button onClick={() => setIsGenerateModalOpen(true)} icon={<Sparkles className="w-4 h-4" />}>
          Generate Quiz
        </Button>
      </div>

      {/* Quizzes Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-56 rounded-3xl" />
          <Skeleton className="h-56 rounded-3xl" />
          <Skeleton className="h-56 rounded-3xl" />
        </div>
      ) : quizzes.length === 0 ? (
        <EmptyState
          icon={<HelpCircle className="w-10 h-10" />}
          title="No practice quizzes found"
          description="Generate your first quiz from any topic or uploaded course notes to test your understanding."
          actionText="Generate Practice Quiz"
          onAction={() => setIsGenerateModalOpen(true)}
          actionIcon={<Sparkles className="w-4 h-4" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => {
            const courseObj = typeof quiz.courseId === 'object' ? (quiz.courseId as Course) : null;

            return (
              <Card
                key={quiz._id}
                variant="glass"
                hoverEffect
                onClick={() => navigate(`/quizzes/${quiz._id}`)}
                className="p-6 flex flex-col justify-between group space-y-6"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant={
                        quiz.difficulty === 'hard'
                          ? 'danger'
                          : quiz.difficulty === 'easy'
                          ? 'success'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {quiz.difficulty.toUpperCase()}
                    </Badge>
                    <span className="text-xs font-mono text-slate-400">
                      {quiz.totalQuestions} Questions
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-violet-300 transition-colors">
                      {quiz.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {quiz.description || 'Comprehensive test of concepts and problem solving.'}
                    </p>
                  </div>

                  {courseObj && (
                    <div className="flex items-center gap-1.5 text-[11px] text-violet-300 pt-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{courseObj.title}</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-violet-400 font-semibold">
                  <span>Start Practice Session</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Generator Modal */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Generate AI Practice Quiz"
        subtitle="Questions are created from your uploaded course materials or topics"
        maxWidth="lg"
      >
        <form onSubmit={handleGenerateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Topic / Concept *</label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Process Synchronization & Mutexes"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Link to Course (Optional)</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
            >
              <option value="">No Course Link (General Topic)</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Difficulty Level</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
              >
                <option value="easy">Easy (Fundamentals)</option>
                <option value="medium">Medium (Standard Exam)</option>
                <option value="hard">Hard (Advanced Edge Cases)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Questions Count</label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500 font-mono"
              >
                <option value={3}>3 Questions (Quick Check)</option>
                <option value={5}>5 Questions (Standard)</option>
                <option value={10}>10 Questions (Deep Review)</option>
                <option value={15}>15 Questions (Full Mock)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsGenerateModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" isLoading={generateQuizMutation.isPending} icon={<Sparkles className="w-3.5 h-3.5" />}>
              Create Quiz
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Quizzes;
