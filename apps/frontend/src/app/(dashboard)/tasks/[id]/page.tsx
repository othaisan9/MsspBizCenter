'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { tasksApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import {
  getStatusColor,
  getStatusLabel,
  getPriorityColor,
  getPriorityLabel,
  formatDate,
  formatDateTime,
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

  useEffect(() => {
    fetchTask();
  }, [taskId]);

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

  const handleStatusChange = async (newStatus: string) => {
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

      if (editForm.tags.trim()) {
        payload.tags = editForm.tags
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t.length > 0);
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
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
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
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
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
                onChange={(e) => handleStatusChange(e.target.value)}
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
                <span className="text-sm font-medium text-gray-700">마감일</span>
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
                    <Badge key={idx} color="bg-blue-100 text-blue-800">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {task.description && (
          <Card title="설명">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.description}</p>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설명
              </label>
              <textarea
                rows={4}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>

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

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                label="마감일"
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

            <Input
              label="태그"
              placeholder="태그를 쉼표로 구분하여 입력하세요"
              value={editForm.tags}
              onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
            />

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
