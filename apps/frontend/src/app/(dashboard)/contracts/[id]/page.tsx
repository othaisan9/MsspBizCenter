'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { contractsApi, filesApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatDate, formatDateTime, getStatusColor, getStatusLabel, cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

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
  paymentCycle?: string;
  vatIncluded?: boolean;
  status: string;
  autoRenewal?: boolean;
  renewalNoticeDays?: number;
  description?: string;
  memo?: string;
  // 재무 정보 (Owner/Admin만 포함됨)
  purchasePrice?: number;
  purchaseCommissionRate?: number;
  sellingPrice?: number;
  hasPartner?: boolean;
  partnerName?: string;
  commissionType?: string;
  partnerCommission?: number;
  // 담당자
  internalManagerId?: string;
  internalManager?: { id: string; name: string; email: string };
  // 알림
  notifyBefore30Days?: boolean;
  notifyBefore7Days?: boolean;
  notifyOnExpiry?: boolean;
  contractProducts?: Array<{
    id: string;
    quantity: number;
    notes?: string;
    product: { id: string; name: string; code: string; description?: string; productType: string };
    productOption?: { id: string; name: string; code: string; description?: string } | null;
  }>;
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

const PAYMENT_CYCLE_LABELS: Record<string, string> = {
  lump_sum: '일시불',
  monthly: '월납',
  quarterly: '분기납',
  annual: '연납',
};

const ACTION_LABELS: Record<string, string> = {
  create: '생성',
  update: '수정',
  status_change: '상태 변경',
  renew: '갱신',
};

interface FileAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  entityType: string;
  entityId: string;
  createdAt: string;
  uploadedBy: { id: string; name: string; email: string };
}

const PRODUCT_TYPE_COLORS: Record<string, { bg: string; text: string; border: string; light: string }> = {
  platform: { bg: 'bg-purple-600', text: 'text-purple-700', border: 'border-purple-200', light: 'bg-purple-50' },
  report: { bg: 'bg-red-600', text: 'text-red-700', border: 'border-red-200', light: 'bg-red-50' },
  consulting: { bg: 'bg-green-600', text: 'text-green-700', border: 'border-green-200', light: 'bg-green-50' },
  other: { bg: 'bg-gray-600', text: 'text-gray-700', border: 'border-gray-200', light: 'bg-gray-50' },
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

  // File attachments
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canViewAmount = user && ['owner', 'admin'].includes(user.role);
  const canEdit = user && ['owner', 'admin', 'editor'].includes(user.role);

  // 남은 기간 계산
  const getRemainingDays = (endDateStr?: string): number | null => {
    if (!endDateStr) return null;
    const today = new Date();
    const endDate = new Date(endDateStr);
    return Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const remainingDays = contract ? getRemainingDays(contract.endDate) : null;

  const fetchContract = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await contractsApi.get(contractId);
      setContract(data);
    } catch (err: any) {
      console.error('Contract fetch error:', err);
      const message = err.message || '계약 정보를 불러오는데 실패했습니다.';
      setError(message);
      toast.error(message);
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

  const fetchFiles = useCallback(async () => {
    try {
      setFilesLoading(true);
      const data = await filesApi.list('contract', contractId);
      setFiles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch files:', err);
    } finally {
      setFilesLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    fetchContract();
    fetchHistory();
    fetchFiles();
  }, [fetchContract, fetchHistory, fetchFiles]);

  const handleStatusChange = async () => {
    if (!newStatus) return;

    try {
      setActionLoading(true);
      await contractsApi.updateStatus(contractId, newStatus);
      await fetchContract();
      await fetchHistory();
      setStatusModalOpen(false);
      setNewStatus('');
      toast.success('상태가 변경되었습니다.');
    } catch (err: any) {
      console.error('Contract status update error:', err);
      toast.error(err.message || '상태 변경에 실패했습니다.');
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
      toast.success('계약이 갱신되었습니다.');
    } catch (err: any) {
      console.error('Contract renewal error:', err);
      toast.error(err.message || '계약 갱신에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading(true);
      await contractsApi.delete(contractId);
      toast.success('계약이 삭제되었습니다.');
      router.push('/contracts');
    } catch (err: any) {
      console.error('Contract delete error:', err);
      toast.error(err.message || '계약 삭제에 실패했습니다.');
      setActionLoading(false);
    }
  };

  // File upload handlers
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    await uploadFile(selectedFile);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      await uploadFile(droppedFile);
    }
  };

  const uploadFile = async (file: File) => {
    try {
      setUploadingFile(true);
      await filesApi.upload(file, 'contract', contractId);
      toast.success('파일이 업로드되었습니다.');
      await fetchFiles();
    } catch (err: any) {
      console.error('File upload error:', err);
      toast.error(err.message || '파일 업로드에 실패했습니다.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleFileDownload = async (file: FileAttachment) => {
    try {
      const response = await filesApi.download(file.id);
      if (!response.ok) {
        throw new Error('다운로드에 실패했습니다.');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('File download error:', err);
      toast.error(err.message || '파일 다운로드에 실패했습니다.');
    }
  };

  const handleFileDelete = async (file: FileAttachment) => {
    if (!confirm(`"${file.filename}" 파일을 삭제하시겠습니까?`)) {
      return;
    }
    try {
      await filesApi.delete(file.id);
      toast.success('파일이 삭제되었습니다.');
      await fetchFiles();
    } catch (err: any) {
      console.error('File delete error:', err);
      toast.error(err.message || '파일 삭제에 실패했습니다.');
    }
  };

  // File size formatter
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // File icon based on extension
  const getFileIcon = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext || '')) return '📄';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(ext || '')) return '🖼️';
    if (['doc', 'docx', 'txt', 'rtf'].includes(ext || '')) return '📝';
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) return '📊';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) return '📦';
    return '📎';
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
        <Card className="bg-red-50 border-2 border-red-700">
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
      <Breadcrumb
        items={[
          { label: '계약 관리', href: '/contracts' },
          { label: '계약 상세' },
        ]}
      />
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

          <div className="border-t-2 border-gray-800 pt-6">
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
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-900">
                    {contract.endDate ? formatDate(contract.endDate) : '미정'}
                  </p>
                  {remainingDays !== null && (
                    <span className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded",
                      remainingDays <= 30 ? "bg-red-100 text-red-700" :
                      remainingDays <= 90 ? "bg-orange-100 text-orange-700" :
                      "bg-green-100 text-green-700"
                    )}>
                      {remainingDays > 0 ? `${remainingDays}일 남음` : '만료'}
                    </span>
                  )}
                </div>
              </div>
              {canViewAmount && contract.amount !== undefined && (
                <>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">계약 금액</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {contract.amount.toLocaleString()} {contract.currency || 'KRW'}
                      {contract.vatIncluded && <span className="text-xs text-gray-500 ml-1">(VAT 포함)</span>}
                    </p>
                  </div>
                  {contract.paymentCycle && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">결제 주기</p>
                      <p className="text-sm text-gray-900">
                        {PAYMENT_CYCLE_LABELS[contract.paymentCycle] || contract.paymentCycle}
                      </p>
                    </div>
                  )}
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

          {canViewAmount && (contract.purchasePrice !== undefined || contract.sellingPrice !== undefined) && (
            <div className="border-t-2 border-gray-800 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">재무 정보</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contract.purchasePrice !== undefined && (
                  <div className="bg-blue-50 border-2 border-blue-700 rounded-md p-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-3">매입 정보</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">기본 매입가</span>
                        <span className="text-sm font-medium text-gray-900">
                          {contract.purchasePrice.toLocaleString()} 원
                        </span>
                      </div>
                      {contract.purchaseCommissionRate !== undefined && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-600">매입 수수료율</span>
                            <span className="text-sm font-medium text-gray-900">
                              {contract.purchaseCommissionRate}%
                            </span>
                          </div>
                          <div className="flex justify-between border-t-2 border-blue-700 pt-2">
                            <span className="text-xs text-gray-600 font-semibold">실제 매입가</span>
                            <span className="text-sm font-bold text-blue-900">
                              {(contract.purchasePrice * (1 + contract.purchaseCommissionRate / 100)).toLocaleString()} 원
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {contract.sellingPrice !== undefined && (
                  <div className="bg-green-50 border-2 border-green-700 rounded-md p-4">
                    <h4 className="text-sm font-semibold text-green-900 mb-3">판매 정보</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">기본 판매가</span>
                        <span className="text-sm font-medium text-gray-900">
                          {contract.sellingPrice.toLocaleString()} 원
                        </span>
                      </div>
                      {contract.hasPartner && contract.partnerName && (
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-600">파트너사</span>
                          <span className="text-sm font-medium text-gray-900">{contract.partnerName}</span>
                        </div>
                      )}
                      {contract.hasPartner && contract.partnerCommission !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-600">파트너 수수료</span>
                          <span className="text-sm font-medium text-gray-900">
                            {contract.commissionType === 'percentage'
                              ? `${contract.partnerCommission}%`
                              : `${contract.partnerCommission.toLocaleString()} 원`
                            }
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between border-t-2 border-green-700 pt-2">
                        <span className="text-xs text-gray-600 font-semibold">실제 판매가</span>
                        <span className="text-sm font-bold text-green-900">
                          {(() => {
                            let actualSellingPrice = contract.sellingPrice;
                            if (contract.hasPartner && contract.partnerCommission !== undefined) {
                              if (contract.commissionType === 'percentage') {
                                actualSellingPrice = contract.sellingPrice * (1 - contract.partnerCommission / 100);
                              } else {
                                actualSellingPrice = contract.sellingPrice - contract.partnerCommission;
                              }
                            }
                            return `${actualSellingPrice.toLocaleString()} 원`;
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {contract.purchasePrice !== undefined && contract.sellingPrice !== undefined && (
                <div className="bg-purple-50 border-2 border-purple-700 rounded-md p-4 mt-4">
                  <h4 className="text-sm font-semibold text-purple-900 mb-3">마진 분석</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(() => {
                      const purchasePrice = contract.purchasePrice;
                      const purchaseCommissionRate = contract.purchaseCommissionRate || 0;
                      const sellingPrice = contract.sellingPrice;
                      const actualPurchasePrice = purchasePrice * (1 + purchaseCommissionRate / 100);

                      let actualSellingPrice = sellingPrice;
                      if (contract.hasPartner && contract.partnerCommission !== undefined) {
                        if (contract.commissionType === 'percentage') {
                          actualSellingPrice = sellingPrice * (1 - contract.partnerCommission / 100);
                        } else {
                          actualSellingPrice = sellingPrice - contract.partnerCommission;
                        }
                      }

                      const baseMarginRate = (sellingPrice - purchasePrice) / sellingPrice * 100;
                      const actualMarginRate = (actualSellingPrice - actualPurchasePrice) / actualSellingPrice * 100;
                      const actualMarginAmount = actualSellingPrice - actualPurchasePrice;

                      return (
                        <>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">기본 마진율</p>
                            <p className="text-lg font-semibold text-gray-700">
                              {baseMarginRate.toFixed(2)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">실제 마진율</p>
                            <p className={cn(
                              "text-2xl font-bold",
                              actualMarginRate < 0 ? "text-red-600" :
                              actualMarginRate >= 20 ? "text-green-600" :
                              "text-orange-600"
                            )}>
                              {actualMarginRate.toFixed(2)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">실제 마진액</p>
                            <p className={cn(
                              "text-lg font-semibold",
                              actualMarginAmount < 0 ? "text-red-600" : "text-gray-900"
                            )}>
                              {actualMarginAmount.toLocaleString()} 원
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {(contract.internalManager || contract.partyBContact) && (
            <div className="border-t-2 border-gray-800 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">담당자 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {contract.internalManager && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">사내 담당자</p>
                    <p className="text-sm font-medium text-gray-900">{contract.internalManager.name}</p>
                    <p className="text-xs text-gray-600 mt-1">{contract.internalManager.email}</p>
                  </div>
                )}
                {contract.partyBContact && (contract.partyBContact.name || contract.partyBContact.email || contract.partyBContact.phone) && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">업체 담당자</p>
                    {contract.partyBContact.name && (
                      <p className="text-sm font-medium text-gray-900">{contract.partyBContact.name}</p>
                    )}
                    {contract.partyBContact.email && (
                      <p className="text-xs text-gray-600 mt-1">이메일: {contract.partyBContact.email}</p>
                    )}
                    {contract.partyBContact.phone && (
                      <p className="text-xs text-gray-600">전화: {contract.partyBContact.phone}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {(contract.notifyBefore30Days || contract.notifyBefore7Days || contract.notifyOnExpiry) && (
            <div className="border-t-2 border-gray-800 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">알림 설정</h3>
              <div className="flex flex-wrap gap-2">
                {contract.notifyBefore30Days && (
                  <Badge color="blue">만료 30일 전 알림</Badge>
                )}
                {contract.notifyBefore7Days && (
                  <Badge color="orange">만료 7일 전 알림</Badge>
                )}
                {contract.notifyOnExpiry && (
                  <Badge color="red">만료일 당일 알림</Badge>
                )}
              </div>
            </div>
          )}

          {contract.contractProducts && contract.contractProducts.length > 0 && (
            <div className="border-t-2 border-gray-800 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">공급 제품</h3>
              <div className="space-y-4">
                {(() => {
                  const groupedProducts: Record<string, typeof contract.contractProducts> = {};
                  contract.contractProducts.forEach(cp => {
                    const key = cp.product.id;
                    if (!groupedProducts[key]) {
                      groupedProducts[key] = [];
                    }
                    groupedProducts[key].push(cp);
                  });

                  return Object.entries(groupedProducts).map(([productId, items]) => {
                    const product = items[0].product;
                    const colors = PRODUCT_TYPE_COLORS[product.productType] || PRODUCT_TYPE_COLORS.other;

                    return (
                      <div key={productId} className="rounded-lg overflow-hidden">
                        <div className={cn(colors.bg, 'text-white px-4 py-3 flex items-center justify-between')}>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">{product.name}</span>
                            {product.description && (
                              <span className={cn(colors.bg.replace('600', '500'), 'px-2 py-0.5 rounded text-xs')}>
                                {product.description}
                              </span>
                            )}
                          </div>
                          <span className="text-white/70 text-sm">{items.length}개 구성</span>
                        </div>
                        <div className={cn(colors.light, 'p-4')}>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {items.map((item) => (
                              <div key={item.id} className={cn('bg-white rounded-md p-4 border-2', colors.border)}>
                                <div className="text-xs text-gray-500 mb-1">
                                  {item.productOption?.name || '기본 구성'}
                                </div>
                                <div className={cn('font-bold text-2xl', colors.text)}>{item.quantity}</div>
                                {item.notes && (
                                  <div className="text-xs text-gray-500 mt-1">{item.notes}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {!contract.contractProducts || contract.contractProducts.length === 0 && (
            <div className="border-t-2 border-gray-800 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">공급 제품</h3>
              <p className="text-sm text-gray-500">등록된 공급 제품이 없습니다.</p>
            </div>
          )}

          {contract.description && (
            <div className="border-t-2 border-gray-800 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">계약 내용</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{contract.description}</p>
            </div>
          )}

          {contract.memo && (
            <div className="border-t-2 border-gray-800 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">메모</h3>
              <div className="bg-yellow-50 border-2 border-yellow-700 rounded-md p-4">
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{contract.memo}</p>
              </div>
            </div>
          )}

          <div className="border-t-2 border-gray-800 pt-6">
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
              <div key={entry.id} className="flex space-x-4 pb-4 border-b-2 border-gray-800 last:border-b-0">
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

      <Card title="첨부 파일">
        <div className="space-y-4">
          {canEdit && (
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                isDragging
                  ? "border-primary-400 bg-primary-50"
                  : "border-gray-300 hover:border-gray-400"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                disabled={uploadingFile}
              />
              <div className="space-y-2">
                <div className="text-4xl">📎</div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    파일을 드래그하거나 클릭하여 업로드
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    최대 파일 크기: 10MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  loading={uploadingFile}
                  disabled={uploadingFile}
                >
                  파일 선택
                </Button>
              </div>
            </div>
          )}

          {filesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : files.length > 0 ? (
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md border-2 border-gray-800 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <span className="text-2xl flex-shrink-0">{getFileIcon(file.filename)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.filename}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mt-0.5">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{formatDateTime(file.createdAt)}</span>
                        <span>•</span>
                        <span>{file.uploadedBy.name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFileDownload(file)}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </Button>
                    {canEdit && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFileDelete(file)}
                      >
                        <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              첨부된 파일이 없습니다.
            </p>
          )}
        </div>
      </Card>

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
