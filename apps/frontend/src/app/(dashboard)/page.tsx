'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { tasksApi, meetingsApi, contractsApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getStatusColor, getStatusLabel, formatDate, getWeekNumber } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ tasks: 0, meetings: 0, contracts: 0 });
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [recentMeetings, setRecentMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [taskRes, meetingRes, contractRes] = await Promise.allSettled([
          tasksApi.list({ limit: '5', sortBy: 'createdAt', sortOrder: 'DESC' }),
          meetingsApi.list({ limit: '5', sortBy: 'meetingDate', sortOrder: 'DESC' }),
          contractsApi.dashboard(),
        ]);

        if (taskRes.status === 'fulfilled') {
          setRecentTasks(taskRes.value.data || []);
          setStats((s) => ({ ...s, tasks: taskRes.value.meta?.total || 0 }));
        }
        if (meetingRes.status === 'fulfilled') {
          setRecentMeetings(meetingRes.value.data || []);
          setStats((s) => ({ ...s, meetings: meetingRes.value.meta?.total || 0 }));
        }
        if (contractRes.status === 'fulfilled') {
          setStats((s) => ({ ...s, contracts: contractRes.value.total || 0 }));
        }
      } catch {
        // Dashboard is best-effort
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/tasks">
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.tasks}</p>
                <p className="text-sm text-gray-500">전체 업무</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/meetings">
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.meetings}</p>
                <p className="text-sm text-gray-500">전체 회의록</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/contracts">
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.contracts}</p>
                <p className="text-sm text-gray-500">전체 계약</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="최근 업무"
          action={
            <Link href="/tasks" className="text-sm text-primary-600 hover:text-primary-700">
              전체보기
            </Link>
          }
        >
          {loading ? (
            <p className="text-sm text-gray-400">불러오는 중...</p>
          ) : recentTasks.length === 0 ? (
            <p className="text-sm text-gray-400">등록된 업무가 없습니다.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentTasks.map((task: any) => (
                <li key={task.id} className="py-3 first:pt-0 last:pb-0">
                  <Link href={`/tasks/${task.id}`} className="flex items-center justify-between hover:opacity-70">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                      <p className="text-xs text-gray-500">
                        {task.year}년 {task.weekNumber}주차
                      </p>
                    </div>
                    <Badge color={getStatusColor(task.status)}>
                      {getStatusLabel(task.status)}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="최근 회의록"
          action={
            <Link href="/meetings" className="text-sm text-primary-600 hover:text-primary-700">
              전체보기
            </Link>
          }
        >
          {loading ? (
            <p className="text-sm text-gray-400">불러오는 중...</p>
          ) : recentMeetings.length === 0 ? (
            <p className="text-sm text-gray-400">등록된 회의록이 없습니다.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentMeetings.map((meeting: any) => (
                <li key={meeting.id} className="py-3 first:pt-0 last:pb-0">
                  <Link href={`/meetings/${meeting.id}`} className="flex items-center justify-between hover:opacity-70">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{meeting.title}</p>
                      <p className="text-xs text-gray-500">{formatDate(meeting.meetingDate)}</p>
                    </div>
                    <Badge color={getStatusColor(meeting.status)}>
                      {getStatusLabel(meeting.status)}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
