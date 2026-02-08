'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { tasksApi, usersApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import {
  getStatusColor,
  getStatusLabel,
  getPriorityColor,
  getPriorityLabel,
  formatDate,
  getWeekNumber,
} from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description?: string;
  weekNumber: number;
  year: number;
  status: string;
  priority: string;
  assigneeId?: string;
  assignee?: { id: string; name: string };
  dueDate?: string;
  estimatedHours?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface TasksResponse {
  data: Task[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  const currentYear = new Date().getFullYear();
  const currentWeek = getWeekNumber(new Date());

  const [members, setMembers] = useState<Array<{ id: string; name: string }>>([]);

  const [filters, setFilters] = useState({
    year: currentYear,
    weekNumber: currentWeek,
    status: '',
    priority: '',
    assigneeId: '',
    search: '',
    page: 1,
    limit: 20,
  });

  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  const statusOptions = [
    { value: '', label: '전체 상태' },
    { value: 'pending', label: '대기' },
    { value: 'in_progress', label: '진행 중' },
    { value: 'review', label: '검토' },
    { value: 'completed', label: '완료' },
    { value: 'cancelled', label: '취소' },
  ];

  const priorityOptions = [
    { value: '', label: '전체 우선순위' },
    { value: 'critical', label: '긴급' },
    { value: 'high', label: '높음' },
    { value: 'medium', label: '보통' },
    { value: 'low', label: '낮음' },
  ];

  useEffect(() => {
    async function loadMembers() {
      try {
        const result = await usersApi.list();
        const items = result.items || result || [];
        setMembers(items.map((u: any) => ({ id: u.id, name: u.name })));
      } catch {
        // 팀원 로드 실패는 무시 (필터만 비활성화)
      }
    }
    loadMembers();
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params: Record<string, string> = {
        year: filters.year.toString(),
        weekNumber: filters.weekNumber.toString(),
        page: filters.page.toString(),
        limit: filters.limit.toString(),
      };

      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.assigneeId) params.assigneeId = filters.assigneeId;
      if (filters.search) params.search = filters.search;

      const response: TasksResponse = await tasksApi.list(params);
      setTasks(response.data);
      setMeta(response.meta);
    } catch (err: any) {
      const message = err.message || '업무 목록을 불러오는 데 실패했습니다.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [filters.year, filters.weekNumber, filters.page, filters.limit, filters.status, filters.priority, filters.assigneeId, filters.search]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleRowClick = (id: string) => {
    router.push(`/tasks/${id}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">주차별 업무</h1>
            <p className="mt-1 text-sm text-gray-600">
              {filters.year}년 {filters.weekNumber}주차 업무 목록
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex bg-gray-100 rounded-md p-1 border-2 border-gray-800">
              <button
                onClick={() => setViewMode('list')}
                className={`
                  px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150
                  ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-brutal-sm border-2 border-gray-800' : 'text-gray-600 hover:text-gray-900'}
                `}
              >
                <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                목록
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`
                  px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150
                  ${viewMode === 'kanban' ? 'bg-white text-gray-900 shadow-brutal-sm border-2 border-gray-800' : 'text-gray-600 hover:text-gray-900'}
                `}
              >
                <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                칸반
              </button>
            </div>
            <Button onClick={() => router.push('/tasks/new')}>
              새 업무
            </Button>
          </div>
        </div>

        <Card>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <Input
              type="number"
              label="년도"
              value={filters.year}
              onChange={(e) => handleFilterChange('year', parseInt(e.target.value) || currentYear)}
              min={2020}
              max={2030}
            />
            <Input
              type="number"
              label="주차"
              value={filters.weekNumber}
              onChange={(e) => handleFilterChange('weekNumber', parseInt(e.target.value) || 1)}
              min={1}
              max={53}
            />
            <Select
              label="상태"
              options={statusOptions}
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            />
            <Select
              label="우선순위"
              options={priorityOptions}
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
            />
            <Select
              label="담당자"
              options={[
                { value: '', label: '전체 담당자' },
                ...members.map((m) => ({ value: m.id, label: m.name })),
              ]}
              value={filters.assigneeId}
              onChange={(e) => handleFilterChange('assigneeId', e.target.value)}
            />
            <Input
              type="text"
              label="검색"
              placeholder="제목으로 검색..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
        </Card>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-2 border-red-700 rounded-md shadow-brutal-sm">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {viewMode === 'kanban' ? (
        <div className="bg-white rounded-md shadow-brutal border-2 border-gray-800 p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
              <p className="mt-2 text-sm text-gray-500">로딩 중...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">업무가 없습니다.</p>
              <Button
                variant="secondary"
                className="mt-4"
                onClick={() => router.push('/tasks/new')}
              >
                첫 업무 생성하기
              </Button>
            </div>
          ) : (
            <KanbanBoard tasks={tasks} onTasksUpdate={fetchTasks} />
          )}
        </div>
      ) : (
        <Card>
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            <p className="mt-2 text-sm text-gray-500">로딩 중...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">업무가 없습니다.</p>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => router.push('/tasks/new')}
            >
              첫 업무 생성하기
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y-2 divide-gray-800">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      제목
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      우선순위
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      담당자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      마감일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      예상 시간
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y-2 divide-gray-800">
                  {tasks.map((task) => (
                    <tr
                      key={task.id}
                      onClick={() => handleRowClick(task.id)}
                      className="hover:bg-gray-100 cursor-pointer transition-all duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{task.title}</div>
                        {task.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {task.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge color={getStatusColor(task.status)}>
                          {getStatusLabel(task.status)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge color={getPriorityColor(task.priority)}>
                          {getPriorityLabel(task.priority)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.assignee?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.dueDate ? formatDate(task.dueDate) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.estimatedHours ? `${task.estimatedHours}시간` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t-2 border-gray-800">
                <div className="text-sm text-gray-700">
                  전체 {meta.total}개 중 {(meta.page - 1) * meta.limit + 1}-
                  {Math.min(meta.page * meta.limit, meta.total)}개 표시
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={meta.page === 1}
                    onClick={() => handlePageChange(meta.page - 1)}
                  >
                    이전
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={page === meta.page ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={meta.page === meta.totalPages}
                    onClick={() => handlePageChange(meta.page + 1)}
                  >
                    다음
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
        </Card>
      )}
    </div>
  );
}
