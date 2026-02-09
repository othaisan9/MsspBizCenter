'use client';

import { useState, useRef, useCallback } from 'react';

const API_BASE =
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:4001`
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001');
const API_PREFIX = '/api/v1';

interface UseAiStreamReturn {
  content: string;
  loading: boolean;
  error: string | null;
  start: (endpoint: string, body: object) => Promise<void>;
  abort: () => void;
  reset: () => void;
}

export function useAiStream(): UseAiStreamReturn {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const start = useCallback(async (endpoint: string, body: object) => {
    setLoading(true);
    setContent('');
    setError(null);

    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${API_BASE}${API_PREFIX}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        body: JSON.stringify(body),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Request failed');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              setLoading(false);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                setError(parsed.error);
                setLoading(false);
                return;
              }
              if (parsed.text) {
                accumulatedContent += parsed.text;
                setContent(accumulatedContent);
              }
            } catch (e) {
              // Skip invalid JSON lines
              console.warn('Failed to parse SSE data:', data);
            }
          }
        }
      }

      setLoading(false);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('요청이 취소되었습니다');
      } else {
        setError(err.message || 'AI 생성 중 오류가 발생했습니다');
      }
      setLoading(false);
    }
  }, []);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
  }, []);

  const reset = useCallback(() => {
    setContent('');
    setError(null);
    setLoading(false);
  }, []);

  return { content, loading, error, start, abort, reset };
}
