import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import api from '../../services/api';
import { Button } from '../common/Button';

interface FileUploadZoneProps {
  courseId: string;
  onUploadSuccess?: () => void;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  courseId,
  onUploadSuccess,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'embedding' | 'ready' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectFile = (selectedFile: File) => {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx', 'txt', 'md'].includes(ext || '')) {
      setErrorMessage('Unsupported file type. Please upload PDF, DOCX, TXT, or MD.');
      setStatus('error');
      return;
    }
    if (selectedFile.size > 25 * 1024 * 1024) {
      setErrorMessage('File exceeds maximum size limit of 25MB.');
      setStatus('error');
      return;
    }

    setFile(selectedFile);
    setCustomTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
    setStatus('idle');
    setErrorMessage('');
  };

  const handleUpload = async () => {
    if (!file || !courseId) return;

    setStatus('uploading');
    setErrorMessage('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('courseId', courseId);
    if (customTitle.trim()) {
      formData.append('title', customTitle.trim());
    }

    try {
      // Simulate status progression for rich UX feedback
      const timer1 = setTimeout(() => setStatus('processing'), 800);
      const timer2 = setTimeout(() => setStatus('embedding'), 1800);

      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      if (res.data.success) {
        setStatus('ready');
        setTimeout(() => {
          setFile(null);
          setCustomTitle('');
          setStatus('idle');
          if (onUploadSuccess) onUploadSuccess();
        }, 1500);
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(
        err.response?.data?.message || 'Failed to process document. Please try again.'
      );
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => status === 'idle' && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-200 text-center cursor-pointer ${
          isDragging
            ? 'border-violet-500 bg-violet-500/10'
            : file
            ? 'border-violet-500/40 bg-slate-900/80'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && handleSelectFile(e.target.files[0])}
          accept=".pdf,.docx,.txt,.md"
          className="hidden"
        />

        {status === 'idle' && !file && (
          <div className="flex flex-col items-center">
            <div className="p-4 rounded-2xl bg-violet-500/10 text-violet-400 mb-3 border border-violet-500/20">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h4 className="text-base font-semibold text-white mb-1">
              Upload Course Materials
            </h4>
            <p className="text-xs text-slate-400 mb-3 max-w-sm">
              Drag and drop your lecture notes, textbook chapters, or syllabus (PDF, DOCX, TXT, MD up to 25MB).
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">PDF</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">DOCX</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">TXT</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">MD</span>
            </div>
          </div>
        )}

        {status === 'idle' && file && (
          <div className="flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="p-3 rounded-2xl bg-indigo-500/15 text-indigo-400 mb-3 border border-indigo-500/30">
              <FileText className="w-8 h-8" />
            </div>
            <div className="w-full max-w-sm mb-4">
              <label className="block text-xs text-slate-400 text-left mb-1 font-medium">Document Title</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-violet-500"
                placeholder="Enter document title"
              />
              <p className="text-[11px] text-slate-500 text-left mt-1">
                Original file: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setFile(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleUpload} icon={<Sparkles className="w-3.5 h-3.5" />}>
                Process & Generate Embeddings
              </Button>
            </div>
          </div>
        )}

        {(status === 'uploading' || status === 'processing' || status === 'embedding') && (
          <div className="flex flex-col items-center py-4">
            <Loader2 className="w-10 h-10 text-violet-400 animate-spin mb-3" />
            <h4 className="text-sm font-semibold text-white mb-1">
              {status === 'uploading' && 'Uploading document...'}
              {status === 'processing' && 'Extracting text and chunking sections...'}
              {status === 'embedding' && 'Generating vector embeddings for RAG...'}
            </h4>
            <p className="text-xs text-slate-400">
              Transforming your course material into searchable AI knowledge...
            </p>
          </div>
        )}

        {status === 'ready' && (
          <div className="flex flex-col items-center py-4 text-emerald-400">
            <CheckCircle2 className="w-10 h-10 mb-2" />
            <h4 className="text-sm font-semibold text-white mb-1">Document Ready!</h4>
            <p className="text-xs text-slate-400">Successfully indexed into vector database.</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center py-4">
            <AlertCircle className="w-10 h-10 text-rose-400 mb-2" />
            <h4 className="text-sm font-semibold text-white mb-1">Upload Failed</h4>
            <p className="text-xs text-rose-400 max-w-sm mb-3">{errorMessage}</p>
            <Button size="sm" variant="secondary" onClick={() => setStatus('idle')}>
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploadZone;
