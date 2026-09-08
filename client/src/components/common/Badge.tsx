import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'brand',
  size = 'md',
  icon,
  className,
}) => {
  const variants = {
    brand: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    danger: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    info: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    neutral: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs font-medium gap-1.5',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center rounded-full border font-medium tracking-wide',
          variants[variant],
          sizes[size],
          className
        )
      )}
    >
      {icon}
      {children}
    </span>
  );
};

export default Badge;
