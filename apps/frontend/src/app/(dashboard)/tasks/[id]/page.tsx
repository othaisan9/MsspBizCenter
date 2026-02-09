'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { tasksApi, tagsApi, usersApi } from '@/lib/api';
import type { TagResponse } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { MarkdownEditor } from '@/components/ui/MarkdownEditor';
import { MarkdownViewer } from '@/components/ui/MarkdownViewer';
import {
  getStatusColor,
  getStatusLabel,
  getPriorityColor,
  getPriorityLabel,
  formatDate,
  formatDateTime,
} from '@/lib/utils';
import type { TaskResponse } from '@msspbiz/shared';
import { TaskStatus } from '@msspbiz/shared';

type Task = TaskResponse;

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tagPresets, setTagPresets] = useState<string[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string; role: string }>>([]);

  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    weekNumber: 1,
    year: new Date().getFullYear(),
    status: 'pending',
    priority: 'medium',
    dueDate: '',
    estimatedHours: '',
    tags: '',
    assigneeId: '',
  });

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

  const fetchTagPresets = useCallback(async () => {
    try {
      const data = await tagsApi.list();
      setTagPresets((data || []).map((t: TagResponse) => t.name));
    } catch {
      setTagPresets([]);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await usersApi.list();
      const items = data.items || data || [];
      setUsers(items.map((u: any) => ({ id: u.id, name: u.name, role: u.role })));
    } catch {
      setUsers([]);
    }
  }, []);

  useEffect(() => {
    fetchTask();
    fetchTagPresets();
    fetchUsers();
  }, [taskId, fetchTagPresets, fetchUsers]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await tasksApi.get(taskId);
      setTask(data);

      setEditForm({
        title: data.title || '',
        description: data.description || '',
        weekNumber: data.weekNumber || 1,
        year: data.year || new Date().getFullYear(),
        status: data.status || 'pending',
        priority: data.priority || 'medium',
        dueDate: data.dueDate ? data.dueDate.split('T')[0] : '',
        estimatedHours: data.estimatedHours?.toString() || '',
        tags: data.tags?.join(', ') || '',
        assigneeId: data.assignee?.id || '',
      });
    } catch (err: any) {
      console.error('Task fetch error:', err);
      const message = err.message || '업무를 불러오는 데 실패했습니다.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!task) return;

    try {
      await tasksApi.updateStatus(task.id, newStatus);
      setTask({ ...task, status: newStatus });
      toast.success('상태가 변경되었습니다.');
    } catch (err: any) {
      console.error('Status update error:', err);
      const message = err.message || '상태 변경에 실패했습니다.';
      setError(message);
      toast.error(message);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!task || !task.tags) return;

    const newTags = task.tags.filter((t) => t !== tagToRemove);
    try {
      const updated = await tasksApi.update(task.id, { tags: newTags });
      setTask(updated);
      setEditForm((prev) => ({ ...prev, tags: newTags.join(', ') }));
      toast.success(`태그 "${tagToRemove}"가 삭제되었습니다.`);
    } catch (err: any) {
      toast.error('태그 삭제에 실패했습니다.');
    }
  };

  const handleEdit = () => {
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!task) return;

    try {
      setSaving(true);
      setError('');

      const payload: any = {
        title: editForm.title.trim(),
        weekNumber: editForm.weekNumber,
        year: editForm.year,
        status: editForm.status,
        priority: editForm.priority,
      };

      if (editForm.description.trim()) {
        payload.description = editForm.description.trim();
      }

      if (editForm.dueDate) {
        payload.dueDate = new Date(editForm.dueDate).toISOString();
      }

      if (editForm.estimatedHours) {
        payload.estimatedHours = parseFloat(editForm.estimatedHours);
      }

      payload.tags = editForm.tags.trim()
        ? editForm.tags.split(',').map((t) => t.trim()).filter((t) => t.length > 0)
        : [];

      if (editForm.assigneeId) {
        payload.assigneeId = editForm.assigneeId;
      } else {
        payload.assigneeId = null;
      }

      const updated = await tasksApi.update(task.id, payload);
      setTask(updated);
      setEditModalOpen(false);
      toast.success('업무가 수정되었습니다.');
    } catch (err: any) {
      console.error('Task update error:', err);
      const message = err.message || '업무 수정에 실패했습니다.';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;

    try {
      setDeleting(true);
      await tasksApi.delete(task.id);
      toast.success('업무가 삭제되었습니다.');
      router.push('/tasks');
    } catch (err: any) {
      console.error('Task delete error:', err);
      const message = err.message || '업무 삭제에 실패했습니다.';
      setError(message);
      toast.error(message);
      setDeleteModalOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          <p className="mt-2 text-sm text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="p-4 bg-red-50 border-2 border-red-700 rounded-md shadow-brutal-sm">
          <p className="text-sm text-red-600">{error}</p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => router.push('/tasks')}
          >
            목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  if (!task) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[
          { label: '업무 관리', href: '/tasks' },
          { label: '업무 상세' },
        ]}
      />
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
            <p className="mt-1 text-sm text-gray-600">
              {task.year}년 {task.weekNumber}주차
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleEdit}>
              수정
            </Button>
            <Button variant="danger" onClick={() => setDeleteModalOpen(true)}>
              삭제
            </Button>
          </div>
        </div>

        {error && task && (
          <div className="mb-4 p-4 bg-red-50 border-2 border-red-700 rounded-md shadow-brutal-sm">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <Card title="기본 정보">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">상태</span>
              <Select
                options={statusOptions}
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                className="w-40"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">우선순위</span>
              <Badge color={getPriorityColor(task.priority)}>
                {getPriorityLabel(task.priority)}
              </Badge>
            </div>

            {task.assignee && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">담당자</span>
                <span className="text-sm text-gray-900">{task.assignee.name}</span>
              </div>
            )}

            {task.dueDate && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">완료 예정일</span>
                <span className="text-sm text-gray-900">{formatDate(task.dueDate)}</span>
              </div>
            )}

            {task.estimatedHours && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">예상 시간</span>
                <span className="text-sm text-gray-900">{task.estimatedHours}시간</span>
              </div>
            )}

            {task.tags && task.tags.length > 0 && (
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium text-gray-700">태그</span>
                <div className="flex flex-wrap gap-1">
                  {task.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemoveTag(tag); }}
                        className="ml-0.5 hover:text-red-600 transition-colors"
                        title={`"${tag}" 태그 삭제`}
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {task.description && (
          <Card title="설명">
            <MarkdownViewer content={task.description} />
          </Card>
        )}

        <Card title="메타 정보">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">생성일</span>
              <span className="text-gray-900">{formatDateTime(task.createdAt)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">수정일</span>
              <span className="text-gray-900">{formatDateTime(task.updatedAt)}</span>
            </div>
          </div>
        </Card>
      </div>

      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="업무 삭제"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            정말로 이 업무를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </p>
          <div className="flex gap-3">
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleting}
              disabled={deleting}
            >
              삭제
            </Button>
            <Button
              variant="secondary"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
            >
              취소
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="업무 수정"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}>
          <div className="space-y-4">
            <Input
              label="제목"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              required
            />

            <MarkdownEditor
              label="설명"
              placeholder="업무 내용을 상세히 입력하세요"
              value={editForm.description}
              onChange={(val) => setEditForm({ ...editForm, description: val })}
              minHeight="150px"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                label="년도"
                value={editForm.year}
                onChange={(e) => setEditForm({ ...editForm, year: parseInt(e.target.value) || 2024 })}
                min={2020}
                max={2030}
                required
              />
              <Input
                type="number"
                label="주차"
                value={editForm.weekNumber}
                onChange={(e) => setEditForm({ ...editForm, weekNumber: parseInt(e.target.value) || 1 })}
                min={1}
                max={53}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="상태"
                options={statusOptions}
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                required
              />
              <Select
                label="우선순위"
                options={priorityOptions}
                value={editForm.priority}
                onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                required
              />
            </div>

            <Select
              label="담당자"
              options={[
                { value: '', label: '담당자 선택 (선택사항)' },
                ...users.map((u) => ({ value: u.id, label: `${u.name} (${u.role})` })),
              ]}
              value={editForm.assigneeId}
              onChange={(e) => setEditForm({ ...editForm, assigneeId: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                label="완료 예정일"
                value={editForm.dueDate}
                onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
              />
              <Input
                type="number"
                label="예상 시간 (시간)"
                value={editForm.estimatedHours}
                onChange={(e) => setEditForm({ ...editForm, estimatedHours: e.target.value })}
                min={0}
                step="0.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">태그</label>
              {tagPresets.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {tagPresets.map((preset) => {
                    const currentTags = editForm.tags.split(',').map((t) => t.trim()).filter((t) => t.length > 0);
                    const isSelected = currentTags.includes(preset);
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          const newTags = isSelected
                            ? currentTags.filter((t) => t !== preset)
                            : [...currentTags, preset];
                          setEditForm({ ...editForm, tags: newTags.join(', ') });
                        }}
                        className={`px-3 py-1 rounded-md text-xs border-2 cursor-pointer transition-all duration-150 ${
                          isSelected
                            ? 'bg-primary-100 text-primary-800 border-primary-700 shadow-brutal-sm'
                            : 'bg-gray-100 text-gray-700 border-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {preset}
                      </button>
                    );
                  })}
                </div>
              )}
              {editForm.tags.trim() && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {editForm.tags.split(',').map((t) => t.trim()).filter((t) => t.length > 0).map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => {
                          const tags = editForm.tags.split(',').map((t) => t.trim()).filter((t) => t.length > 0 && t !== tag);
                          setEditForm({ ...editForm, tags: tags.join(', ') });
                        }}
                        className="ml-0.5 hover:text-red-600 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <Input
                placeholder="태그를 쉼표로 구분하여 입력하세요"
                value={editForm.tags}
                onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                loading={saving}
                disabled={saving}
              >
                저장
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditModalOpen(false)}
                disabled={saving}
              >
                취소
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
