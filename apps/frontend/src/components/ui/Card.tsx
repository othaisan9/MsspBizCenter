'use client';

import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
  onClick?: () => void;
}

export function Card({ children, className, title, action, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-md shadow-brutal border-2 border-gray-800',
        onClick ? 'cursor-pointer transition-all duration-150 hover:shadow-brutal-hover hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-brutal-none active:translate-x-[2px] active:translate-y-[2px]' : '',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-gray-800">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {action}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
