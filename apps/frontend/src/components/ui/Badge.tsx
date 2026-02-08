'use client';

import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

export function Badge({ children, color, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold border border-gray-800',
        color || 'bg-gray-100 text-gray-800',
        className,
      )}
    >
      {children}
    </span>
  );
}
