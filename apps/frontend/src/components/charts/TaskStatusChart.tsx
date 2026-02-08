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
  todo: '#6b7280',
  in_progress: '#2563eb',
  review: '#d97706',
  done: '#059669',
};

const STATUS_LABELS: Record<string, string> = {
  todo: '대기',
  in_progress: '진행중',
  review: '검토',
  done: '완료',
};

const BRUTAL_TOOLTIP = {
  backgroundColor: 'white',
  border: '2px solid #1f2937',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  boxShadow: '3px 3px 0px 0px #1f2937',
  padding: '8px 12px',
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

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const renderLabel = (entry: any) => {
    const percent = ((entry.value / total) * 100).toFixed(0);
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
          innerRadius={60}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
          strokeWidth={2}
          stroke="#1f2937"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#6b7280'} />
          ))}
        </Pie>
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="text-lg font-bold fill-gray-900">
          {total}건
        </text>
        <Tooltip
          contentStyle={BRUTAL_TOOLTIP}
          formatter={(value: number, name: string, props: any) => [`${value}건`, props.payload.label]}
        />
        <Legend
          wrapperStyle={{ fontSize: '0.875rem' }}
          formatter={(value: string, entry: any) => entry.payload.label}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
