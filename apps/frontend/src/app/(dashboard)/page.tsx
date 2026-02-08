'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { statsApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { getWeekNumber } from '@/lib/utils';
import { WeeklyTaskChart } from '@/components/charts/WeeklyTaskChart';
import { TaskStatusChart } from '@/components/charts/TaskStatusChart';
import { TaskPriorityChart } from '@/components/charts/TaskPriorityChart';
import { MonthlyContractChart } from '@/components/charts/MonthlyContractChart';

interface DashboardStats {
  totalTasks: number;
  completedTasksThisWeek: number;
  meetingsThisMonth: number;
  activeContracts: number;
  expiringContracts: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    completedTasksThisWeek: 0,
    meetingsThisMonth: 0,
    activeContracts: 0,
    expiringContracts: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadDashboardStats = useCallback(async () => {
    try {
      const result = await statsApi.dashboard();
      if (result) {
        setStats({
          totalTasks: result.totalTasks || 0,
          completedTasksThisWeek: result.completedTasksThisWeek || 0,
          meetingsThisMonth: result.meetingsThisMonth || 0,
          activeContracts: result.activeContracts || 0,
          expiringContracts: result.expiringContracts || 0,
        });
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardStats();
  }, [loadDashboardStats]);

  const currentWeek = getWeekNumber();
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          안녕하세요, {user?.name}님
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {currentYear}년 {currentWeek}주차 대시보드
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/tasks">
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '-' : stats.totalTasks}
                </p>
                <p className="text-sm text-gray-500">전체 업무</p>
                {!loading && stats.completedTasksThisWeek > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    이번 주 {stats.completedTasksThisWeek}건 완료
                  </p>
                )}
              </div>
            </div>
          </div>
        </Link>

        <Link href="/meetings">
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '-' : stats.meetingsThisMonth}
                </p>
                <p className="text-sm text-gray-500">이번 달 회의</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/contracts">
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '-' : stats.activeContracts}
                </p>
                <p className="text-sm text-gray-500">활성 계약</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/contracts">
          <div className="bg-white rounded-xl border border-red-200 p-6 hover:shadow-md transition-shadow cursor-pointer bg-red-50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-900">
                  {loading ? '-' : stats.expiringContracts}
                </p>
                <p className="text-sm text-red-600">만료 임박</p>
                <p className="text-xs text-red-500 mt-1">30일 이내</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="주차별 업무 현황">
          <WeeklyTaskChart />
        </Card>

        <Card title="상태별 업무 비율">
          <TaskStatusChart />
        </Card>

        <Card title="월별 계약 추이">
          <MonthlyContractChart />
        </Card>

        <Card title="우선순위 분포">
          <TaskPriorityChart />
        </Card>
      </div>
    </div>
  );
}
