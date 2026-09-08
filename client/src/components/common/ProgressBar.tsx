import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: 'brand' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = 'brand',
  size = 'md',
  showLabel = false,
}) => {
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  const colorStyles = {
    brand: 'bg-gradient-to-r from-violet-600 to-indigo-500',
    success: 'bg-gradient-to-r from-emerald-600 to-teal-500',
    warning: 'bg-gradient-to-r from-amber-500 to-orange-500',
    info: 'bg-gradient-to-r from-sky-500 to-blue-500',
  };

  const heightStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-medium text-slate-400 mb-1.5">
          <span>Progress</span>
          <span className="text-white font-semibold">{clampedProgress}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-800/80 rounded-full overflow-hidden ${heightStyles[size]}`}>
        <div
          className={`${colorStyles[color]} ${heightStyles[size]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
