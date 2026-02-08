'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { statsApi } from '@/lib/api';

interface WeeklyData {
  week: string;
  total: number;
  completed: number;
  inProgress: number;
}

export function WeeklyTaskChart() {
  const [data, setData] = useState<WeeklyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await statsApi.tasksWeekly();
        if (result && Array.isArray(result)) {
          setData(result);
        }
      } catch (error) {
        console.error('Failed to load weekly task data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="text-sm text-gray-400">차트 로딩 중...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="text-sm text-gray-400">데이터가 없습니다</div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="week"
          tick={{ fontSize: 12 }}
          stroke="#9ca3af"
        />
        <YAxis
          tick={{ fontSize: 12 }}
          stroke="#9ca3af"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '2px solid #1f2937',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            boxShadow: '3px 3px 0px 0px #1f2937',
            padding: '8px 12px',
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: '0.875rem' }}
          iconType="rect"
        />
        <Bar dataKey="total" name="전체" fill="#9ca3af" radius={[4, 4, 0, 0]} />
        <Bar dataKey="completed" name="완료" fill="#10b981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="inProgress" name="진행중" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
