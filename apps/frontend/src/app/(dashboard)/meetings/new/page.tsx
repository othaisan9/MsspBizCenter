'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { meetingsApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { MarkdownEditor } from '@/components/ui/MarkdownEditor';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

const API_BASE =
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:4001`
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001');
const API_PREFIX = '/api/v1';

const MEETING_TYPE_OPTIONS = [
  { value: 'regular', label: '정기 회의' },
  { value: 'adhoc', label: '임시 회의' },
  { value: 'review', label: '리뷰' },
  { value: 'retrospective', label: '회고' },
];

const LOCATION_OPTIONS = [
  { value: '', label: '선택하세요' },
  { value: '회의실 A', label: '📍 회의실 A' },
  { value: '회의실 B', label: '📍 회의실 B' },
  { value: '회의실 C', label: '📍 회의실 C' },
  { value: '온라인 (Zoom)', label: '💻 온라인 (Zoom)' },
  { value: '온라인 (Google Meet)', label: '💻 온라인 (Google Meet)' },
  { value: '온라인 (Teams)', label: '💻 온라인 (Teams)' },
  { value: '기타', label: '🏢 기타' },
];

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

interface ActionItem {
  title: string;
  assigneeId: string;
  dueDate: string;
}

export default function NewMeetingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    meetingDate: new Date().toISOString().split('T')[0],
    meetingTime: '14:00',
    location: '',
    meetingType: 'regular',
    agendaText: '',
    content: '',
    decisionsText: '',
    status: 'draft',
  });

  const [attendeeIds, setAttendeeIds] = useState<string[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([
    { title: '', assigneeId: '', dueDate: '' },
  ]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${API_BASE}${API_PREFIX}/users`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch users');
        }

        const data = await res.json();
        setUsers(data.items || []);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        toast.error('사용자 목록을 불러올 수 없습니다.');
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleAttendeeToggle = useCallback((userId: string) => {
    setAttendeeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }, []);

  const handleActionItemChange = useCallback(
    (index: number, field: keyof ActionItem, value: string) => {
      setActionItems((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    },
    []
  );

  const addActionItem = useCallback(() => {
    setActionItems((prev) => [...prev, { title: '', assigneeId: '', dueDate: '' }]);
  }, []);

  const removeActionItem = useCallback((index: number) => {
    setActionItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('제목을 입력하세요.');
      return;
    }

    if (!formData.meetingDate) {
      setError('회의 날짜를 선택하세요.');
      return;
    }

    if (!formData.meetingTime) {
      setError('회의 시간을 선택하세요.');
      return;
    }

    if (!formData.location) {
      setError('장소를 선택하세요.');
      return;
    }

    if (attendeeIds.length === 0) {
      setError('참석자를 최소 1명 이상 선택하세요.');
      return;
    }

    if (!formData.agendaText.trim()) {
      setError('주요 안건을 입력하세요.');
      return;
    }

    setLoading(true);
    try {
      // Combine date and time to ISO 8601
      const meetingDate = new Date(
        `${formData.meetingDate}T${formData.meetingTime}`
      ).toISOString();

      // Parse agenda from text (line-separated)
      const agenda = formData.agendaText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => ({ title: line, description: '' }));

      // Parse decisions from text (line-separated)
      const decisions =
        formData.decisionsText.trim().length > 0
          ? formData.decisionsText
              .split('\n')
              .map((line) => line.trim())
              .filter((line) => line.length > 0)
              .map((line) => ({ title: line, description: '' }))
          : undefined;

      const payload: any = {
        title: formData.title.trim(),
        meetingDate,
        location: formData.location,
        meetingType: formData.meetingType,
        agenda,
        content: formData.content.trim() || undefined,
        decisions,
        attendeeIds,
        status: formData.status,
      };

      const createdMeeting = await meetingsApi.create(payload);

      // Create action items
      const validActionItems = actionItems.filter((item) => item.title.trim().length > 0);
      for (const item of validActionItems) {
        const actionPayload: any = {
          title: item.title.trim(),
        };
        if (item.assigneeId) {
          actionPayload.assigneeId = item.assigneeId;
        }
        if (item.dueDate) {
          actionPayload.dueDate = new Date(item.dueDate).toISOString();
        }
        await meetingsApi.createActionItem(createdMeeting.id, actionPayload);
      }

      // Publish if status is published
      if (formData.status === 'published') {
        await meetingsApi.publish(createdMeeting.id);
      }

      toast.success('회의록이 생성되었습니다.');
      router.push('/meetings');
    } catch (err: any) {
      console.error('Meeting creation error:', err);
      const message = err.message || '회의록 생성에 실패했습니다.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const activeUsers = users.filter((u) => u.isActive);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Breadcrumb
        items={[
          { label: '회의록', href: '/meetings' },
          { label: '새 회의록' },
        ]}
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">새 회의록 작성</h1>
          <p className="text-sm text-gray-500 mt-1">회의록 정보를 입력하세요.</p>
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-800"
        >
          ← 목록으로
        </button>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border-2 border-red-700 text-red-800 px-4 py-3 rounded-md shadow-brutal-sm">
              {error}
            </div>
          )}

          {/* 제목 */}
          <Input
            label="회의 제목"
            name="title"
            type="text"
            required
            maxLength={255}
            placeholder="회의 제목을 입력하세요"
            value={formData.title}
            onChange={handleChange}
          />

          {/* 일시 & 장소 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="회의 날짜"
              name="meetingDate"
              type="date"
              required
              value={formData.meetingDate}
              onChange={handleChange}
            />

            <Input
              label="시작 시간"
              name="meetingTime"
              type="time"
              required
              value={formData.meetingTime}
              onChange={handleChange}
            />

            <Select
              label="장소"
              name="location"
              options={LOCATION_OPTIONS}
              value={formData.location}
              onChange={handleChange}
              required
            />
          </div>

          {/* 회의 유형 */}
          <Select
            label="회의 유형"
            name="meetingType"
            options={MEETING_TYPE_OPTIONS}
            value={formData.meetingType}
            onChange={handleChange}
          />

          {/* 참석자 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              참석자 <span className="text-red-500">*</span>
            </label>
            {loadingUsers ? (
              <div className="text-sm text-gray-500">사용자 목록을 불러오는 중...</div>
            ) : activeUsers.length === 0 ? (
              <div className="text-sm text-gray-500">등록된 사용자가 없습니다.</div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
                  {activeUsers.map((user) => (
                    <label
                      key={user.id}
                      className={`flex items-start gap-2 p-3 border-2 rounded-md cursor-pointer transition-all duration-150 ${
                        attendeeIds.includes(user.id)
                          ? 'border-primary-700 bg-primary-50 shadow-brutal-sm'
                          : 'border-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-primary-600 mt-0.5"
                        checked={attendeeIds.includes(user.id)}
                        onChange={() => handleAttendeeToggle(user.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {user.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{user.email}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  총 <strong>{attendeeIds.length}</strong>명 참석
                </p>
              </>
            )}
          </div>

          {/* 주요 안건 */}
          <Textarea
            label="주요 안건"
            name="agendaText"
            rows={6}
            required
            placeholder={`회의에서 논의할 주요 안건을 작성하세요\n\n예시:\n1. 이번 주 Sprint 진행 현황 공유\n2. Backend API 개발 이슈 논의\n3. 다음 주 일정 계획`}
            value={formData.agendaText}
            onChange={handleChange}
          />

          {/* 회의 내용 */}
          <MarkdownEditor
            label="회의 내용 / 논의 사항"
            placeholder="회의에서 논의된 내용을 상세히 기록하세요"
            value={formData.content}
            onChange={(val) => setFormData((prev) => ({ ...prev, content: val }))}
          />

          {/* Action Items */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action Items
            </label>
            <div className="space-y-3 mb-3">
              {actionItems.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 border-2 border-gray-800 rounded-md px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm shadow-brutal-sm"
                    placeholder="할 일을 입력하세요"
                    value={item.title}
                    onChange={(e) =>
                      handleActionItemChange(index, 'title', e.target.value)
                    }
                  />
                  <select
                    className="border-2 border-gray-800 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 text-sm shadow-brutal-sm"
                    value={item.assigneeId}
                    onChange={(e) =>
                      handleActionItemChange(index, 'assigneeId', e.target.value)
                    }
                  >
                    <option value="">담당자</option>
                    {activeUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    className="border-2 border-gray-800 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 text-sm shadow-brutal-sm"
                    value={item.dueDate}
                    onChange={(e) =>
                      handleActionItemChange(index, 'dueDate', e.target.value)
                    }
                  />
                  <button
                    type="button"
                    onClick={() => removeActionItem(index)}
                    className="text-red-500 hover:text-red-700 px-2"
                    disabled={actionItems.length === 1}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addActionItem}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              + Action Item 추가
            </button>
          </div>

          {/* 결정사항 */}
          <Textarea
            label="결정사항"
            name="decisionsText"
            rows={4}
            placeholder={`회의에서 결정된 사항을 기록하세요\n\n예시:\n✅ NestJS + Next.js로 기술 스택 확정\n✅ SSO 방식으로 미시시피와 통합`}
            value={formData.decisionsText}
            onChange={handleChange}
          />

          {/* 상태 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상태 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label
                className={`flex items-center gap-2 p-4 border-2 rounded-md cursor-pointer transition-all duration-150 shadow-brutal-sm ${
                  formData.status === 'draft'
                    ? 'border-primary-700 bg-primary-50'
                    : 'border-gray-800 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value="draft"
                  className="w-4 h-4 text-primary-600"
                  checked={formData.status === 'draft'}
                  onChange={handleChange}
                />
                <div>
                  <div className="font-medium">초안</div>
                  <div className="text-xs text-gray-500">작성 중, 미공개</div>
                </div>
              </label>
              <label
                className={`flex items-center gap-2 p-4 border-2 rounded-md cursor-pointer transition-all duration-150 shadow-brutal-sm ${
                  formData.status === 'published'
                    ? 'border-primary-700 bg-primary-50'
                    : 'border-gray-800 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value="published"
                  className="w-4 h-4 text-primary-600"
                  checked={formData.status === 'published'}
                  onChange={handleChange}
                />
                <div>
                  <div className="font-medium text-primary-700">발행</div>
                  <div className="text-xs text-primary-600">팀원에게 공개</div>
                </div>
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t-2 border-gray-800">
            <Button type="submit" loading={loading}>
              {formData.status === 'draft' ? '초안 저장' : '저장 및 발행'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              disabled={loading}
            >
              취소
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
