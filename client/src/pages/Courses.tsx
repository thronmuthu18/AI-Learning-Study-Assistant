import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Files,
  HelpCircle,
  Map,
  ArrowRight,
  Sparkles,
  Trash2,
  FolderOpen,
  Cpu,
  Brain,
  Code,
  Database,
  Globe,
} from 'lucide-react';
import api from '../services/api';
import { Course } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { Skeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';

export const Courses: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('Computer Science');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');

  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: async () => {
      const res = await api.get('/courses');
      return res.data.courses;
    },
  });

  const createCourseMutation = useMutation({
    mutationFn: async (newCourse: any) => {
      const res = await api.post('/courses', newCourse);
      return res.data.course;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setIsCreateModalOpen(false);
      setTitle('');
      setCode('');
      setDescription('');
      setTags('');
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createCourseMutation.mutate({
      title: title.trim(),
      code: code.trim(),
      category: category.trim(),
      description: description.trim(),
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-300 text-xs font-semibold border border-violet-500/25">
              Knowledge Hub
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Your Courses</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Organize materials, upload lecture notes, and generate subject-specific study plans
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
          New Course
        </Button>
      </div>

      {/* Courses Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-10 h-10" />}
          title="No courses created yet"
          description="Create your first subject or course to start uploading syllabus documents and lecture notes."
          actionText="Create Course"
          onAction={() => setIsCreateModalOpen(true)}
          actionIcon={<Plus className="w-4 h-4" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card
              key={course._id}
              variant="glass"
              hoverEffect
              onClick={() => navigate(`/courses/${course._id}`)}
              className="p-6 flex flex-col justify-between group space-y-6 relative overflow-hidden"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="p-3 rounded-2xl bg-gradient-to-tr from-violet-600/20 to-indigo-600/20 text-violet-300 border border-violet-500/30 group-hover:scale-105 transition-transform">
                    <BookOpen className="w-6 h-6 text-violet-400" />
                  </div>
                  {course.code && (
                    <Badge variant="neutral" size="sm" className="font-mono">
                      {course.code}
                    </Badge>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {course.description || 'No course description provided.'}
                  </p>
                </div>

                {course.tags && course.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {course.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 text-[11px] border border-slate-700/60"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Course Footer with Stats */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="flex items-center gap-1">
                    <Files className="w-3.5 h-3.5 text-violet-400" />
                    {course.stats?.totalDocuments || 0} Docs
                  </span>
                  <span className="flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                    {course.stats?.totalQuizzes || 0} Quizzes
                  </span>
                </div>
                <span className="text-violet-400 flex items-center gap-1 font-semibold group-hover:translate-x-0.5 transition-transform">
                  Enter <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Course Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Course"
        subtitle="Organize your study materials and personalize AI assistance per course"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Course Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Operating Systems & Distributed Architecture"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Course Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. CS301"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500 uppercase font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Computer Science"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief course objectives and syllabus coverage..."
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Tags (Comma separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Processes, Threads, Semaphores, Deadlocks"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" isLoading={createCourseMutation.isPending}>
              Create Course
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Courses;
