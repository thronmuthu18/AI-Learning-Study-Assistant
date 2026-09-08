import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Trash2, Map } from 'lucide-react';
import api from '../services/api';
import { LearningPlan, LearningTask, TaskStatus } from '../types';
import { TaskRoadmap } from '../components/learningPlan/TaskRoadmap';
import { Button } from '../components/common/Button';
import { Skeleton } from '../components/common/Skeleton';

export const LearningPlanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{
    plan: LearningPlan;
    tasks: LearningTask[];
  }>({
    queryKey: ['learningPlan', id],
    queryFn: async () => {
      const res = await api.get(`/learning-plans/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: TaskStatus }) => {
      const res = await api.patch(`/learning-plans/${id}/tasks/${taskId}`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learningPlan', id] });
      queryClient.invalidateQueries({ queryKey: ['learningPlans'] });
      queryClient.invalidateQueries({ queryKey: ['progressDashboard'] });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/learning-plans/${id}`);
    },
    onSuccess: () => {
      navigate('/learning-plans');
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

  if (!data?.plan) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400">Learning Plan not found.</p>
        <Button className="mt-4" onClick={() => navigate('/learning-plans')}>
          Back to Plans
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/learning-plans')}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Learning Plans
        </button>

        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to delete this learning plan?')) {
              deletePlanMutation.mutate();
            }
          }}
          className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition-colors p-2 rounded-xl hover:bg-rose-500/10"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete Plan
        </button>
      </div>

      {/* Interactive Task Roadmap */}
      <TaskRoadmap
        plan={data.plan}
        tasks={data.tasks}
        onToggleTask={(taskId, newStatus) =>
          toggleTaskMutation.mutate({ taskId, status: newStatus })
        }
      />
    </div>
  );
};

export default LearningPlanDetail;
