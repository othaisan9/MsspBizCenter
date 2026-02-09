'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { contractsApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Contract, User } from './types';

interface FinanceTabProps {
  currentUser: User | null;
}

export function FinanceTab({ currentUser }: FinanceTabProps) {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [contractsPage, setContractsPage] = useState(1);
  const [contractsTotal, setContractsTotal] = useState(0);
  const contractsPerPage = 10;

  const canAccessFinance = currentUser?.role === 'owner' || currentUser?.role === 'admin';

  const fetchContracts = useCallback(async () => {
    try {
      setContractsLoading(true);
      const data = await contractsApi.list({ page: contractsPage, limit: contractsPerPage });
      setContracts(data.items || []);
      setContractsTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
      toast.error('계약 목록을 불러오는데 실패했습니다');
    } finally {
      setContractsLoading(false);
    }
  }, [contractsPage]);

  useEffect(() => {
    if (canAccessFinance) {
      fetchContracts();
    }
  }, [canAccessFinance, fetchContracts]);

  const calculateFinancialData = () => {
    let totalPurchase = 0;
    let totalSelling = 0;

    contracts.forEach((contract) => {
      contract.contractProducts?.forEach((cp) => {
        totalPurchase += cp.purchasePrice || 0;
        totalSelling += cp.sellingPrice || 0;
      });
    });

    const totalMargin = totalSelling - totalPurchase;
    const avgMarginRate = totalSelling > 0 ? (totalMargin / totalSelling) * 100 : 0;

    return { totalPurchase, totalSelling, totalMargin, avgMarginRate };
  };

  const getMarginRateColor = (rate: number) => {
    if (rate < 0) return 'bg-red-100 text-red-800';
    if (rate < 20) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  if (!canAccessFinance) {
    return (
      <Card>
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">권한이 없습니다</h3>
          <p className="mt-1 text-sm text-gray-500">재무 데이터는 Owner 또는 Admin만 접근할 수 있습니다</p>
        </div>
      </Card>
    );
  }

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="bg-blue-50">
          <h3 className="text-sm font-medium text-blue-900">총 매입가</h3>
          <p className="text-2xl font-bold text-blue-700 mt-2">
            {calculateFinancialData().totalPurchase.toLocaleString('ko-KR')}원
          </p>
        </Card>
        <Card className="bg-green-50">
          <h3 className="text-sm font-medium text-green-900">총 판매가</h3>
          <p className="text-2xl font-bold text-green-700 mt-2">
            {calculateFinancialData().totalSelling.toLocaleString('ko-KR')}원
          </p>
        </Card>
        <Card className="bg-purple-50">
          <h3 className="text-sm font-medium text-purple-900">총 마진</h3>
          <p className="text-2xl font-bold text-purple-700 mt-2">
            {calculateFinancialData().totalMargin.toLocaleString('ko-KR')}원
          </p>
        </Card>
        <Card className="bg-orange-50">
          <h3 className="text-sm font-medium text-orange-900">평균 마진율</h3>
          <p className="text-2xl font-bold text-orange-700 mt-2">
            {calculateFinancialData().avgMarginRate.toFixed(1)}%
          </p>
        </Card>
      </div>

      {/* Financial Table */}
      {contractsLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">고객사</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">계약명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제품</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">매입가</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">판매가</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">마진</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">마진율</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y-2 divide-gray-800">
                {contracts.map((contract) => {
                  const totalPurchase = contract.contractProducts?.reduce((sum, cp) => sum + (cp.purchasePrice || 0), 0) || 0;
                  const totalSelling = contract.contractProducts?.reduce((sum, cp) => sum + (cp.sellingPrice || 0), 0) || 0;
                  const margin = totalSelling - totalPurchase;
                  const marginRate = totalSelling > 0 ? (margin / totalSelling) * 100 : 0;

                  return (
                    <tr key={contract.id} className="hover:bg-gray-100">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contract.partyB}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contract.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex flex-wrap gap-1">
                          {contract.contractProducts?.map((cp) => (
                            <Badge key={cp.id} color="bg-gray-100 text-gray-800">
                              {cp.product.name}
                            </Badge>
                          )) || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {totalPurchase > 0 ? `${totalPurchase.toLocaleString('ko-KR')}원` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {totalSelling > 0 ? `${totalSelling.toLocaleString('ko-KR')}원` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {totalSelling > 0 ? `${margin.toLocaleString('ko-KR')}원` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {totalSelling > 0 ? (
                          <Badge color={getMarginRateColor(marginRate)}>
                            {marginRate.toFixed(1)}%
                          </Badge>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Badge color={contract.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {contract.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => router.push(`/contracts/${contract.id}`)}
                        >
                          상세
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {contractsTotal > contractsPerPage && (
            <div className="flex items-center justify-between border-t-2 border-gray-800 px-6 py-3">
              <div className="text-sm text-gray-700">
                총 {contractsTotal}개 중 {(contractsPage - 1) * contractsPerPage + 1}-{Math.min(contractsPage * contractsPerPage, contractsTotal)}개 표시
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={contractsPage === 1}
                  onClick={() => setContractsPage(contractsPage - 1)}
                >
                  이전
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={contractsPage * contractsPerPage >= contractsTotal}
                  onClick={() => setContractsPage(contractsPage + 1)}
                >
                  다음
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
