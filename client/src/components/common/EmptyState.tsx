import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  actionIcon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl glass-panel border border-dashed border-slate-800 my-4">
      <div className="p-4 rounded-2xl bg-violet-500/10 text-violet-400 border border-violet-500/20 mb-4 animate-float">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mb-5 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <Button onClick={onAction} icon={actionIcon} size="sm">
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
