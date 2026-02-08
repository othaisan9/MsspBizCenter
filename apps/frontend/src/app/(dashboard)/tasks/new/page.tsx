'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { tasksApi, usersApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { getWeekNumber } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function NewTaskPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const currentWeek = getWeekNumber(new Date());

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    weekNumber: currentWeek,
    year: currentYear,
    status: 'pending',
    priority: 'medium',
    dueDate: '',
    estimatedHours: '',
    tags: '',
    assigneeId: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const statusOptions = [
    { value: 'pending', label: '대기' },
    { value: 'in_progress', label: '진행 중' },
    { value: 'review', label: '검토' },
    { value: 'completed', label: '완료' },
    { value: 'cancelled', label: '취소' },
  ];

  const priorityOptions = [
    { value: 'critical', label: '긴급' },
    { value: 'high', label: '높음' },
    { value: 'medium', label: '보통' },
    { value: 'low', label: '낮음' },
  ];

  const tagPresets = [
    '보안관제',
    '취약점진단',
    '모의해킹',
    '컨설팅',
    '인증심사',
    '교육',
    '보고서',
    '영업',
    '미팅',
    '기술지원',
    '유지보수',
    '개발',
  ];

  const fetchUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const data = await usersApi.list();
      setUsers(data.items || data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleTagPresetToggle = (preset: string) => {
    const currentTags = formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (currentTags.includes(preset)) {
      const newTags = currentTags.filter((t) => t !== preset);
      handleChange('tags', newTags.join(', '));
    } else {
      const newTags = [...currentTags, preset];
      handleChange('tags', newTags.join(', '));
    }
  };

  const isPresetSelected = (preset: string) => {
    const currentTags = formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    return currentTags.includes(preset);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '제목을 입력해주세요.';
    } else if (formData.title.length > 200) {
      newErrors.title = '제목은 200자 이내로 입력해주세요.';
    }

    if (!formData.weekNumber || formData.weekNumber < 1 || formData.weekNumber > 53) {
      newErrors.weekNumber = '주차는 1-53 사이의 값이어야 합니다.';
    }

    if (!formData.year || formData.year < 2020 || formData.year > 2030) {
      newErrors.year = '년도는 2020-2030 사이의 값이어야 합니다.';
    }

    if (formData.estimatedHours && parseFloat(formData.estimatedHours) < 0) {
      newErrors.estimatedHours = '예상 시간은 0 이상이어야 합니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);
      setError('');

      const payload: any = {
        title: formData.title.trim(),
        weekNumber: formData.weekNumber,
        year: formData.year,
        status: formData.status,
        priority: formData.priority,
      };

      if (formData.description.trim()) {
        payload.description = formData.description.trim();
      }

      if (formData.dueDate) {
        payload.dueDate = new Date(formData.dueDate).toISOString();
      }

      if (formData.estimatedHours) {
        payload.estimatedHours = parseFloat(formData.estimatedHours);
      }

      if (formData.tags.trim()) {
        payload.tags = formData.tags
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t.length > 0);
      }

      if (formData.assigneeId) {
        payload.assigneeId = formData.assigneeId;
      }

      await tasksApi.create(payload);
      toast.success('업무가 생성되었습니다.');
      router.push('/tasks');
    } catch (err: any) {
      console.error('Task creation error:', err);
      const message = err.message || '업무 생성에 실패했습니다.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const userOptions = users.map((user) => ({
    value: user.id,
    label: `${user.name} (${user.role})`,
  }));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[
          { label: '업무 관리', href: '/tasks' },
          { label: '새 업무' },
        ]}
      />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">새 업무 생성</h1>
        <p className="mt-1 text-sm text-gray-600">
          주차별 업무 정보를 입력하세요.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <Input
              label="제목"
              placeholder="업무 제목을 입력하세요"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              error={errors.title}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설명
              </label>
              <textarea
                rows={4}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="업무 내용을 상세히 입력하세요"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                type="number"
                label="년도"
                value={formData.year}
                onChange={(e) => handleChange('year', parseInt(e.target.value) || currentYear)}
                error={errors.year}
                min={2020}
                max={2030}
                required
              />
              <Input
                type="number"
                label="주차"
                value={formData.weekNumber}
                onChange={(e) => handleChange('weekNumber', parseInt(e.target.value) || 1)}
                error={errors.weekNumber}
                min={1}
                max={53}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Select
                label="상태"
                options={statusOptions}
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                required
              />
              <Select
                label="우선순위"
                options={priorityOptions}
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                type="date"
                label="마감일"
                value={formData.dueDate}
                onChange={(e) => handleChange('dueDate', e.target.value)}
                error={errors.dueDate}
              />
              <Input
                type="number"
                label="예상 시간 (시간)"
                placeholder="예: 8"
                value={formData.estimatedHours}
                onChange={(e) => handleChange('estimatedHours', e.target.value)}
                error={errors.estimatedHours}
                min={0}
                step="0.5"
              />
            </div>

            <Select
              label="담당자"
              options={[
                { value: '', label: '담당자 선택 (선택사항)' },
                ...userOptions,
              ]}
              value={formData.assigneeId}
              onChange={(e) => handleChange('assigneeId', e.target.value)}
              disabled={usersLoading}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                태그
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {tagPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleTagPresetToggle(preset)}
                    className={`px-3 py-1 rounded-full text-sm border cursor-pointer transition-colors ${
                      isPresetSelected(preset)
                        ? 'bg-primary-100 text-primary-700 border-primary-300'
                        : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <Input
                placeholder="태그를 쉼표로 구분하여 입력하세요 (예: 개발, 긴급)"
                value={formData.tags}
                onChange={(e) => handleChange('tags', e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                loading={loading}
                disabled={loading}
              >
                생성하기
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/tasks')}
                disabled={loading}
              >
                취소
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
