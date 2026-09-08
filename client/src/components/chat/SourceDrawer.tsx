import React from 'react';
import { X, BookOpen, ExternalLink, FileText, CheckCircle } from 'lucide-react';
import { Citation } from '../../types';

interface SourceDrawerProps {
  citation: Citation | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SourceDrawer: React.FC<SourceDrawerProps> = ({
  citation,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !citation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-xl glass-panel bg-slate-900/95 rounded-2xl border border-violet-500/30 shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-500/15 text-violet-400 border border-violet-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Verified Source Excerpt</h3>
              <p className="text-xs text-slate-400">Retrieved via Semantic Vector Search</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center gap-2 overflow-hidden">
              <FileText className="w-4 h-4 text-violet-400 shrink-0" />
              <span className="text-xs font-medium text-slate-200 truncate">
                {citation.documentName}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {citation.pageNumber && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-medium">
                  Page {citation.pageNumber}
                </span>
              )}
              {citation.score !== undefined && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {Math.round(citation.score * 100)}% Match
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Retrieved Text Passage
            </label>
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-200 font-mono leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
              {citation.snippet}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-violet-950/20 border border-violet-500/20 text-xs text-violet-300 flex items-start gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-violet-400" />
            <span>
              This citation was retrieved from your uploaded course materials to ensure this AI answer is grounded with zero hallucinations.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SourceDrawer;
