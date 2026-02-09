'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { statsApi } from '@/lib/api';

interface PriorityData {
  name: string;
  value: number;
  label: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#dc2626',
  urgent: '#dc2626',
  high: '#ea580c',
  medium: '#d97706',
  low: '#059669',
};

const PRIORITY_LABELS: Record<string, string> = {
  critical: '긴급',
  urgent: '긴급',
  high: '높음',
  medium: '보통',
  low: '낮음',
};

const BRUTAL_TOOLTIP = {
  backgroundColor: 'white',
  border: '2px solid #1f2937',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  boxShadow: '3px 3px 0px 0px #1f2937',
  padding: '8px 12px',
};

export function TaskPriorityChart() {
  const [data, setData] = useState<PriorityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await statsApi.tasksByPriority();
        if (result && Array.isArray(result)) {
          const formatted = result.map((item) => ({
            name: item.priority,
            value: item.count,
            label: PRIORITY_LABELS[item.priority] || item.priority,
          }));
          setData(formatted);
        }
      } catch (error) {
        console.error('Failed to load task priority data:', error);
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
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 12 }}
          stroke="#9ca3af"
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fontSize: 13, fontWeight: 500 }}
          stroke="#9ca3af"
          width={50}
        />
        <Tooltip
          contentStyle={BRUTAL_TOOLTIP}
          formatter={(value: number) => [`${value}건`, '업무 수']}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={28} strokeWidth={2} stroke="#1f2937">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name] || '#6b7280'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
