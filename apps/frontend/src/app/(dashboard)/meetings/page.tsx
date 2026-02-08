'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { meetingsApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { getStatusColor, getStatusLabel, formatDate } from '@/lib/utils';

type ViewMode = 'card' | 'table';

const MEETING_TYPE_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'regular', label: '정기 회의' },
  { value: 'adhoc', label: '임시 회의' },
  { value: 'review', label: '리뷰 회의' },
  { value: 'retrospective', label: '회고' },
];

const STATUS_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'draft', label: '초안' },
  { value: 'published', label: '발행됨' },
];

function getMeetingTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    regular: '정기 회의',
    adhoc: '임시 회의',
    review: '리뷰 회의',
    retrospective: '회고',
  };
  return labels[type] || type;
}

export default function MeetingsPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<any>({});
  const [viewMode, setViewMode] = useState<ViewMode>('card');

  const [filters, setFilters] = useState({
    meetingType: '',
    status: '',
    startDate: '',
    endDate: '',
    search: '',
    page: 1,
    limit: 12,
  });

  useEffect(() => {
    const savedView = localStorage.getItem('msspbiz_meetings_view') as ViewMode;
    if (savedView === 'card' || savedView === 'table') {
      setViewMode(savedView);
    }
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('msspbiz_meetings_view', mode);
  };

  const loadMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(filters.page),
        limit: String(filters.limit),
        sortBy: 'meetingDate',
        sortOrder: 'DESC',
      };

      if (filters.meetingType) params.meetingType = filters.meetingType;
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.search) params.search = filters.search;

      const result = await meetingsApi.list(params);
      setMeetings(result.data || []);
      setMeta(result.meta || {});
    } catch (error) {
      console.error('Failed to load meetings', error);
      toast.error('회의록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [filters.page, filters.limit, filters.meetingType, filters.status, filters.startDate, filters.endDate, filters.search]);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, page: 1 }));
    loadMeetings();
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">회의록</h1>
          <p className="text-sm text-gray-500 mt-1">
            전체 {meta.total || 0}개
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-md p-1 border-2 border-gray-800">
            <button
              onClick={() => handleViewModeChange('card')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
                viewMode === 'card'
                  ? 'bg-white text-gray-900 shadow-brutal-sm border-2 border-gray-800'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="카드 뷰"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => handleViewModeChange('table')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
                viewMode === 'table'
                  ? 'bg-white text-gray-900 shadow-brutal-sm border-2 border-gray-800'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="테이블 뷰"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
          <Button onClick={() => router.push('/meetings/new')}>
            + 새 회의록
          </Button>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              label="회의 유형"
              options={MEETING_TYPE_OPTIONS}
              value={filters.meetingType}
              onChange={(e) => handleFilterChange('meetingType', e.target.value)}
            />
            <Select
              label="상태"
              options={STATUS_OPTIONS}
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            />
            <Input
              type="date"
              label="시작일"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
            <Input
              type="date"
              label="종료일"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="제목 검색..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="flex-1"
            />
            <Button type="submit">검색</Button>
          </div>
        </form>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-400">불러오는 중...</p>
        </div>
      ) : meetings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">등록된 회의록이 없습니다.</p>
        </div>
      ) : (
        <>
          {viewMode === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {meetings.map((meeting) => (
                <Card
                  key={meeting.id}
                  className="cursor-pointer hover:shadow-brutal-hover hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-150"
                  onClick={() => router.push(`/meetings/${meeting.id}`)}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-semibold text-gray-900 line-clamp-2">
                        {meeting.title}
                      </h3>
                      <Badge color={getStatusColor(meeting.status)}>
                        {getStatusLabel(meeting.status)}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{formatDate(meeting.meetingDate)}</span>
                      </div>

                      {meeting.location && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{meeting.location}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <Badge color="bg-blue-100 text-blue-800">
                          {getMeetingTypeLabel(meeting.meetingType)}
                        </Badge>
                        {meeting.attendees && meeting.attendees.length > 0 && (
                          <span className="text-xs text-gray-500">
                            참석자 {meeting.attendees.length}명
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y-2 divide-gray-800">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        제목
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        유형
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        날짜
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        장소
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        참석자
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y-2 divide-gray-800">
                    {meetings.map((meeting) => (
                      <tr
                        key={meeting.id}
                        onClick={() => router.push(`/meetings/${meeting.id}`)}
                        className="hover:bg-gray-100 cursor-pointer transition-all duration-150"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{meeting.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge color="bg-blue-100 text-blue-800">
                            {getMeetingTypeLabel(meeting.meetingType)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(meeting.meetingDate)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{meeting.location || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {meeting.attendees && meeting.attendees.length > 0 ? `${meeting.attendees.length}명` : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge color={getStatusColor(meeting.status)}>
                            {getStatusLabel(meeting.status)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t-2 border-gray-800">
              <div className="text-sm text-gray-700">
                전체 {meta.total}개 중 {(filters.page - 1) * filters.limit + 1}-
                {Math.min(filters.page * filters.limit, meta.total)}개 표시
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={filters.page === 1}
                  onClick={() => handlePageChange(filters.page - 1)}
                >
                  이전
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                    <Button
                      key={p}
                      variant={p === filters.page ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => handlePageChange(p)}
                    >
                      {p}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={filters.page === meta.totalPages}
                  onClick={() => handlePageChange(filters.page + 1)}
                >
                  다음
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
