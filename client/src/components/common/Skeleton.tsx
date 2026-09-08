import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rectangular' | 'circular';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangular',
  className,
  ...props
}) => {
  const variants = {
    text: 'h-4 w-full rounded',
    rectangular: 'rounded-xl',
    circular: 'rounded-full',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'bg-slate-800/60 animate-pulse',
          variants[variant],
          className
        )
      )}
      {...props}
    />
  );
};

export default Skeleton;
