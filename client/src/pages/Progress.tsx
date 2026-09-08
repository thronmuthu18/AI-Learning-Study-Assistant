import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Flame,
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Calendar,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import api from '../services/api';
import { ProgressDashboardData } from '../types';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import { Skeleton } from '../components/common/Skeleton';

export const Progress: React.FC = () => {
  const { data, isLoading } = useQuery<ProgressDashboardData>({
    queryKey: ['progressDashboard'],
    queryFn: async () => {
      const res = await api.get('/progress');
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const weakTopics = data?.weakTopics || [];
  const strongTopics = data?.strongTopics || [];
  const recentAttempts = data?.recentQuizAttempts || [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-300 text-xs font-semibold border border-violet-500/25">
            Real Analytics
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Progress & Mastery Analytics</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Data-driven metrics calculated from your actual study sessions, task completions, and quiz attempts
        </p>
      </div>

      {/* Main Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="glass" className="p-6 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Study Streak
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-300">{stats?.streakDays || 1} Days</div>
          <p className="text-[11px] text-slate-400">Consecutive active study streak</p>
        </Card>

        <Card variant="glass" className="p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Study Time
            </span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {Math.round(((stats?.totalStudyMinutes || 0) / 60) * 10) / 10}{' '}
            <span className="text-base font-normal text-slate-400">Hours</span>
          </div>
          <p className="text-[11px] text-slate-400">{stats?.totalStudyMinutes || 0} minutes across all sessions</p>
        </Card>

        <Card variant="glass" className="p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Quiz Accuracy
            </span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{stats?.averageQuizScore || 0}%</div>
          <p className="text-[11px] text-slate-400">Average score over {stats?.totalQuizzesTaken || 0} attempts</p>
        </Card>

        <Card variant="glass" className="p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Tasks Completed
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {stats?.completedTasks || 0} <span className="text-base font-normal text-slate-400">/ {stats?.totalTasks || 0}</span>
          </div>
          <p className="text-[11px] text-slate-400">{stats?.taskCompletionRate || 0}% roadmap completion rate</p>
        </Card>
      </div>

      {/* 7-Day Activity Chart & Topic Mastery */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Timeline Chart */}
        <Card variant="glass" className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">7-Day Study Activity</h3>
              <p className="text-xs text-slate-400">Study duration per day</p>
            </div>
            <TrendingUp className="w-5 h-5 text-violet-400" />
          </div>

          <div className="grid grid-cols-7 gap-3 pt-4 items-end h-44">
            {data?.activityChart?.map((item, idx) => {
              const heightPercent = Math.min(100, Math.max(12, (item.minutes / 90) * 100));
              const isToday = idx === 6;

              return (
                <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end">
                  <div className="text-[10px] text-slate-400 font-mono font-semibold">{item.minutes}m</div>
                  <div
                    className={`w-full rounded-t-xl transition-all duration-300 ${
                      isToday
                        ? 'bg-gradient-to-t from-violet-600 to-indigo-500 shadow-lg shadow-violet-500/30'
                        : item.minutes > 0
                        ? 'bg-violet-600/50 hover:bg-violet-500/60'
                        : 'bg-slate-800'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-xs text-slate-400 font-medium">{item.day}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Topic Breakdown */}
        <Card variant="glass" className="p-6 space-y-5">
          <div>
            <h3 className="text-base font-bold text-white">Topic Mastery Matrix</h3>
            <p className="text-xs text-slate-400">Identified weak vs strong topics</p>
          </div>

          <div className="space-y-4">
            {/* Weak topics */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 mb-2.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Needs Practice & Revision ({weakTopics.length})
              </div>
              {weakTopics.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No weak topics identified.</p>
              ) : (
                <div className="space-y-2">
                  {weakTopics.map((wt, i) => (
                    <div key={i} className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
                      <span className="text-amber-200 font-medium truncate max-w-[200px]">{wt.topic}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 font-mono">({wt.questions} questions)</span>
                        <Badge variant="danger" size="sm">{wt.accuracy}% Accuracy</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Strong topics */}
            <div className="pt-3 border-t border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 mb-2.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Strong Concept Mastery ({strongTopics.length})
              </div>
              {strongTopics.length === 0 ? (
                <p className="text-xs text-slate-500 italic">Complete quizzes to establish strong topics.</p>
              ) : (
                <div className="space-y-2">
                  {strongTopics.map((st, i) => (
                    <div key={i} className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                      <span className="text-emerald-200 font-medium truncate max-w-[200px]">{st.topic}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 font-mono">({st.questions} questions)</span>
                        <Badge variant="success" size="sm">{st.accuracy}% Accuracy</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Quiz Attempts Log */}
      <Card variant="glass" className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Recent Quiz Attempts</h3>
            <p className="text-xs text-slate-400">History of submitted assessments</p>
          </div>
          <Link to="/quizzes" className="text-xs text-violet-400 hover:underline flex items-center gap-1">
            All Quizzes <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentAttempts.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">No quiz attempts logged yet.</p>
        ) : (
          <div className="divide-y divide-slate-800">
            {recentAttempts.map((attempt) => {
              const quizObj = typeof attempt.quizId === 'object' ? (attempt.quizId as any) : null;
              const isPassed = attempt.percentage >= 70;

              return (
                <div key={attempt._id} className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      {quizObj?.title || 'Practice Quiz'}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Completed on {new Date(attempt.completedAt || attempt.createdAt).toLocaleDateString()} • {attempt.timeSpentSeconds}s duration
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={isPassed ? 'success' : 'danger'}>
                      {attempt.score}/{attempt.totalQuestions} ({attempt.percentage}%)
                    </Badge>
                    {quizObj?._id && (
                      <Link
                        to={`/quizzes/${quizObj._id}`}
                        className="text-xs text-violet-400 hover:text-white font-medium"
                      >
                        Retake
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Progress;
