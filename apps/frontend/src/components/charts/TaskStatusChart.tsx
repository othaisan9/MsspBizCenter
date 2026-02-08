'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { statsApi } from '@/lib/api';

interface StatusData {
  name: string;
  value: number;
  label: string;
}

const STATUS_COLORS: Record<string, string> = {
  todo: '#9ca3af',
  in_progress: '#3b82f6',
  review: '#f59e0b',
  done: '#10b981',
};

const STATUS_LABELS: Record<string, string> = {
  todo: '대기',
  in_progress: '진행중',
  review: '검토',
  done: '완료',
};

export function TaskStatusChart() {
  const [data, setData] = useState<StatusData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await statsApi.tasksByStatus();
        if (result && Array.isArray(result)) {
          const formatted = result.map((item: any) => ({
            name: item.status,
            value: item.count,
            label: STATUS_LABELS[item.status] || item.status,
          }));
          setData(formatted);
        }
      } catch (error) {
        console.error('Failed to load task status data:', error);
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

  const renderLabel = (entry: any) => {
    const percent = ((entry.value / data.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(0);
    return `${percent}%`;
  };

  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderLabel}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#9ca3af'} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
          }}
          formatter={(value: number, name: string, props: any) => [value, props.payload.label]}
        />
        <Legend
          wrapperStyle={{ fontSize: '0.875rem' }}
          formatter={(value: string, entry: any) => entry.payload.label}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
