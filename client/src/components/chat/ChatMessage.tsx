import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Sparkles, Copy, Check, BookOpen, Wrench } from 'lucide-react';
import { ChatMessage as IChatMessage, Citation } from '../../types';

interface ChatMessageProps {
  message: IChatMessage;
  onSelectCitation?: (citation: Citation) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onSelectCitation,
}) => {
  const isUser = message.role === 'user';
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div
      className={`flex gap-4 p-5 rounded-2xl transition-all duration-200 ${
        isUser
          ? 'bg-slate-900/60 border border-slate-800/80 ml-auto max-w-2xl'
          : 'glass-panel bg-slate-900/90 border border-violet-500/20 max-w-3xl shadow-xl'
      }`}
    >
      {/* Avatar */}
      <div className="shrink-0">
        {isUser ? (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <User className="w-5 h-5" />
          </div>
        ) : (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/30 ring-1 ring-violet-400/40">
            <Sparkles className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Message Body */}
      <div className="flex-1 overflow-hidden space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">
            {isUser ? 'You' : 'AI Study Assistant'}
          </span>
          <span className="text-[11px] text-slate-500">
            {message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
        </div>

        {/* Tools Used Badge */}
        {message.toolsUsed && message.toolsUsed.length > 0 && (
          <div className="flex flex-wrap gap-1.5 py-1">
            {message.toolsUsed.map((tool, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] font-mono"
              >
                <Wrench className="w-3 h-3" />
                {tool.toolName} {tool.resultSummary ? `(${tool.resultSummary})` : ''}
              </span>
            ))}
          </div>
        )}

        {/* Content with Markdown */}
        <div className="text-sm text-slate-200 leading-relaxed prose prose-invert max-w-none prose-p:my-2 prose-headings:text-white prose-headings:font-semibold prose-a:text-violet-400">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                const codeString = String(children).replace(/\n$/, '');

                if (!inline && match) {
                  return (
                    <div className="relative group my-3 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950">
                      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-400 font-mono">
                        <span>{match[1]}</span>
                        <button
                          onClick={() => handleCopyCode(codeString)}
                          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
                        >
                          {copiedCode === codeString ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy code</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="p-4 overflow-x-auto text-xs text-slate-100 font-mono bg-slate-950/90">
                        <code {...props}>{children}</code>
                      </pre>
                    </div>
                  );
                }

                return (
                  <code className="px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300 font-mono text-xs" {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Citations Footer */}
        {message.citations && message.citations.length > 0 && (
          <div className="pt-3 border-t border-slate-800/80">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-violet-400" />
              Verified Course Sources ({message.citations.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {message.citations.map((c, i) => (
                <button
                  key={i}
                  onClick={() => onSelectCitation && onSelectCitation(c)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 hover:text-white border border-violet-500/30 text-xs transition-all cursor-pointer group"
                >
                  <span className="font-medium truncate max-w-[180px]">{c.documentName}</span>
                  {c.pageNumber && (
                    <span className="px-1.5 py-0.2 rounded bg-violet-950/80 text-[10px] text-violet-300 font-semibold">
                      p. {c.pageNumber}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
