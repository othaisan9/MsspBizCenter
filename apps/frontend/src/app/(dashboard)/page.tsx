'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { statsApi, contractsApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { getWeekNumber } from '@/lib/utils';
import { WeeklyTaskChart } from '@/components/charts/WeeklyTaskChart';
import { TaskStatusChart } from '@/components/charts/TaskStatusChart';
import { TaskPriorityChart } from '@/components/charts/TaskPriorityChart';
import { MonthlyContractChart } from '@/components/charts/MonthlyContractChart';
import { AiButton, AiStreamPanel } from '@/components/ai';
import { useAiStream } from '@/hooks/useAiStream';

import type { DashboardStatsResponse, ContractDashboardResponse } from '@msspbiz/shared';

type ExpiringContractsInfo = ContractDashboardResponse['expiring'];

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStatsResponse>({
    totalTasks: 0,
    completedThisWeek: 0,
    inProgressTasks: 0,
    totalMeetings: 0,
    totalContracts: 0,
    activeContracts: 0,
    expiringContracts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [expiringInfo, setExpiringInfo] = useState<ExpiringContractsInfo>({
    within7Days: 0,
    within30Days: 0,
  });

  const { content: perfContent, loading: perfLoading, error: perfError, start: startPerf, reset: resetPerf } = useAiStream();

  const loadDashboardStats = useCallback(async () => {
    try {
      const result = await statsApi.dashboard();
      if (result) {
        setStats(result);
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
      toast.error('대시보드 통계를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadExpiringContracts = useCallback(async () => {
    try {
      const dashboardData = await contractsApi.dashboard();
      if (dashboardData?.expiring) {
        setExpiringInfo({
          within7Days: dashboardData.expiring.within7Days || 0,
          within30Days: dashboardData.expiring.within30Days || 0,
        });
      }
    } catch (error) {
      console.error('Failed to load expiring contracts:', error);
      toast.error('만료 예정 계약을 불러오는데 실패했습니다.');
    }
  }, []);

  useEffect(() => {
    loadDashboardStats();
    loadExpiringContracts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePerformanceAnalysis = useCallback(() => {
    startPerf('/ai/my-performance', {});
  }, [startPerf]);

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

      {/* Expiring contracts alert banners */}
      {(expiringInfo.within7Days > 0 || expiringInfo.within30Days > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {expiringInfo.within7Days > 0 && (
            <Link href="/contracts?status=active&expiringWithinDays=7">
              <div className="bg-red-50 border-2 border-red-700 rounded-md p-4 hover:bg-red-100 transition-all duration-150 cursor-pointer shadow-brutal-sm h-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 text-red-600 rounded-md flex items-center justify-center flex-shrink-0 border-2 border-red-700">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-900">
                      {expiringInfo.within7Days}건의 계약이 7일 이내 만료
                    </p>
                    <p className="text-xs text-red-600 mt-0.5">
                      확인이 필요합니다
                    </p>
                  </div>
                  <div className="text-red-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          )}
          {expiringInfo.within30Days > 0 && (
            <Link href="/contracts?status=active&expiringWithinDays=30">
              <div className="bg-yellow-50 border-2 border-yellow-700 rounded-md p-4 hover:bg-yellow-100 transition-all duration-150 cursor-pointer shadow-brutal-sm h-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-md flex items-center justify-center flex-shrink-0 border-2 border-yellow-700">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-yellow-900">
                      만료 임박 <span className="font-bold">{expiringInfo.within30Days}건</span>
                    </p>
                    <p className="text-xs text-yellow-600 mt-0.5">
                      30일 이내 만료 예정
                    </p>
                  </div>
                  <div className="text-yellow-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/tasks">
          <div className="bg-white rounded-md border-2 border-gray-800 p-6 hover:shadow-brutal-hover hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-150 cursor-pointer shadow-brutal-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-md flex items-center justify-center border-2 border-blue-700">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '-' : stats.totalTasks}
                </p>
                <p className="text-sm text-gray-500">전체 업무</p>
                {!loading && stats.completedThisWeek > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    이번 주 {stats.completedThisWeek}건 완료
                  </p>
                )}
              </div>
            </div>
          </div>
        </Link>

        <Link href="/meetings">
          <div className="bg-white rounded-md border-2 border-gray-800 p-6 hover:shadow-brutal-hover hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-150 cursor-pointer shadow-brutal-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-md flex items-center justify-center border-2 border-purple-700">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '-' : stats.totalMeetings}
                </p>
                <p className="text-sm text-gray-500">이번 달 회의</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/contracts">
          <div className="bg-white rounded-md border-2 border-gray-800 p-6 hover:shadow-brutal-hover hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-150 cursor-pointer shadow-brutal-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-md flex items-center justify-center border-2 border-green-700">
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
          <div className="bg-white rounded-md border-2 border-gray-800 p-6 hover:shadow-brutal-hover hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-150 cursor-pointer shadow-brutal-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-md flex items-center justify-center border-2 border-gray-700">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '-' : stats.totalContracts}
                </p>
                <p className="text-sm text-gray-500">전체 계약</p>
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

      {/* AI Performance Analysis Card */}
      <Card
        title="내 업무 성과 분석"
        action={
          <AiButton
            onClick={handlePerformanceAnalysis}
            loading={perfLoading}
            label="분석하기"
            size="sm"
          />
        }
      >
        {perfContent || perfError ? (
          <AiStreamPanel
            content={perfContent}
            loading={perfLoading}
            error={perfError}
            onRegenerate={handlePerformanceAnalysis}
            onClose={resetPerf}
            title="AI 성과 분석"
          />
        ) : (
          <p className="text-sm text-gray-400 py-4">
            AI 버튼을 클릭하면 이번 주/월 업무 성과를 분석합니다.
          </p>
        )}
      </Card>
    </div>
  );
}
