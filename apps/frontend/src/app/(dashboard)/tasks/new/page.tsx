'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { tasksApi, usersApi, tagsApi } from '@/lib/api';
import type { TagResponse } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { MarkdownEditor } from '@/components/ui/MarkdownEditor';
import { getWeekNumber } from '@/lib/utils';
import { AiButton, AiStreamPanel } from '@/components/ai';
import { useAiGenerate } from '@/hooks/useAiGenerate';

import type { UserResponse } from '@msspbiz/shared';

type User = UserResponse;

export default function NewTaskPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [tagPresets, setTagPresets] = useState<string[]>([]);

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

  const { result: aiResult, loading: aiLoading, error: aiError, generate: aiGenerate, reset: aiReset } = useAiGenerate();

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

  const fetchTags = useCallback(async () => {
    try {
      const data = await tagsApi.list();
      setTagPresets((data || []).map((t: TagResponse) => t.name));
    } catch {
      setTagPresets([]);
    }
  }, []);

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
    fetchTags();
  }, [fetchUsers, fetchTags]);

  const handleChange = useCallback((field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

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

  const handleAiGenerate = useCallback(async () => {
    if (!formData.title.trim()) {
      toast.error('제목을 먼저 입력해주세요.');
      return;
    }
    const tags = formData.tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
    try {
      await aiGenerate('/ai/generate-task-desc', {
        title: formData.title.trim(),
        tags: tags.length > 0 ? tags : undefined,
        priority: formData.priority,
      });
    } catch {
      // Error handled by hook
    }
  }, [formData.title, formData.tags, formData.priority, aiGenerate]);

  const handleAiAccept = useCallback(() => {
    if (aiResult?.text) {
      handleChange('description', aiResult.text);
      aiReset();
    }
  }, [aiResult, aiReset, handleChange]);

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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <div className="mb-4 p-4 bg-red-50 border-2 border-red-700 rounded-md shadow-brutal-sm">
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">설명</label>
                <AiButton onClick={handleAiGenerate} loading={aiLoading} label="AI 생성" size="sm" />
              </div>

              {aiResult?.text || aiError ? (
                <div className="mb-3">
                  <AiStreamPanel
                    content={aiResult?.text || ''}
                    loading={aiLoading}
                    error={aiError}
                    onAccept={handleAiAccept}
                    onRegenerate={handleAiGenerate}
                    onClose={aiReset}
                    title="AI 생성 결과"
                  />
                </div>
              ) : null}

              <MarkdownEditor
                placeholder="업무 내용을 상세히 입력하세요"
                value={formData.description}
                onChange={(val) => handleChange('description', val)}
                minHeight="150px"
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
                    className={`px-3 py-1 rounded-md text-sm border-2 cursor-pointer transition-all duration-150 ${
                      isPresetSelected(preset)
                        ? 'bg-primary-100 text-primary-800 border-primary-700 shadow-brutal-sm'
                        : 'bg-gray-100 text-gray-700 border-gray-800 hover:bg-gray-200'
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
