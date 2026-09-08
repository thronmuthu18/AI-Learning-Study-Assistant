import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Files,
  Search,
  Filter,
  Trash2,
  Eye,
  FileText,
  Sparkles,
  BookOpen,
  MessageSquare,
  Layers,
} from 'lucide-react';
import api from '../services/api';
import { CourseDocument, Course, DocumentChunk } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { Skeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';

export const Materials: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedFileType, setSelectedFileType] = useState<string>('all');
  const [inspectDoc, setInspectDoc] = useState<CourseDocument | null>(null);
  const [docChunks, setDocChunks] = useState<DocumentChunk[]>([]);
  const [isLoadingChunks, setIsLoadingChunks] = useState(false);

  const { data: documents = [], isLoading } = useQuery<CourseDocument[]>({
    queryKey: ['materials', selectedCourse],
    queryFn: async () => {
      const url = selectedCourse === 'all' ? '/documents' : `/documents?courseId=${selectedCourse}`;
      const res = await api.get(url);
      return res.data.documents;
    },
  });

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: async () => {
      const res = await api.get('/courses');
      return res.data.courses;
    },
  });

  const deleteDocMutation = useMutation({
    mutationFn: async (docId: string) => {
      await api.delete(`/documents/${docId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  const handleInspectDocument = async (doc: CourseDocument) => {
    setInspectDoc(doc);
    setIsLoadingChunks(true);
    try {
      const res = await api.get(`/documents/${doc._id}`);
      setDocChunks(res.data.chunks || []);
    } catch (err) {
      console.error('Failed to load document preview chunks:', err);
    } finally {
      setIsLoadingChunks(false);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.originalFileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedFileType === 'all' || doc.fileType === selectedFileType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-300 text-xs font-semibold border border-violet-500/25">
              Vector Library
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Course Materials & Knowledge Base</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Indexed lecture slides, textbook notes, and documents powering RAG answer retrieval
          </p>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by title or keyword..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto">
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Courses</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>

          <select
            value={selectedFileType}
            onChange={(e) => setSelectedFileType(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500 uppercase font-mono"
          >
            <option value="all">All File Types</option>
            <option value="pdf">PDF</option>
            <option value="docx">DOCX</option>
            <option value="txt">TXT</option>
            <option value="md">Markdown (MD)</option>
          </select>
        </div>
      </div>

      {/* Materials List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : filteredDocs.length === 0 ? (
        <EmptyState
          icon={<Files className="w-10 h-10" />}
          title="No materials found"
          description="Upload course materials from inside any course page to populate your AI vector search library."
          actionText="Go to Courses"
          onAction={() => navigate('/courses')}
          actionIcon={<BookOpen className="w-4 h-4" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => {
            const courseObj = typeof doc.courseId === 'object' ? (doc.courseId as Course) : null;

            return (
              <Card
                key={doc._id}
                variant="glass"
                className="p-5 flex flex-col justify-between space-y-4 group relative"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="text-sm font-bold text-white truncate">{doc.title}</h3>
                        <p className="text-[11px] text-slate-400 truncate">
                          {courseObj?.title || 'General Course'}
                        </p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-slate-300 text-[10px] font-mono border border-slate-800 uppercase shrink-0">
                      {doc.fileType}
                    </span>
                  </div>

                  {doc.summary && (
                    <p className="text-xs text-slate-300 line-clamp-2 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/80">
                      {doc.summary}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                    <span>{doc.chunkCount} Chunks</span>
                    <span>•</span>
                    <span>{doc.pageCount} Pages</span>
                    <span>•</span>
                    <span>{(doc.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleInspectDocument(doc)}
                      icon={<Eye className="w-3.5 h-3.5" />}
                    >
                      Inspect
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        navigate(`/chat?courseId=${courseObj?._id || ''}&mode=course_materials`)
                      }
                      icon={<MessageSquare className="w-3.5 h-3.5" />}
                    >
                      Ask AI
                    </Button>
                  </div>

                  <button
                    onClick={() => {
                      if (window.confirm(`Delete "${doc.title}" and its vector chunks?`)) {
                        deleteDocMutation.mutate(doc._id);
                      }
                    }}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Inspect Document Modal */}
      <Modal
        isOpen={!!inspectDoc}
        onClose={() => setInspectDoc(null)}
        title={inspectDoc?.title || 'Document Chunks Inspector'}
        subtitle={`Vector Embeddings & Extracted Text Preview (${inspectDoc?.chunkCount || 0} Chunks)`}
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-800/80 text-xs text-slate-300 flex items-center justify-between font-mono">
            <span>File: {inspectDoc?.originalFileName}</span>
            <span>Type: {inspectDoc?.fileType.toUpperCase()}</span>
            <span>Total Pages: {inspectDoc?.pageCount}</span>
          </div>

          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Sample Vector Chunks
          </h4>

          {isLoadingChunks ? (
            <div className="space-y-3">
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
            </div>
          ) : docChunks.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No chunks available for preview.</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {docChunks.map((chunk, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between text-[11px] text-violet-400 font-mono border-b border-slate-900 pb-1.5">
                    <span>Chunk #{chunk.chunkIndex + 1}</span>
                    <span>Page {chunk.pageNumber}</span>
                  </div>
                  <p className="text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                    {chunk.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Materials;
