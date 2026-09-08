import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Send,
  Sparkles,
  BookOpen,
  GraduationCap,
  Flame,
  Plus,
  Trash2,
  MessageSquare,
  ChevronDown,
  Loader2,
  AlertCircle,
  HelpCircle,
  Bot,
} from 'lucide-react';
import api from '../services/api';
import { ChatMode, Conversation, ChatMessage as IChatMessage, Course, Citation } from '../types';
import { ChatMessage } from '../components/chat/ChatMessage';
import { SourceDrawer } from '../components/chat/SourceDrawer';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export const Chat: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const conversationId = searchParams.get('id');
  const courseIdParam = searchParams.get('courseId');
  const modeParam = (searchParams.get('mode') as ChatMode) || 'course_materials';

  const [inputMessage, setInputMessage] = useState('');
  const [selectedMode, setSelectedMode] = useState<ChatMode>(modeParam);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courseIdParam || '');
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations list
  const { data: conversations = [], isLoading: isLoadingConvs } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await api.get('/chat/conversations');
      return res.data.conversations;
    },
  });

  // Fetch active conversation detail
  const { data: activeData, isLoading: isLoadingMessages } = useQuery<{
    conversation: Conversation;
    messages: IChatMessage[];
  }>({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      if (!conversationId) return null;
      const res = await api.get(`/chat/conversations/${conversationId}`);
      return res.data;
    },
    enabled: !!conversationId,
  });

  // Fetch courses list for selector
  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: async () => {
      const res = await api.get('/courses');
      return res.data.courses;
    },
  });

  // Sync mode and course with active conversation
  useEffect(() => {
    if (activeData?.conversation) {
      setSelectedMode(activeData.conversation.mode);
      if (activeData.conversation.courseId) {
        setSelectedCourseId((activeData.conversation.courseId as any)._id || activeData.conversation.courseId);
      }
    }
  }, [activeData]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeData?.messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const res = await api.post('/chat', {
        conversationId: conversationId || undefined,
        message: messageText,
        mode: selectedMode,
        courseId: selectedCourseId || undefined,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setInputMessage('');
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (!conversationId && data.conversation?.id) {
        setSearchParams({ id: data.conversation.id });
      } else {
        queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      }
    },
  });

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: async (convId: string) => {
      await api.delete(`/chat/conversations/${convId}`);
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (conversationId === deletedId) {
        setSearchParams({});
      }
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(inputMessage.trim());
  };

  const handleNewChat = () => {
    setSearchParams({});
    setInputMessage('');
  };

  const messages: IChatMessage[] = activeData?.messages || [];

  return (
    <div className="flex h-[calc(100vh-6.5rem)] glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl relative">
      {/* Sidebar: Conversation History */}
      <aside className="hidden md:flex flex-col w-72 bg-slate-950/80 border-r border-slate-800 p-4 shrink-0 justify-between">
        <div className="space-y-4 overflow-hidden flex flex-col flex-1">
          <Button
            onClick={handleNewChat}
            variant="outline"
            size="sm"
            className="w-full justify-center"
            icon={<Plus className="w-4 h-4" />}
          >
            New Study Session
          </Button>

          <div className="overflow-y-auto flex-1 space-y-1 pr-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1">
              Recent Sessions
            </span>
            {isLoadingConvs ? (
              <div className="space-y-2 p-2">
                <div className="h-8 bg-slate-800/60 rounded-xl animate-pulse" />
                <div className="h-8 bg-slate-800/60 rounded-xl animate-pulse" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-xs text-slate-500 p-3 text-center">No past study chats.</p>
            ) : (
              conversations.map((conv) => {
                const isActive = conv._id === conversationId;
                return (
                  <div
                    key={conv._id}
                    className={`group flex items-center justify-between p-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'bg-violet-600/20 text-violet-200 border border-violet-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                    onClick={() => setSearchParams({ id: conv._id })}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-violet-400' : 'text-slate-500'}`} />
                      <span className="truncate font-medium">{conv.title}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Delete this chat session?')) {
                          deleteConversationMutation.mutate(conv._id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 rounded transition-all shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Mode info footer in sidebar */}
        <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
          <p className="font-semibold text-slate-300">Active Mode Tips:</p>
          {selectedMode === 'course_materials' && (
            <p>Strict RAG active. Questions are answered strictly from indexed course files with verified citations.</p>
          )}
          {selectedMode === 'general_study' && (
            <p>AI Tutor active. Uses long-term learner profile & tools for personalized concept explanations.</p>
          )}
          {selectedMode === 'exam_prep' && (
            <p>Socratic Coach active. Diagnoses weak concepts and asks checking questions.</p>
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900/40">
        {/* Chat Header / Mode Switcher Bar */}
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-semibold text-slate-400 mr-1 hidden sm:inline">Mode:</span>
            <button
              onClick={() => setSelectedMode('course_materials')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                selectedMode === 'course_materials'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Course Materials (RAG)
            </button>

            <button
              onClick={() => setSelectedMode('general_study')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                selectedMode === 'general_study'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              General Study
            </button>

            <button
              onClick={() => setSelectedMode('exam_prep')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                selectedMode === 'exam_prep'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Exam Preparation
            </button>
          </div>

          {/* Course Scope Filter */}
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
          >
            <option value="">All Uploaded Materials</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-violet-600/30 mb-4 ring-1 ring-violet-400/40">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                What would you like to study today?
              </h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Ask questions from your course lecture notes, request code breakdowns, or test your understanding with Socratic check-ins.
              </p>

              {/* Sample Prompt Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
                <button
                  onClick={() => {
                    setInputMessage('Explain the 4 necessary conditions for deadlock and how to prevent them.');
                  }}
                  className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-violet-500/40 text-xs text-slate-300 hover:text-white transition-all shadow-sm"
                >
                  <span className="font-semibold text-violet-400 block mb-0.5">📚 Course Concepts</span>
                  Explain the 4 Coffman deadlock conditions.
                </button>

                <button
                  onClick={() => {
                    setInputMessage('Can you test my knowledge on counting semaphores with 3 practice questions?');
                  }}
                  className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-violet-500/40 text-xs text-slate-300 hover:text-white transition-all shadow-sm"
                >
                  <span className="font-semibold text-indigo-400 block mb-0.5">🎯 Quiz Checkpoint</span>
                  Test my knowledge on counting semaphores.
                </button>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <ChatMessage
                key={msg._id}
                message={msg}
                onSelectCitation={(citation) => setActiveCitation(citation)}
              />
            ))
          )}

          {sendMessageMutation.isPending && (
            <div className="glass-panel p-4 rounded-2xl border border-violet-500/20 max-w-sm flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <div className="text-xs text-slate-300 font-medium">
                {selectedMode === 'course_materials'
                  ? 'Searching course materials & generating grounded answer...'
                  : 'Analyzing with memory & preparing response...'}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 shrink-0">
          <form onSubmit={handleSend} className="relative flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                selectedMode === 'course_materials'
                  ? 'Ask a question from your course notes (RAG grounded)...'
                  : 'Ask your AI tutor anything or practice concepts...'
              }
              className="flex-1 py-3.5 pl-4 pr-12 bg-slate-900 border border-slate-700 rounded-2xl text-sm text-white focus:outline-none focus:border-violet-500 placeholder:text-slate-500 shadow-inner"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!inputMessage.trim() || sendMessageMutation.isPending}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
            <span>
              {selectedMode === 'course_materials'
                ? '⚡ RAG mode verified with course citations'
                : '🧠 AI Tutor tailored to your learning profile'}
            </span>
            <span className="font-mono">Press Enter to send</span>
          </div>
        </div>
      </div>

      {/* Source Citation Drawer */}
      <SourceDrawer
        citation={activeCitation}
        isOpen={!!activeCitation}
        onClose={() => setActiveCitation(null)}
      />
    </div>
  );
};

export default Chat;
