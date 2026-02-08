'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { meetingsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { MarkdownViewer } from '@/components/ui/MarkdownViewer';
import { getStatusColor, getStatusLabel, formatDateTime } from '@/lib/utils';

function getMeetingTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    regular: '정기 회의',
    adhoc: '임시 회의',
    review: '리뷰 회의',
    retrospective: '회고',
  };
  return labels[type] || type;
}

const ACTION_ITEM_STATUS_OPTIONS = [
  { value: 'pending', label: '대기' },
  { value: 'in_progress', label: '진행 중' },
  { value: 'completed', label: '완료' },
];

export default function MeetingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const meetingId = params.id as string;

  const [meeting, setMeeting] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [actionItemModalOpen, setActionItemModalOpen] = useState(false);
  const [actionItemForm, setActionItemForm] = useState({
    title: '',
    assigneeId: '',
    dueDate: '',
  });
  const [submittingAction, setSubmittingAction] = useState(false);

  const loadMeeting = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await meetingsApi.get(meetingId);
      setMeeting(result);
    } catch (err: any) {
      console.error('Meeting fetch error:', err);
      const message = err.message || '회의록을 불러오지 못했습니다.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [meetingId]);

  useEffect(() => {
    loadMeeting();
  }, [loadMeeting]);

  const handlePublish = async () => {
    if (!meeting) return;
    try {
      await meetingsApi.publish(meetingId);
      await loadMeeting();
      toast.success('회의록이 발행되었습니다.');
    } catch (err: any) {
      console.error('Meeting publish error:', err);
      toast.error(err.message || '발행에 실패했습니다.');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await meetingsApi.delete(meetingId);
      toast.success('회의록이 삭제되었습니다.');
      router.push('/meetings');
    } catch (err: any) {
      console.error('Meeting delete error:', err);
      toast.error(err.message || '삭제에 실패했습니다.');
      setDeleting(false);
    }
  };

  const handleAddActionItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionItemForm.title.trim()) return;

    setSubmittingAction(true);
    try {
      const payload: any = {
        title: actionItemForm.title.trim(),
      };
      if (actionItemForm.assigneeId) {
        payload.assigneeId = actionItemForm.assigneeId;
      }
      if (actionItemForm.dueDate) {
        payload.dueDate = actionItemForm.dueDate;
      }

      await meetingsApi.createActionItem(meetingId, payload);
      setActionItemModalOpen(false);
      setActionItemForm({ title: '', assigneeId: '', dueDate: '' });
      await loadMeeting();
      toast.success('Action Item이 추가되었습니다.');
    } catch (err: any) {
      console.error('Action item creation error:', err);
      toast.error(err.message || 'Action Item 추가에 실패했습니다.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleUpdateActionItemStatus = async (itemId: string, status: string) => {
    try {
      await meetingsApi.updateActionItem(meetingId, itemId, { status });
      await loadMeeting();
      toast.success('상태가 변경되었습니다.');
    } catch (err: any) {
      console.error('Action item status update error:', err);
      toast.error(err.message || '상태 변경에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">불러오는 중...</p>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="bg-red-50 border-2 border-red-700 text-red-800 px-4 py-3 rounded-md shadow-brutal-sm">
          {error || '회의록을 찾을 수 없습니다.'}
        </div>
        <Button onClick={() => router.back()}>돌아가기</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumb
        items={[
          { label: '회의록', href: '/meetings' },
          { label: '회의록 상세' },
        ]}
      />
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{meeting.title}</h1>
            <Badge color={getStatusColor(meeting.status)}>
              {getStatusLabel(meeting.status)}
            </Badge>
            <Badge color="bg-blue-100 text-blue-800">
              {getMeetingTypeLabel(meeting.meetingType)}
            </Badge>
          </div>
          <div className="text-sm text-gray-500 space-y-1">
            <p>작성자: {meeting.createdBy?.name || 'Unknown'}</p>
            <p>작성일: {formatDateTime(meeting.createdAt)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {meeting.status === 'draft' && (
            <Button onClick={handlePublish}>발행</Button>
          )}
          <Button
            variant="secondary"
            onClick={() => router.push(`/meetings/${meetingId}/edit`)}
          >
            수정
          </Button>
          <Button variant="danger" onClick={() => setDeleteModalOpen(true)}>
            삭제
          </Button>
        </div>
      </div>

      <Card title="회의 정보">
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="font-medium text-gray-700">일시:</span>{' '}
              <span className="text-gray-900">{formatDateTime(meeting.meetingDate)}</span>
            </div>
            {meeting.location && (
              <div>
                <span className="font-medium text-gray-700">장소:</span>{' '}
                <span className="text-gray-900">{meeting.location}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {meeting.attendees && meeting.attendees.length > 0 && (
        <Card title="참석자">
          <div className="flex flex-wrap gap-2">
            {meeting.attendees.map((attendee: any) => (
              <Badge key={attendee.id} color="bg-gray-100 text-gray-800">
                {attendee.name || attendee.email}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {meeting.content && (
        <Card title="회의 내용">
          <MarkdownViewer content={meeting.content} />
        </Card>
      )}

      <Card
        title="Action Items"
        action={
          <Button size="sm" onClick={() => setActionItemModalOpen(true)}>
            + 추가
          </Button>
        }
      >
        {!meeting.actionItems || meeting.actionItems.length === 0 ? (
          <p className="text-sm text-gray-400">등록된 Action Item이 없습니다.</p>
        ) : (
          <ul className="divide-y-2 divide-gray-800">
            {meeting.actionItems.map((item: any) => (
              <li key={item.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    <div className="mt-1 text-xs text-gray-500 space-y-0.5">
                      {item.assignee && (
                        <p>담당자: {item.assignee.name || item.assignee.email}</p>
                      )}
                      {item.dueDate && (
                        <p>마감일: {formatDateTime(item.dueDate)}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={item.status}
                      onChange={(e) => handleUpdateActionItemStatus(item.id, e.target.value)}
                      className="text-xs rounded-md border-2 border-gray-800 focus:border-primary-500 focus:ring-primary-500 shadow-brutal-sm"
                    >
                      {ACTION_ITEM_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <Badge color={getStatusColor(item.status)}>
                      {getStatusLabel(item.status)}
                    </Badge>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="회의록 삭제"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            이 회의록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </p>
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
            >
              취소
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              삭제
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={actionItemModalOpen}
        onClose={() => setActionItemModalOpen(false)}
        title="Action Item 추가"
      >
        <form onSubmit={handleAddActionItem} className="space-y-4">
          <Input
            label="제목"
            type="text"
            required
            placeholder="Action Item 제목"
            value={actionItemForm.title}
            onChange={(e) =>
              setActionItemForm((prev) => ({ ...prev, title: e.target.value }))
            }
          />
          <Input
            label="마감일 (선택)"
            type="date"
            value={actionItemForm.dueDate}
            onChange={(e) =>
              setActionItemForm((prev) => ({ ...prev, dueDate: e.target.value }))
            }
          />
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setActionItemModalOpen(false)}
              disabled={submittingAction}
            >
              취소
            </Button>
            <Button type="submit" loading={submittingAction}>
              추가
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
