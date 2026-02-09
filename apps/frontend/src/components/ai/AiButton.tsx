'use client';

import { cn } from '@/lib/utils';

interface AiButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md';
  label?: string;
  className?: string;
}

export function AiButton({
  onClick,
  loading = false,
  disabled = false,
  size = 'md',
  label = 'AI 생성',
  className,
}: AiButtonProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-bold rounded-md border-2 border-violet-600 shadow-brutal-sm',
        'bg-violet-50 text-violet-700',
        'transition-all duration-150',
        'hover:bg-violet-100 hover:shadow-[2px_2px_0px_0px] hover:shadow-violet-600',
        'active:translate-x-[1px] active:translate-y-[1px] active:shadow-none',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-brutal-sm disabled:hover:translate-x-0 disabled:hover:translate-y-0',
        sizeClasses[size],
        className
      )}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-3 w-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          생성 중...
        </>
      ) : (
        <>
          <span className="mr-1.5">✦</span>
          {label}
        </>
      )}
    </button>
  );
}
