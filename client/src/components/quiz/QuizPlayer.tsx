import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import { Quiz, QuizAttempt, QuizQuestion } from '../../types';
import api from '../../services/api';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { ProgressBar } from '../common/ProgressBar';

interface QuizPlayerProps {
  quiz: Quiz;
  onFinish?: (attempt: QuizAttempt) => void;
  onBack?: () => void;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({
  quiz,
  onFinish,
  onBack,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);

  useEffect(() => {
    if (attempt) return;
    const interval = setInterval(() => {
      setTimeSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [attempt]);

  const currentQ: QuizQuestion | undefined = quiz.questions[currentIdx];
  const totalQuestions = quiz.questions.length;
  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round(((currentIdx + 1) / totalQuestions) * 100);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  const handleSelectOption = (option: string) => {
    if (attempt) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQ.questionIndex]: option,
    }));
  };

  const handleSubmitQuiz = async () => {
    setIsSubmitting(true);
    const submissions = quiz.questions.map((q) => ({
      questionIndex: q.questionIndex,
      selectedAnswer: answers[q.questionIndex] || '',
    }));

    try {
      const res = await api.post(`/quizzes/${quiz._id}/submit`, {
        answers: submissions,
        timeSpentSeconds: timeSeconds,
      });

      if (res.data.success) {
        setAttempt(res.data.attempt);
        if (res.data.attempt.percentage >= 80) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
        if (onFinish) onFinish(res.data.attempt);
      }
    } catch (err) {
      console.error('Quiz submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Results View
  if (attempt) {
    const isPassed = attempt.percentage >= 70;

    return (
      <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
        {/* Score Hero Card */}
        <div className="glass-panel p-8 rounded-3xl border border-violet-500/30 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="p-4 rounded-2xl bg-violet-500/15 text-violet-400 border border-violet-500/30 inline-flex mb-4">
            <Award className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Quiz Completed!</h2>
          <p className="text-sm text-slate-400 mb-6">{quiz.title}</p>

          <div className="flex justify-center items-baseline gap-2 mb-4">
            <span className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-300">
              {attempt.score}
            </span>
            <span className="text-xl text-slate-500 font-medium">/ {attempt.totalQuestions}</span>
          </div>

          <div className="flex justify-center items-center gap-3 mb-6">
            <Badge variant={isPassed ? 'success' : 'warning'} size="md">
              {attempt.percentage}% Mastery
            </Badge>
            <Badge variant="neutral" size="md" icon={<Clock className="w-3.5 h-3.5" />}>
              {formatTime(attempt.timeSpentSeconds)}
            </Badge>
          </div>

          {/* Weak Topics Highlight */}
          {attempt.weakTopics && attempt.weakTopics.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-left max-w-xl mx-auto mb-6">
              <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs uppercase tracking-wider mb-2">
                <AlertTriangle className="w-4 h-4" />
                Focus Topics for Revision
              </div>
              <div className="flex flex-wrap gap-1.5">
                {attempt.weakTopics.map((wt, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-amber-950/80 text-amber-200 text-xs font-medium border border-amber-500/30">
                    {wt}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setAttempt(null);
                setAnswers({});
                setCurrentIdx(0);
                setTimeSeconds(0);
              }}
              icon={<RotateCcw className="w-4 h-4" />}
            >
              Retake Quiz
            </Button>
            {onBack && (
              <Button onClick={onBack}>
                Back to Quizzes
              </Button>
            )}
          </div>
        </div>

        {/* Detailed Question Review */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-white">Answer Breakdown & Explanations</h3>
          {attempt.answers.map((ans, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-2xl glass-panel border ${
                ans.isCorrect ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-rose-500/30 bg-rose-950/10'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <h4 className="text-sm font-medium text-white">{ans.questionText}</h4>
                </div>
                {ans.isCorrect ? (
                  <Badge variant="success" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                    Correct
                  </Badge>
                ) : (
                  <Badge variant="danger" icon={<XCircle className="w-3.5 h-3.5" />}>
                    Incorrect
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Your Answer:</span>
                  <span className={ans.isCorrect ? 'text-emerald-300 font-semibold' : 'text-rose-300 font-semibold'}>
                    {ans.selectedAnswer}
                  </span>
                </div>
                {!ans.isCorrect && (
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                    <span className="text-slate-400 block mb-1">Correct Answer:</span>
                    <span className="text-emerald-300 font-semibold">{ans.correctAnswer}</span>
                  </div>
                )}
              </div>

              {ans.explanation && (
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                  <span className="font-semibold text-violet-300 block mb-1">💡 Explanation:</span>
                  {ans.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!currentQ) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Top Bar with Progress & Timer */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="brand">
            Question {currentIdx + 1} of {totalQuestions}
          </Badge>
          <Badge variant="neutral">{currentQ.difficulty.toUpperCase()}</Badge>
          {currentQ.topic && <Badge variant="info">{currentQ.topic}</Badge>}
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
          <Clock className="w-3.5 h-3.5 text-violet-400" />
          {formatTime(timeSeconds)}
        </div>
      </div>

      <ProgressBar progress={progressPercent} color="brand" size="sm" />

      {/* Question Card */}
      <div className="glass-panel p-8 rounded-3xl border border-violet-500/20 shadow-2xl space-y-6">
        <h3 className="text-lg font-semibold text-white leading-snug">
          {currentQ.question}
        </h3>

        {/* Options for MCQ / True False */}
        {(currentQ.type === 'mcq' || currentQ.type === 'true_false') && (
          <div className="space-y-3">
            {currentQ.options.map((option, idx) => {
              const isSelected = answers[currentQ.questionIndex] === option;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(option)}
                  className={`w-full p-4 rounded-2xl border text-left text-sm transition-all duration-200 flex items-center justify-between ${
                    isSelected
                      ? 'bg-violet-600/20 border-violet-500 text-white shadow-lg shadow-violet-500/10 ring-1 ring-violet-500'
                      : 'bg-slate-900/60 border-slate-800 text-slate-200 hover:bg-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'bg-violet-600 text-white border-violet-500'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="font-medium leading-relaxed">{option}</span>
                  </div>
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-violet-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Short Answer Input */}
        {currentQ.type === 'short_answer' && (
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Your Answer</label>
            <textarea
              rows={3}
              value={answers[currentQ.questionIndex] || ''}
              onChange={(e) => handleSelectOption(e.target.value)}
              placeholder="Type your concise answer here..."
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-sm text-white focus:outline-none focus:border-violet-500 placeholder:text-slate-600 resize-none"
            />
          </div>
        )}

        {/* Grounded Source Reference if present */}
        {currentQ.sourceReference && (
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-violet-400 shrink-0" />
            <span>Generated from {currentQ.sourceReference.documentName}</span>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
            disabled={currentIdx === 0}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Previous
          </Button>

          {currentIdx < totalQuestions - 1 ? (
            <Button
              size="sm"
              onClick={() => setCurrentIdx((p) => Math.min(totalQuestions - 1, p + 1))}
            >
              Next <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              variant="success"
              size="sm"
              onClick={handleSubmitQuiz}
              isLoading={isSubmitting}
              icon={<Sparkles className="w-4 h-4" />}
            >
              Submit Quiz ({answeredCount}/{totalQuestions})
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizPlayer;
