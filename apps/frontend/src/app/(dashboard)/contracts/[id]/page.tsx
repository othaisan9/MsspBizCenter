'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { contractsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatDate, formatDateTime, getStatusColor, getStatusLabel, cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';

interface Contract {
  id: string;
  title: string;
  contractNumber?: string;
  contractType: string;
  partyA: string;
  partyB: string;
  partyBContact?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  startDate: string;
  endDate?: string;
  amount?: number;
  currency?: string;
  paymentTerms?: string;
  status: string;
  autoRenewal?: boolean;
  renewalNoticeDays?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; name: string; email: string };
  updatedBy?: { id: string; name: string; email: string };
}

interface HistoryEntry {
  id: string;
  action: string;
  field: string;
  oldValue?: string;
  newValue?: string;
  changedAt: string;
  changedBy: { id: string; name: string; email: string };
}

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  service: '서비스 계약',
  license: '라이선스',
  maintenance: '유지보수',
  nda: 'NDA',
  mou: 'MOU',
  other: '기타',
};

const ACTION_LABELS: Record<string, string> = {
  create: '생성',
  update: '수정',
  status_change: '상태 변경',
  renew: '갱신',
};

export default function ContractDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const contractId = params.id as string;

  const [contract, setContract] = useState<Contract | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [renewModalOpen, setRenewModalOpen] = useState(false);

  const [newStatus, setNewStatus] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const canViewAmount = user && ['owner', 'admin'].includes(user.role);
  const canEdit = user && ['owner', 'admin', 'editor'].includes(user.role);

  const fetchContract = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await contractsApi.get(contractId);
      setContract(data);
    } catch (err: any) {
      setError(err.message || '계약 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await contractsApi.history(contractId);
      setHistory(data || []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  }, [contractId]);

  useEffect(() => {
    fetchContract();
    fetchHistory();
  }, [fetchContract, fetchHistory]);

  const handleStatusChange = async () => {
    if (!newStatus) return;

    try {
      setActionLoading(true);
      await contractsApi.updateStatus(contractId, newStatus);
      await fetchContract();
      await fetchHistory();
      setStatusModalOpen(false);
      setNewStatus('');
    } catch (err: any) {
      alert(err.message || '상태 변경에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRenew = async () => {
    try {
      setActionLoading(true);
      await contractsApi.renew(contractId);
      await fetchContract();
      await fetchHistory();
      setRenewModalOpen(false);
    } catch (err: any) {
      alert(err.message || '계약 갱신에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading(true);
      await contractsApi.delete(contractId);
      router.push('/contracts');
    } catch (err: any) {
      alert(err.message || '계약 삭제에 실패했습니다.');
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-red-50 border-red-200">
          <p className="text-sm text-red-800">{error || '계약을 찾을 수 없습니다.'}</p>
          <Button variant="secondary" size="sm" onClick={() => router.push('/contracts')} className="mt-4">
            목록으로
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{contract.title}</h1>
            {contract.contractNumber && (
              <p className="text-sm text-gray-600 mt-1">계약번호: {contract.contractNumber}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {canEdit && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push(`/contracts/${contractId}/edit`)}
              >
                수정
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDeleteModalOpen(true)}
              >
                삭제
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">계약 유형</p>
              <p className="text-sm font-medium text-gray-900">
                {CONTRACT_TYPE_LABELS[contract.contractType] || contract.contractType}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">상태</p>
              <div className="flex items-center space-x-2">
                <Badge color={getStatusColor(contract.status)}>
                  {getStatusLabel(contract.status)}
                </Badge>
                {canEdit && (
                  <button
                    onClick={() => {
                      setNewStatus(contract.status);
                      setStatusModalOpen(true);
                    }}
                    className="text-primary-600 hover:text-primary-700 text-xs"
                  >
                    변경
                  </button>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">자동 갱신</p>
              <p className="text-sm font-medium text-gray-900">
                {contract.autoRenewal ? `활성 (${contract.renewalNoticeDays || 30}일 전 알림)` : '비활성'}
              </p>
            </div>
            {canEdit && contract.status === 'active' && (
              <div>
                <Button size="sm" onClick={() => setRenewModalOpen(true)}>
                  계약 갱신
                </Button>
              </div>
            )}
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">계약 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-500 mb-1">계약 주체 (갑)</p>
                <p className="text-sm text-gray-900">{contract.partyA}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">계약 상대방 (을)</p>
                <p className="text-sm text-gray-900">{contract.partyB}</p>
                {contract.partyBContact && (
                  <div className="mt-2 space-y-1">
                    {contract.partyBContact.name && (
                      <p className="text-xs text-gray-600">담당자: {contract.partyBContact.name}</p>
                    )}
                    {contract.partyBContact.email && (
                      <p className="text-xs text-gray-600">이메일: {contract.partyBContact.email}</p>
                    )}
                    {contract.partyBContact.phone && (
                      <p className="text-xs text-gray-600">전화: {contract.partyBContact.phone}</p>
                    )}
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">계약 시작일</p>
                <p className="text-sm text-gray-900">{formatDate(contract.startDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">계약 종료일</p>
                <p className="text-sm text-gray-900">
                  {contract.endDate ? formatDate(contract.endDate) : '미정'}
                </p>
              </div>
              {canViewAmount && contract.amount !== undefined && (
                <>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">계약 금액</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {contract.amount.toLocaleString()} {contract.currency || 'KRW'}
                    </p>
                  </div>
                  {contract.paymentTerms && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">지급 조건</p>
                      <p className="text-sm text-gray-900">{contract.paymentTerms}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {contract.description && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">계약 내용</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{contract.description}</p>
            </div>
          )}

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">메타데이터</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
              <div>
                <p className="mb-1">생성: {formatDateTime(contract.createdAt)}</p>
                {contract.createdBy && (
                  <p>생성자: {contract.createdBy.name} ({contract.createdBy.email})</p>
                )}
              </div>
              <div>
                <p className="mb-1">수정: {formatDateTime(contract.updatedAt)}</p>
                {contract.updatedBy && (
                  <p>수정자: {contract.updatedBy.name} ({contract.updatedBy.email})</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {history.length > 0 && (
        <Card title="변경 이력">
          <div className="space-y-4">
            {history.map((entry) => (
              <div key={entry.id} className="flex space-x-4 pb-4 border-b last:border-b-0">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {ACTION_LABELS[entry.action] || entry.action}
                    </p>
                    <p className="text-xs text-gray-500">{formatDateTime(entry.changedAt)}</p>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {entry.changedBy.name} ({entry.changedBy.email})
                  </p>
                  {entry.field && (
                    <div className="mt-2 text-sm">
                      <span className="text-gray-600">{entry.field}: </span>
                      {entry.oldValue && (
                        <span className="text-red-600 line-through mr-2">{entry.oldValue}</span>
                      )}
                      {entry.newValue && (
                        <span className="text-green-600 font-medium">{entry.newValue}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal open={statusModalOpen} onClose={() => setStatusModalOpen(false)} title="상태 변경">
        <div className="space-y-4">
          <Select
            label="새 상태"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            options={[
              { value: 'draft', label: '초안' },
              { value: 'active', label: '활성' },
              { value: 'expired', label: '만료' },
              { value: 'terminated', label: '해지' },
              { value: 'renewed', label: '갱신됨' },
            ]}
          />
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setStatusModalOpen(false)}>
              취소
            </Button>
            <Button onClick={handleStatusChange} loading={actionLoading}>
              변경
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={renewModalOpen} onClose={() => setRenewModalOpen(false)} title="계약 갱신">
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            현재 계약을 갱신하시겠습니까? 새로운 계약이 생성됩니다.
          </p>
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setRenewModalOpen(false)}>
              취소
            </Button>
            <Button onClick={handleRenew} loading={actionLoading}>
              갱신
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="계약 삭제">
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            정말로 이 계약을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </p>
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              취소
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={actionLoading}>
              삭제
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
