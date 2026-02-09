'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { tasksApi, usersApi, aiApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { AiButton, AiStreamPanel } from '@/components/ai';
import { useAiStream } from '@/hooks/useAiStream';
import {
  getStatusColor,
  getStatusLabel,
  getPriorityColor,
  getPriorityLabel,
  formatDate,
  getWeekNumber,
} from '@/lib/utils';
import type { TaskResponse } from '@msspbiz/shared';

interface ExtractedTask {
  title: string;
  description: string;
  priority: string;
  tags: string[];
  selected: boolean;
}

type Task = TaskResponse;

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
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  // AI 주간 보고서
  const { content: reportContent, loading: reportLoading, error: reportError, start: startReport, reset: resetReport } = useAiStream();

  // 보고서 → 업무 추출
  const [extractedTasks, setExtractedTasks] = useState<ExtractedTask[]>([]);
  const [extractLoading, setExtractLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

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

  const handleWeeklyReport = useCallback(() => {
    setExtractedTasks([]);
    startReport('/ai/weekly-report', {
      year: filters.year,
      weekNumber: filters.weekNumber,
    });
  }, [startReport, filters.year, filters.weekNumber]);

  const handleExtractTasks = useCallback(async () => {
    if (!reportContent) return;
    try {
      setExtractLoading(true);
      const plainText = reportContent.replace(/<[^>]*>/g, '').trim();
      const result = await aiApi.extractWeeklyTasks({
        reportText: plainText,
        year: filters.year,
        weekNumber: filters.weekNumber,
      });
      setExtractedTasks(
        (result.tasks || []).map((t) => ({ ...t, selected: true })),
      );
      if (result.tasks.length === 0) {
        toast.info('추출된 업무가 없습니다.');
      }
    } catch (err: any) {
      toast.error(err.message || '업무 추출에 실패했습니다.');
    } finally {
      setExtractLoading(false);
    }
  }, [reportContent, filters.year, filters.weekNumber]);

  const handleToggleTask = useCallback((index: number) => {
    setExtractedTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, selected: !t.selected } : t)),
    );
  }, []);

  const handleRemoveExtractedTask = useCallback((index: number) => {
    setExtractedTasks((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleCreateExtractedTasks = useCallback(async () => {
    const selected = extractedTasks.filter((t) => t.selected);
    if (selected.length === 0) {
      toast.error('생성할 업무를 선택해주세요.');
      return;
    }

    const nextWeek = filters.weekNumber >= 53 ? 1 : filters.weekNumber + 1;
    const nextYear = filters.weekNumber >= 53 ? filters.year + 1 : filters.year;

    try {
      setCreateLoading(true);
      let created = 0;
      for (const task of selected) {
        await tasksApi.create({
          title: task.title,
          description: task.description,
          priority: task.priority,
          tags: task.tags,
          weekNumber: nextWeek,
          year: nextYear,
          status: 'pending',
          ...(user?.id ? { assigneeId: user.id } : {}),
        });
        created++;
      }
      toast.success(`${created}개 업무가 ${nextYear}년 ${nextWeek}주차에 생성되었습니다.`);
      setExtractedTasks([]);
      // 다음 주차로 필터 이동 후 새로고침
      setFilters((prev) => ({ ...prev, year: nextYear, weekNumber: nextWeek, page: 1 }));
    } catch (err: any) {
      toast.error(err.message || '업무 생성에 실패했습니다.');
    } finally {
      setCreateLoading(false);
    }
  }, [extractedTasks, filters.weekNumber, filters.year, user?.id]);

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
            <AiButton onClick={handleWeeklyReport} loading={reportLoading} label="주간 보고서" size="md" />
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

      {/* 주간 보고서 */}
      {(reportContent || reportLoading || reportError) && (
        <div className="mb-4">
          <AiStreamPanel
            content={reportContent}
            loading={reportLoading}
            error={reportError}
            onRegenerate={handleWeeklyReport}
            onClose={() => { resetReport(); setExtractedTasks([]); }}
            title={`${filters.year}년 ${filters.weekNumber}주차 주간 보고서`}
          />
          {/* 보고서 완료 후 업무 추출 버튼 */}
          {reportContent && !reportLoading && !reportError && extractedTasks.length === 0 && (
            <div className="mt-2 flex justify-end">
              <Button
                size="sm"
                variant="secondary"
                loading={extractLoading}
                disabled={extractLoading}
                onClick={handleExtractTasks}
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                다음 주 업무 추출
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 추출된 업무 미리보기 */}
      {extractedTasks.length > 0 && (
        <div className="mb-4 bg-emerald-50 border-2 border-emerald-600 rounded-md p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-emerald-900">
              다음 주 업무 미리보기 ({extractedTasks.filter((t) => t.selected).length}/{extractedTasks.length}개 선택)
            </h3>
            <button
              onClick={() => setExtractedTasks([])}
              className="text-emerald-600 hover:text-emerald-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-2">
            {extractedTasks.map((task, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 p-3 rounded-md border-2 transition-all duration-150 ${
                  task.selected
                    ? 'bg-white border-emerald-400'
                    : 'bg-gray-50 border-gray-300 opacity-60'
                }`}
              >
                <input
                  type="checkbox"
                  checked={task.selected}
                  onChange={() => handleToggleTask(idx)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{task.title}</span>
                    <Badge color={getPriorityColor(task.priority)}>
                      {getPriorityLabel(task.priority)}
                    </Badge>
                  </div>
                  {task.description && (
                    <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                  )}
                  {task.tags.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {task.tags.map((tag) => (
                        <span key={tag} className="text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveExtractedTask(idx)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-emerald-300">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExtractedTasks([])}
              disabled={createLoading}
            >
              취소
            </Button>
            <Button
              size="sm"
              loading={createLoading}
              disabled={createLoading || extractedTasks.filter((t) => t.selected).length === 0}
              onClick={handleCreateExtractedTasks}
            >
              {extractedTasks.filter((t) => t.selected).length}개 업무 생성
            </Button>
          </div>
        </div>
      )}

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
                      완료 예정일
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
                            {task.description.replace(/<[^>]*>/g, '').trim() || ''}
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
