'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { AiMarkdown } from './AiMarkdown';

interface AiStreamPanelProps {
  content: string;
  loading: boolean;
  error?: string | null;
  onAccept?: () => void;
  onRegenerate?: () => void;
  onClose?: () => void;
  title?: string;
}

export function AiStreamPanel({
  content,
  loading,
  error,
  onAccept,
  onRegenerate,
  onClose,
  title = 'AI 생성 결과',
}: AiStreamPanelProps) {
  if (error) {
    return (
      <div className={cn('bg-red-50 border-2 border-red-600 rounded-md p-4')}>
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-sm font-bold text-red-900">{title}</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-red-600 hover:text-red-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <p className="text-sm text-red-800">{error}</p>
        <div className="flex justify-end gap-2 mt-4">
          {onRegenerate && (
            <Button size="sm" variant="secondary" onClick={onRegenerate}>
              재시도
            </Button>
          )}
          {onClose && (
            <Button size="sm" variant="ghost" onClick={onClose}>
              닫기
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-violet-50 border-2 border-violet-600 rounded-md p-4')}>
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-bold text-violet-900">{title}</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-violet-600 hover:text-violet-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {loading && !content ? (
        <div className="flex items-center gap-2 text-sm text-violet-700">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          생성 중...
        </div>
      ) : (
        <div>
          <AiMarkdown content={content} />
          {loading && (
            <span className="inline-block w-2 h-4 bg-violet-600 animate-pulse ml-1" />
          )}
        </div>
      )}

      {!loading && content && (
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t-2 border-violet-300">
          {onAccept && (
            <Button size="sm" onClick={onAccept}>
              적용
            </Button>
          )}
          {onRegenerate && (
            <Button size="sm" variant="secondary" onClick={onRegenerate}>
              재생성
            </Button>
          )}
          {onClose && (
            <Button size="sm" variant="ghost" onClick={onClose}>
              닫기
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
