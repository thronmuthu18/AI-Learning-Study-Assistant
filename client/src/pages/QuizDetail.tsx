import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import api from '../services/api';
import { Quiz, QuizAttempt } from '../types';
import { QuizPlayer } from '../components/quiz/QuizPlayer';
import { Button } from '../components/common/Button';
import { Skeleton } from '../components/common/Skeleton';

export const QuizDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{
    quiz: Quiz;
    attempts: QuizAttempt[];
  }>({
    queryKey: ['quiz', id],
    queryFn: async () => {
      const res = await api.get(`/quizzes/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <Skeleton className="h-14 rounded-2xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  if (!data?.quiz) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400">Quiz not found.</p>
        <Button className="mt-4" onClick={() => navigate('/quizzes')}>
          Back to Quizzes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        <button
          onClick={() => navigate('/quizzes')}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Quizzes
        </button>
      </div>

      <QuizPlayer
        quiz={data.quiz}
        onFinish={() => {
          queryClient.invalidateQueries({ queryKey: ['quiz', id] });
          queryClient.invalidateQueries({ queryKey: ['progressDashboard'] });
        }}
        onBack={() => navigate('/quizzes')}
      />
    </div>
  );
};

export default QuizDetail;
