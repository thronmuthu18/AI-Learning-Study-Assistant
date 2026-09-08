import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  HelpCircle,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { LearningPlan, LearningTask, TaskStatus } from '../../types';
import { Badge } from '../common/Badge';
import { ProgressBar } from '../common/ProgressBar';

interface TaskRoadmapProps {
  plan: LearningPlan;
  tasks: LearningTask[];
  onToggleTask?: (taskId: string, newStatus: TaskStatus) => void;
}

export const TaskRoadmap: React.FC<TaskRoadmapProps> = ({
  plan,
  tasks,
  onToggleTask,
}) => {
  const [expandedWeeks, setExpandedWeeks] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
  });

  const toggleWeek = (weekNum: number) => {
    setExpandedWeeks((prev) => ({
      ...prev,
      [weekNum]: !prev[weekNum],
    }));
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'reading':
        return <BookOpen className="w-4 h-4 text-sky-400" />;
      case 'quiz_checkpoint':
        return <HelpCircle className="w-4 h-4 text-violet-400" />;
      case 'revision':
        return <RotateCcw className="w-4 h-4 text-amber-400" />;
      case 'practice':
        return <Flame className="w-4 h-4 text-orange-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-400" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="danger" size="sm">High</Badge>;
      case 'low':
        return <Badge variant="neutral" size="sm">Low</Badge>;
      default:
        return <Badge variant="warning" size="sm">Medium</Badge>;
    }
  };

  // Group tasks by week
  const tasksByWeek: Record<number, LearningTask[]> = {};
  for (const t of tasks) {
    if (!tasksByWeek[t.weekNumber]) {
      tasksByWeek[t.weekNumber] = [];
    }
    tasksByWeek[t.weekNumber].push(t);
  }

  return (
    <div className="space-y-6">
      {/* Plan Header Card */}
      <div className="glass-panel p-6 rounded-3xl border border-violet-500/20 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="brand">{plan.subject}</Badge>
              <Badge variant="neutral">{plan.currentKnowledgeLevel.toUpperCase()}</Badge>
              {plan.status === 'completed' && <Badge variant="success">Completed</Badge>}
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">{plan.title}</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">{plan.goal}</p>
          </div>
          <div className="flex items-center gap-4 shrink-0 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-medium">Completed</span>
              <span className="text-xl font-bold text-white">
                {plan.completedTasks} / {plan.totalTasks}
              </span>
            </div>
            <div className="w-20">
              <ProgressBar progress={plan.progressPercentage} size="md" />
            </div>
          </div>
        </div>

        {plan.summary && (
          <p className="text-xs text-slate-300 bg-slate-900/50 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
            {plan.summary}
          </p>
        )}
      </div>

      {/* Week Modules & Tasks */}
      <div className="space-y-4">
        {plan.modules.map((module) => {
          const weekTasks = tasksByWeek[module.weekNumber] || [];
          const isExpanded = expandedWeeks[module.weekNumber] ?? true;
          const completedWeekTasks = weekTasks.filter((t) => t.status === 'completed').length;
          const weekPercent =
            weekTasks.length > 0 ? Math.round((completedWeekTasks / weekTasks.length) * 100) : 0;

          return (
            <div
              key={module.weekNumber}
              className="glass-panel rounded-2xl border border-slate-800 overflow-hidden transition-all duration-200"
            >
              {/* Module Header Toggle */}
              <button
                onClick={() => toggleWeek(module.weekNumber)}
                className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors border-b border-slate-800/60"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{module.title}</h3>
                    {module.description && (
                      <p className="text-xs text-slate-400 mt-0.5">{module.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-400 font-mono">
                    {completedWeekTasks}/{weekTasks.length} Done ({weekPercent}%)
                  </span>
                  <div className="w-16 hidden sm:block">
                    <ProgressBar progress={weekPercent} size="sm" color="brand" />
                  </div>
                </div>
              </button>

              {/* Tasks List */}
              {isExpanded && (
                <div className="p-4 space-y-2.5 bg-slate-950/40">
                  {weekTasks.length === 0 ? (
                    <p className="text-xs text-slate-500 py-2 text-center">No tasks listed for this module.</p>
                  ) : (
                    weekTasks.map((task) => {
                      const isCompleted = task.status === 'completed';

                      return (
                        <div
                          key={task._id}
                          className={`p-4 rounded-xl border transition-all duration-200 flex items-center justify-between gap-4 ${
                            isCompleted
                              ? 'bg-slate-900/30 border-slate-800/50 opacity-70'
                              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1 overflow-hidden">
                            <button
                              onClick={() =>
                                onToggleTask &&
                                onToggleTask(task._id, isCompleted ? 'todo' : 'completed')
                              }
                              className={`shrink-0 transition-transform active:scale-90 ${
                                isCompleted ? 'text-emerald-400' : 'text-slate-500 hover:text-violet-400'
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-5 h-5 fill-emerald-500/20" />
                              ) : (
                                <Circle className="w-5 h-5" />
                              )}
                            </button>

                            <div className="p-1.5 rounded-lg bg-slate-800 shrink-0">
                              {getTaskIcon(task.type)}
                            </div>

                            <div className="overflow-hidden">
                              <h4
                                className={`text-sm font-medium truncate ${
                                  isCompleted ? 'line-through text-slate-400' : 'text-white'
                                }`}
                              >
                                {task.title}
                              </h4>
                              {task.description && (
                                <p className="text-xs text-slate-400 truncate mt-0.5">
                                  {task.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {task.estimatedMinutes}m
                            </div>
                            {getPriorityBadge(task.priority)}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskRoadmap;
