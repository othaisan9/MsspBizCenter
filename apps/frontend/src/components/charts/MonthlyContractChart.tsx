'use client';

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { statsApi } from '@/lib/api';

interface MonthlyData {
  month: string;
  new: number;
  renewed: number;
}

export function MonthlyContractChart() {
  const [data, setData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await statsApi.contractsMonthly();
        if (result && Array.isArray(result)) {
          setData(result.map((item) => ({
            month: `${item.year}-${String(item.month).padStart(2, '0')}`,
            new: item.newContracts,
            renewed: item.renewals,
          })));
        }
      } catch (error) {
        console.error('Failed to load monthly contract data:', error);
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
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorRenewed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="month"
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
        <Area
          type="monotone"
          dataKey="new"
          name="신규 계약"
          stroke="#3b82f6"
          fillOpacity={1}
          fill="url(#colorNew)"
        />
        <Area
          type="monotone"
          dataKey="renewed"
          name="갱신"
          stroke="#10b981"
          fillOpacity={1}
          fill="url(#colorRenewed)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
