import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'solid' | 'gradient';
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'glass',
  hoverEffect = false,
  className,
  ...props
}) => {
  const variants = {
    glass: 'glass-panel rounded-2xl p-6 shadow-xl shadow-black/20',
    solid: 'bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg shadow-black/20',
    gradient: 'bg-gradient-to-br from-slate-900 via-slate-900/90 to-violet-950/40 border border-violet-500/20 rounded-2xl p-6 shadow-xl shadow-violet-950/20',
  };

  return (
    <div
      className={twMerge(
        clsx(
          variants[variant],
          hoverEffect && 'glass-panel-hover cursor-pointer',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
