'use client';

import { cn, sanitizeHtml } from '@/lib/utils';

interface AiSummaryPanelProps {
  content: string;
  loading: boolean;
  error?: string | null;
  onClose?: () => void;
}

export function AiSummaryPanel({
  content,
  loading,
  error,
  onClose,
}: AiSummaryPanelProps) {
  if (error) {
    return (
      <div className={cn('bg-red-50/50 border-2 border-red-300 rounded-md p-4')}>
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-sm font-bold text-red-900">AI 요약</h3>
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
      </div>
    );
  }

  return (
    <div className={cn('bg-violet-50/50 border-2 border-violet-300 rounded-md p-4')}>
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-bold text-violet-900">AI 요약</h3>
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
          요약 생성 중...
        </div>
      ) : (
        <div className="prose prose-sm max-w-none text-gray-900">
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
          {loading && (
            <span className="inline-block w-2 h-4 bg-violet-600 animate-pulse ml-1" />
          )}
        </div>
      )}
    </div>
  );
}
