'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { contractsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatDate, getStatusColor, getStatusLabel, cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

interface Contract {
  id: string;
  title: string;
  contractNumber?: string;
  contractType: string;
  partyA: string;
  partyB: string;
  startDate: string;
  endDate?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ExpiringContract {
  id: string;
  title: string;
  endDate: string;
  daysUntilExpiry: number;
}

interface DashboardStats {
  total: number;
  byStatus: Array<{ status: string; count: number }>;
  byType: Array<{ contractType: string; count: number }>;
  expiring: {
    within30Days: number;
    within7Days: number;
  };
}

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  service: '서비스 계약',
  license: '라이선스',
  maintenance: '유지보수',
  nda: 'NDA',
  mou: 'MOU',
  other: '기타',
};

export default function ContractsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [expiring, setExpiring] = useState<ExpiringContract[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params: Record<string, any> = {
        page,
        limit,
      };
      if (search) params.search = search;
      if (typeFilter) params.contractType = typeFilter;
      if (statusFilter) params.status = statusFilter;

      const result = await contractsApi.list(params);
      setContracts(result.items || []);
      setTotal(result.total || 0);
      setTotalPages(result.totalPages || 1);
    } catch (err: any) {
      setError(err.message || '계약 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, statusFilter]);

  const fetchExpiring = useCallback(async () => {
    try {
      const result = await contractsApi.expiring(30);
      setExpiring(result || []);
    } catch (err) {
      console.error('Failed to fetch expiring contracts:', err);
    }
  }, []);

  const fetchDashboard = useCallback(async () => {
    try {
      const result = await contractsApi.dashboard();
      setDashboardStats(result);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  useEffect(() => {
    fetchExpiring();
  }, [fetchExpiring]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleTypeChange = (value: string) => {
    setTypeFilter(value);
    setPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleRowClick = (id: string) => {
    router.push(`/contracts/${id}`);
  };

  const getActiveCount = () => {
    if (!dashboardStats) return 0;
    const activeItem = dashboardStats.byStatus.find((item) => item.status === 'active');
    return activeItem ? activeItem.count : 0;
  };

  const getExpiredTerminatedCount = () => {
    if (!dashboardStats) return 0;
    const expired = dashboardStats.byStatus.find((item) => item.status === 'expired');
    const terminated = dashboardStats.byStatus.find((item) => item.status === 'terminated');
    return (expired?.count || 0) + (terminated?.count || 0);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">계약 관리</h1>
        <Button onClick={() => router.push('/contracts/new')}>
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          새 계약
        </Button>
      </div>

      {dashboardStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            className="bg-blue-50 border-2 border-blue-700 cursor-pointer hover:shadow-brutal-hover hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-150"
            onClick={() => {
              setStatusFilter('');
              setPage(1);
            }}
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-600">전체 계약</p>
                <p className="text-2xl font-bold text-blue-900">{dashboardStats.total}</p>
              </div>
            </div>
          </Card>

          <Card
            className="bg-green-50 border-2 border-green-700 cursor-pointer hover:shadow-brutal-hover hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-150"
            onClick={() => {
              setStatusFilter('active');
              setPage(1);
            }}
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-600">활성 계약</p>
                <p className="text-2xl font-bold text-green-900">{getActiveCount()}</p>
              </div>
            </div>
          </Card>

          <Card
            className={cn(
              'border-2 cursor-pointer hover:shadow-brutal-hover hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-150',
              dashboardStats.expiring.within7Days > 0
                ? 'bg-red-50 border-red-700'
                : 'bg-yellow-50 border-yellow-700'
            )}
            onClick={() => {
              setStatusFilter('');
              setPage(1);
            }}
          >
            <div className="flex items-center space-x-4">
              <div className={cn(
                'p-3 rounded-lg',
                dashboardStats.expiring.within7Days > 0
                  ? 'bg-red-100'
                  : 'bg-yellow-100'
              )}>
                <svg
                  className={cn(
                    'w-8 h-8',
                    dashboardStats.expiring.within7Days > 0
                      ? 'text-red-600'
                      : 'text-yellow-600'
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className={cn(
                  'text-sm font-medium',
                  dashboardStats.expiring.within7Days > 0
                    ? 'text-red-600'
                    : 'text-yellow-600'
                )}>
                  만료 임박
                </p>
                <p className={cn(
                  'text-2xl font-bold',
                  dashboardStats.expiring.within7Days > 0
                    ? 'text-red-900'
                    : 'text-yellow-900'
                )}>
                  {dashboardStats.expiring.within30Days}
                </p>
              </div>
            </div>
          </Card>

          <Card
            className="bg-gray-50 border-2 border-gray-800 cursor-pointer hover:shadow-brutal-hover hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-150"
            onClick={() => {
              setStatusFilter('');
              setPage(1);
            }}
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">만료/해지</p>
                <p className="text-2xl font-bold text-gray-900">{getExpiredTerminatedCount()}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {expiring.length > 0 && (
        <Card className="bg-yellow-50 border-2 border-yellow-700">
          <div className="flex items-start space-x-3">
            <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow-900 mb-2">만료 예정 계약 알림</h3>
              <div className="space-y-1">
                {expiring.map((c) => (
                  <p key={c.id} className="text-sm text-yellow-800">
                    <button
                      onClick={() => router.push(`/contracts/${c.id}`)}
                      className="hover:underline font-medium"
                    >
                      {c.title}
                    </button>
                    {' '}
                    - {c.daysUntilExpiry}일 후 만료 ({formatDate(c.endDate)})
                  </p>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {error && (
        <Card className="bg-red-50 border-2 border-red-700">
          <p className="text-sm text-red-800">{error}</p>
        </Card>
      )}

      <Card>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="계약명, 계약번호로 검색"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <Select
              placeholder="유형 필터"
              value={typeFilter}
              onChange={(e) => handleTypeChange(e.target.value)}
              options={[
                { value: '', label: '전체 유형' },
                { value: 'service', label: '서비스 계약' },
                { value: 'license', label: '라이선스' },
                { value: 'maintenance', label: '유지보수' },
                { value: 'nda', label: 'NDA' },
                { value: 'mou', label: 'MOU' },
                { value: 'other', label: '기타' },
              ]}
            />
            <Select
              placeholder="상태 필터"
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              options={[
                { value: '', label: '전체 상태' },
                { value: 'draft', label: '초안' },
                { value: 'active', label: '활성' },
                { value: 'expired', label: '만료' },
                { value: 'terminated', label: '해지' },
                { value: 'renewed', label: '갱신됨' },
              ]}
            />
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-2 text-sm text-gray-600">계약이 없습니다.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y-2 divide-gray-800">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        계약명
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        계약번호
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        유형
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상대방
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        계약 기간
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        남은 기간
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y-2 divide-gray-800">
                    {contracts.map((contract) => {
                      const getRemainingDays = () => {
                        if (!contract.endDate) return null;
                        if (contract.status === 'expired' || contract.status === 'terminated') return null;

                        const now = new Date();
                        const endDate = new Date(contract.endDate);
                        const remainingDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                        return remainingDays;
                      };

                      const remainingDays = getRemainingDays();

                      const getRemainingDaysBadge = () => {
                        if (remainingDays === null) return <span className="text-sm text-gray-400">-</span>;

                        if (remainingDays < 0) {
                          return <Badge color="red">만료</Badge>;
                        } else if (remainingDays <= 7) {
                          return <Badge color="red">D-{remainingDays}</Badge>;
                        } else if (remainingDays <= 30) {
                          return <Badge color="orange">D-{remainingDays}</Badge>;
                        } else if (remainingDays <= 90) {
                          return <Badge color="yellow">D-{remainingDays}</Badge>;
                        } else {
                          return <Badge color="green">D-{remainingDays}</Badge>;
                        }
                      };

                      return (
                        <tr
                          key={contract.id}
                          onClick={() => handleRowClick(contract.id)}
                          className="hover:bg-gray-100 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{contract.title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">{contract.contractNumber || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {CONTRACT_TYPE_LABELS[contract.contractType] || contract.contractType}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">{contract.partyB}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {formatDate(contract.startDate)}
                              {contract.endDate && ` ~ ${formatDate(contract.endDate)}`}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getRemainingDaysBadge()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge color={getStatusColor(contract.status)}>
                              {getStatusLabel(contract.status)}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t-2 border-gray-800 pt-4">
                <div className="text-sm text-gray-700">
                  전체 {total}건 중 {(page - 1) * limit + 1}-{Math.min(page * limit, total)}건 표시
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    이전
                  </Button>
                  <div className="flex items-center px-4 py-2 text-sm text-gray-700">
                    {page} / {totalPages}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    다음
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
