import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Map,
  Plus,
  Sparkles,
  CheckCircle2,
  Clock,
  Trash2,
  ArrowRight,
  BookOpen,
  Calendar,
  Target,
} from 'lucide-react';
import api from '../services/api';
import { LearningPlan, Course } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import { Skeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';

export const LearningPlans: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  // Form State
  const [subject, setSubject] = useState('');
  const [goal, setGoal] = useState('');
  const [courseId, setCourseId] = useState('');
  const [currentKnowledgeLevel, setCurrentKnowledgeLevel] = useState('intermediate');
  const [availableHoursPerDay, setAvailableHoursPerDay] = useState(2);
  const [targetDate, setTargetDate] = useState('');
  const [preferredLearningStyle, setPreferredLearningStyle] = useState('reading_writing');

  const { data: plans = [], isLoading } = useQuery<LearningPlan[]>({
    queryKey: ['learningPlans'],
    queryFn: async () => {
      const res = await api.get('/learning-plans');
      return res.data.plans;
    },
  });

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: async () => {
      const res = await api.get('/courses');
      return res.data.courses;
    },
  });

  const generatePlanMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/learning-plans', payload);
      return res.data.plan;
    },
    onSuccess: (newPlan) => {
      queryClient.invalidateQueries({ queryKey: ['learningPlans'] });
      setIsGenerateModalOpen(false);
      navigate(`/learning-plans/${newPlan._id}`);
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      await api.delete(`/learning-plans/${planId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learningPlans'] });
    },
  });

  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !goal.trim()) return;

    generatePlanMutation.mutate({
      subject: subject.trim(),
      goal: goal.trim(),
      courseId: courseId || undefined,
      currentKnowledgeLevel,
      availableHoursPerDay,
      targetDate: targetDate || undefined,
      preferredLearningStyle,
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-300 text-xs font-semibold border border-violet-500/25">
              Curriculum AI
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Personalized Learning Plans</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            AI-engineered roadmaps with weekly modules, practice tasks, and revision checkpoints
          </p>
        </div>
        <Button onClick={() => setIsGenerateModalOpen(true)} icon={<Sparkles className="w-4 h-4" />}>
          Generate Learning Plan
        </Button>
      </div>

      {/* Plans List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      ) : plans.length === 0 ? (
        <EmptyState
          icon={<Map className="w-10 h-10" />}
          title="No learning plans created yet"
          description="Generate a personalized study roadmap tailored to your target exam date and daily available hours."
          actionText="Generate Study Plan"
          onAction={() => setIsGenerateModalOpen(true)}
          actionIcon={<Sparkles className="w-4 h-4" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan._id}
              variant="glass"
              hoverEffect
              onClick={() => navigate(`/learning-plans/${plan._id}`)}
              className="p-6 flex flex-col justify-between group space-y-6"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="brand">{plan.subject}</Badge>
                  <Badge
                    variant={plan.status === 'completed' ? 'success' : 'neutral'}
                    size="sm"
                  >
                    {plan.status.toUpperCase()}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-violet-300 transition-colors">
                    {plan.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {plan.goal}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs text-slate-400 font-medium">
                    <span>Progress</span>
                    <span className="text-white font-bold">{plan.progressPercentage}%</span>
                  </div>
                  <ProgressBar progress={plan.progressPercentage} size="sm" />
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-[11px]">
                  {plan.completedTasks} / {plan.totalTasks} Tasks Done
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete plan "${plan.title}"?`)) {
                        deletePlanMutation.mutate(plan._id);
                      }
                    }}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <span className="text-violet-400 font-semibold flex items-center gap-1">
                    Open <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Generator Modal */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Generate AI Learning Plan"
        subtitle="Our AI will design an optimized step-by-step curriculum based on your profile"
        maxWidth="xl"
      >
        <form onSubmit={handleGenerateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Subject / Topic *</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Operating Systems & Concurrency"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Primary Learning Goal *</label>
            <input
              type="text"
              required
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Prepare for university final exam and build concurrency mastery"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Link to Course (Optional)</label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
              >
                <option value="">No Course Link (Independent)</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Knowledge Level</label>
              <select
                value={currentKnowledgeLevel}
                onChange={(e) => setCurrentKnowledgeLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
              >
                <option value="beginner">Beginner (Foundations)</option>
                <option value="intermediate">Intermediate (Standard Course)</option>
                <option value="advanced">Advanced (Deep Rigor)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Study Hours / Day</label>
              <input
                type="number"
                min="0.5"
                max="12"
                step="0.5"
                value={availableHoursPerDay}
                onChange={(e) => setAvailableHoursPerDay(parseFloat(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Target Completion Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsGenerateModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" isLoading={generatePlanMutation.isPending} icon={<Sparkles className="w-3.5 h-3.5" />}>
              Generate Roadmap
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LearningPlans;
