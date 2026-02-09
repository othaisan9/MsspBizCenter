'use client';

import { useState, useCallback } from 'react';

const API_BASE =
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:4001`
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001');
const API_PREFIX = '/api/v1';

interface UseAiGenerateReturn {
  result: any;
  loading: boolean;
  error: string | null;
  generate: (endpoint: string, body: object) => Promise<any>;
  reset: () => void;
}

export function useAiGenerate(): UseAiGenerateReturn {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (endpoint: string, body: object) => {
    setLoading(true);
    setError(null);

    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    try {
      const response = await fetch(`${API_BASE}${API_PREFIX}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Request failed');
      }

      const data = await response.json();
      setResult(data);
      setLoading(false);
      return data;
    } catch (err: any) {
      setError(err.message || 'AI 생성 중 오류가 발생했습니다');
      setLoading(false);
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setLoading(false);
  }, []);

  return { result, loading, error, generate, reset };
}
