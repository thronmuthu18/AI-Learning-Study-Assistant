import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  Flame,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Clock,
  ArrowRight,
  Plus,
  AlertTriangle,
  Award,
  FileText,
  MessageSquare,
  Circle,
  Compass,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ProgressDashboardData } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import { Skeleton } from '../components/common/Skeleton';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<ProgressDashboardData>({
    queryKey: ['progressDashboard'],
    queryFn: async () => {
      const res = await api.get('/progress');
      return res.data.data;
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ planId, taskId, status }: { planId: string; taskId: string; status: string }) => {
      const res = await api.patch(`/learning-plans/${planId}/tasks/${taskId}`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progressDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['learningPlans'] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const activePlan = data?.activePlan;
  const upcomingTasks = data?.upcomingTasks || [];
  const recommendations = data?.recommendations || [];
  const weakTopics = data?.weakTopics || [];
  const strongTopics = data?.strongTopics || [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Hero Banner */}
      <div className="relative rounded-3xl p-8 overflow-hidden bg-gradient-to-r from-violet-950/80 via-slate-900 to-slate-900 border border-violet-500/30 shadow-2xl shadow-violet-950/30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-semibold text-xs border border-violet-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                AI Learning Companion
              </span>
              <span className="text-xs text-slate-400 font-medium capitalize">
                • {user?.currentLevel || 'Intermediate'} Level
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-300">{user?.name}</span>!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl leading-relaxed">
              {user?.learningGoals?.[0]
                ? `Goal: "${user.learningGoals[0]}"`
                : 'Ready to master your courses? Upload documents, take adaptive quizzes, or study with your AI tutor.'}
            </p>
          </div>

          {/* Streak & Quick Action */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 text-center flex flex-col items-center justify-center min-w-[110px] shadow-lg shadow-amber-500/5">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 mb-1">
                <Flame className="w-5 h-5 animate-pulse" />
              </div>
              <span className="text-xl font-black text-amber-300 leading-tight">
                {stats?.streakDays || 1}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Day Streak
              </span>
            </div>

            <Button onClick={() => navigate('/chat')} icon={<Sparkles className="w-4 h-4" />}>
              Start AI Chat
            </Button>
          </div>
        </div>
      </div>

      {/* Top Explainable Recommendation Bar */}
      {recommendations.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-violet-900/30 via-slate-900/80 to-slate-900 border border-violet-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-violet-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/20 text-violet-300 border border-violet-500/30 shrink-0">
              <Compass className="w-5 h-5 text-violet-400 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-violet-400 uppercase tracking-wider">
                  Recommended Next Action
                </span>
                <Badge variant={recommendations[0].priority === 'high' ? 'danger' : 'warning'} size="sm">
                  {recommendations[0].priority.toUpperCase()}
                </Badge>
              </div>
              <h3 className="text-sm font-semibold text-white mt-0.5">
                {recommendations[0].title}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {recommendations[0].reason}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => {
              if (recommendations[0].planId) navigate(`/learning-plans/${recommendations[0].planId}`);
              else if (recommendations[0].courseId) navigate(`/courses/${recommendations[0].courseId}`);
              else navigate('/quizzes');
            }}
            icon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Take Action
          </Button>
        </div>
      )}

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="glass" className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Courses</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{stats?.totalCourses || 0}</div>
          <p className="text-[11px] text-slate-400">{stats?.totalDocuments || 0} indexed documents</p>
        </Card>

        <Card variant="glass" className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Roadmap Progress</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{stats?.taskCompletionRate || 0}%</div>
          <p className="text-[11px] text-slate-400">{stats?.completedTasks || 0} of {stats?.totalTasks || 0} tasks completed</p>
        </Card>

        <Card variant="glass" className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quiz Accuracy</span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{stats?.averageQuizScore || 0}%</div>
          <p className="text-[11px] text-slate-400">{stats?.totalQuizzesTaken || 0} quizzes taken</p>
        </Card>

        <Card variant="glass" className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Study Time</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            {Math.round(((stats?.totalStudyMinutes || 0) / 60) * 10) / 10} <span className="text-sm font-normal text-slate-400">hrs</span>
          </div>
          <p className="text-[11px] text-slate-400">{stats?.totalStudyMinutes || 0} total minutes logged</p>
        </Card>
      </div>

      {/* Main Grid: Active Plan & Today's Tasks + Quiz Mastery & Weak Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Learning Plan Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card variant="glass" className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Active Learning Roadmap</h2>
                <p className="text-xs text-slate-400">Your personalized structured study milestones</p>
              </div>
              <Link to="/learning-plans" className="text-xs text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1">
                View all plans <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {activePlan ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="brand">{activePlan.subject}</Badge>
                      <Badge variant="neutral">{activePlan.currentKnowledgeLevel.toUpperCase()}</Badge>
                    </div>
                    <h3 className="text-sm font-semibold text-white">{activePlan.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-1">{activePlan.goal}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-lg font-bold text-white">{activePlan.progressPercentage}%</span>
                    <div className="w-24 mt-1">
                      <ProgressBar progress={activePlan.progressPercentage} size="sm" />
                    </div>
                  </div>
                </div>

                {/* Upcoming Tasks */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                    Upcoming Tasks for Today
                  </h4>
                  {upcomingTasks.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3 text-center">All tasks completed! Great job 🎉</p>
                  ) : (
                    <div className="space-y-2">
                      {upcomingTasks.slice(0, 4).map((task) => (
                        <div
                          key={task._id}
                          className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <button
                              onClick={() =>
                                toggleTaskMutation.mutate({
                                  planId: activePlan._id,
                                  taskId: task._id,
                                  status: 'completed',
                                })
                              }
                              className="text-slate-500 hover:text-emerald-400 shrink-0 transition-colors"
                            >
                              <Circle className="w-4 h-4" />
                            </button>
                            <span className="text-xs font-medium text-slate-200 truncate">
                              {task.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {task.estimatedMinutes}m
                            </span>
                            <Badge variant={task.priority === 'high' ? 'danger' : 'neutral'} size="sm">
                              {task.priority}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-xs text-slate-400 mb-3">No active learning plan yet.</p>
                <Button size="sm" onClick={() => navigate('/learning-plans')} icon={<Plus className="w-3.5 h-3.5" />}>
                  Generate Learning Plan
                </Button>
              </div>
            )}
          </Card>

          {/* Recent Materials & Conversations Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Recent Uploads */}
            <Card variant="glass" className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-violet-400" />
                  Recent Materials
                </h3>
                <Link to="/materials" className="text-[11px] text-violet-400 hover:underline">
                  All Materials
                </Link>
              </div>
              {data?.recentDocuments && data.recentDocuments.length > 0 ? (
                <div className="space-y-2">
                  {data.recentDocuments.map((doc) => (
                    <div key={doc._id} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-center justify-between">
                      <span className="text-slate-200 font-medium truncate max-w-[150px]">{doc.title}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800">
                        {doc.fileType}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-3 text-center">No documents uploaded yet.</p>
              )}
            </Card>

            {/* Recent Conversations */}
            <Card variant="glass" className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  Recent Study Chats
                </h3>
                <Link to="/chat" className="text-[11px] text-violet-400 hover:underline">
                  Open Chat
                </Link>
              </div>
              {data?.recentConversations && data.recentConversations.length > 0 ? (
                <div className="space-y-2">
                  {data.recentConversations.map((conv) => (
                    <Link
                      to={`/chat?id=${conv._id}`}
                      key={conv._id}
                      className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-center justify-between hover:border-slate-700 transition-colors block"
                    >
                      <span className="text-slate-200 font-medium truncate max-w-[150px]">{conv.title}</span>
                      <Badge variant="neutral" size="sm">
                        {conv.mode.replace('_', ' ')}
                      </Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-3 text-center">No recent chats.</p>
              )}
            </Card>
          </div>
        </div>

        {/* Right Column: Weak & Strong Topics + Study Activity Timeline */}
        <div className="space-y-6">
          {/* Weak & Strong Topics Card */}
          <Card variant="glass" className="p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Topic Mastery Breakdown</h2>
              <p className="text-xs text-slate-400">Calculated from your actual quiz answers</p>
            </div>

            {/* Weak Areas */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 mb-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                Focus Areas ({weakTopics.length})
              </div>
              {weakTopics.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No weak topics identified yet.</p>
              ) : (
                <div className="space-y-2">
                  {weakTopics.map((wt, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between">
                      <span className="text-amber-200 font-medium truncate max-w-[160px]">{wt.topic}</span>
                      <span className="text-[11px] text-amber-400 font-semibold">{wt.accuracy}% acc</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Strong Areas */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mastered Topics ({strongTopics.length})
              </div>
              {strongTopics.length === 0 ? (
                <p className="text-xs text-slate-500 italic">Complete more quizzes to build topic mastery.</p>
              ) : (
                <div className="space-y-2">
                  {strongTopics.map((st, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between">
                      <span className="text-emerald-200 font-medium truncate max-w-[160px]">{st.topic}</span>
                      <span className="text-[11px] text-emerald-400 font-semibold">{st.accuracy}% acc</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* 7-Day Activity Chart */}
          <Card variant="glass" className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">7-Day Study Activity</h3>
                <p className="text-xs text-slate-400">Daily study minutes logged</p>
              </div>
              <TrendingUp className="w-4 h-4 text-violet-400" />
            </div>

            <div className="grid grid-cols-7 gap-2 pt-2 items-end h-32">
              {data?.activityChart?.map((item, idx) => {
                const heightPercent = Math.min(100, Math.max(15, (item.minutes / 90) * 100));
                const isToday = idx === 6;

                return (
                  <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end">
                    <div className="text-[9px] text-slate-400 font-mono">{item.minutes}m</div>
                    <div
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        isToday
                          ? 'bg-gradient-to-t from-violet-600 to-indigo-500 shadow-md shadow-violet-500/30'
                          : item.minutes > 0
                          ? 'bg-violet-600/50'
                          : 'bg-slate-800'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-[10px] text-slate-400 font-medium">{item.day}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
