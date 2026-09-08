import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings as SettingsIcon,
  Brain,
  User,
  Trash2,
  Plus,
  Save,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { MemoryItem, LearningStyle, UserLevel, ExplanationDepth } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Skeleton } from '../components/common/Skeleton';

export const Settings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [currentLevel, setCurrentLevel] = useState<UserLevel>(user?.currentLevel || 'intermediate');
  const [preferredLearningStyle, setPreferredLearningStyle] = useState<LearningStyle>(
    user?.preferences?.preferredLearningStyle || 'reading_writing'
  );
  const [explanationDepth, setExplanationDepth] = useState<ExplanationDepth>(
    user?.preferences?.explanationDepth || 'detailed'
  );
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(user?.preferences?.dailyGoalMinutes || 45);
  const [learningGoalsStr, setLearningGoalsStr] = useState(user?.learningGoals?.join(', ') || '');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState(false);

  // Add Memory Modal State
  const [isAddMemoryModalOpen, setIsAddMemoryModalOpen] = useState(false);
  const [memoryType, setMemoryType] = useState('preference');
  const [memoryContent, setMemoryContent] = useState('');
  const [memoryImportance, setMemoryImportance] = useState(7);

  // Fetch AI Memories
  const { data: memories = [], isLoading: isLoadingMemories } = useQuery<MemoryItem[]>({
    queryKey: ['memories'],
    queryFn: async () => {
      const res = await api.get('/memory');
      return res.data.memories;
    },
  });

  const deleteMemoryMutation = useMutation({
    mutationFn: async (memId: string) => {
      await api.delete(`/memory/${memId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
    },
  });

  const addMemoryMutation = useMutation({
    mutationFn: async (newMem: any) => {
      await api.post('/memory', newMem);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      setIsAddMemoryModalOpen(false);
      setMemoryContent('');
    },
  });

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUser({
      name,
      currentLevel,
      learningGoals: learningGoalsStr
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean),
      preferences: {
        ...user?.preferences,
        preferredLearningStyle,
        explanationDepth,
        dailyGoalMinutes,
      },
    });
    setProfileSuccessMsg(true);
    setTimeout(() => setProfileSuccessMsg(false), 3000);
  };

  const handleAddMemorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memoryContent.trim()) return;
    addMemoryMutation.mutate({
      type: memoryType,
      content: memoryContent.trim(),
      importance: memoryImportance,
    });
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-300 text-xs font-semibold border border-violet-500/25">
            Personalization & Preferences
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Account & AI Memory Settings</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure your learning profile and inspect the persistent facts your AI tutor remembers
        </p>
      </div>

      {/* User Profile & Preferences Form */}
      <Card variant="glass" className="p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Learner Profile</h3>
              <p className="text-xs text-slate-400">Used by AI when generating plans and explanations</p>
            </div>
          </div>
          {profileSuccessMsg && (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Profile Updated!
            </span>
          )}
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 bg-slate-900/50 border border-slate-800 rounded-xl text-sm text-slate-500 cursor-not-allowed font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Current Level</label>
              <select
                value={currentLevel}
                onChange={(e) => setCurrentLevel(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Learning Style</label>
              <select
                value={preferredLearningStyle}
                onChange={(e) => setPreferredLearningStyle(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
              >
                <option value="reading_writing">Reading & Writing</option>
                <option value="visual">Visual & Diagrams</option>
                <option value="kinesthetic">Hands-on Practice</option>
                <option value="balanced">Balanced</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Explanation Depth</label>
              <select
                value={explanationDepth}
                onChange={(e) => setExplanationDepth(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
              >
                <option value="concise">Concise & Direct</option>
                <option value="detailed">Detailed & Step-by-Step</option>
                <option value="socratic">Socratic (Questions & Guided)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Learning Goals (Comma separated)</label>
            <input
              type="text"
              value={learningGoalsStr}
              onChange={(e) => setLearningGoalsStr(e.target.value)}
              placeholder="e.g. Pass Operating Systems exam, Master Distributed Architectures"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button size="sm" type="submit" icon={<Save className="w-4 h-4" />}>
              Save Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Persistent AI Memory Manager */}
      <Card variant="glass" className="p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Persistent AI Learner Memory</h3>
              <p className="text-xs text-slate-400">Insights automatically retained across sessions to personalize your experience</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAddMemoryModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Insight
          </Button>
        </div>

        {isLoadingMemories ? (
          <div className="space-y-3">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        ) : memories.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">
            No memories stored yet. As you chat and complete quizzes, the AI automatically remembers your focus areas!
          </p>
        ) : (
          <div className="space-y-3">
            {memories.map((mem) => (
              <div
                key={mem._id}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between gap-4 hover:border-slate-700 transition-colors"
              >
                <div className="space-y-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <Badge variant="brand" size="sm">
                      {mem.type.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Importance: {mem.importance}/10 • Source: {mem.source}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 font-medium leading-relaxed">
                    {mem.content}
                  </p>
                </div>

                <button
                  onClick={() => deleteMemoryMutation.mutate(mem._id)}
                  title="Delete memory"
                  className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* System Status & Architecture Info */}
      <Card variant="glass" className="p-6 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">System & AI RAG Engine Status</h3>
            <p className="text-xs text-slate-400">Connected production microservices</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">RAG Vector Retrieval</span>
            <Badge variant="success" size="sm">Active (1536-dim)</Badge>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">OpenAI Reasoning</span>
            <Badge variant="brand" size="sm">GPT-4o-mini</Badge>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Database</span>
            <Badge variant="info" size="sm">MongoDB</Badge>
          </div>
        </div>
      </Card>

      {/* Add Memory Modal */}
      <Modal
        isOpen={isAddMemoryModalOpen}
        onClose={() => setIsAddMemoryModalOpen(false)}
        title="Add Learner Insight"
        subtitle="Manually save a preference or focus topic for the AI tutor to remember"
      >
        <form onSubmit={handleAddMemorySubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Memory Type</label>
            <select
              value={memoryType}
              onChange={(e) => setMemoryType(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
            >
              <option value="preference">Study Preference</option>
              <option value="learning_style">Learning Style</option>
              <option value="weak_topic">Weak Concept / Focus Area</option>
              <option value="strong_topic">Strong Concept</option>
              <option value="goal">Target Goal</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Insight Content *</label>
            <textarea
              rows={3}
              required
              value={memoryContent}
              onChange={(e) => setMemoryContent(e.target.value)}
              placeholder="e.g. Wants practice questions emphasizing C/C++ memory pointers and lock synchronization."
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Importance Score (1 to 10): {memoryImportance}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={memoryImportance}
              onChange={(e) => setMemoryImportance(parseInt(e.target.value, 10))}
              className="w-full accent-violet-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsAddMemoryModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" isLoading={addMemoryMutation.isPending}>
              Save Insight
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Settings;
