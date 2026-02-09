'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { contractsApi, productsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { MarkdownEditor } from '@/components/ui/MarkdownEditor';

function toDateString(value: string | Date | null | undefined): string {
  if (!value) return '';
  return String(value).split('T')[0];
}

export default function EditContractPage() {
  const router = useRouter();
  const params = useParams();
  const contractId = params.id as string;
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [contractTitle, setContractTitle] = useState('');

  const isFinanceUser = user && ['owner', 'admin'].includes(user.role);

  const [formData, setFormData] = useState({
    title: '',
    contractNumber: '',
    contractType: 'service',
    sourceType: 'direct',
    originalVendor: '',
    partyA: '',
    partyB: '',
    startDate: '',
    endDate: '',
    amount: '',
    currency: 'KRW',
    description: '',
    autoRenewal: false,
    renewalNoticeDays: '30',
    paymentCycle: 'annual',
    vatIncluded: true,
    purchasePrice: '',
    purchaseCommissionRate: '',
    sellingPrice: '',
    hasPartner: false,
    partnerName: '',
    commissionType: 'percentage',
    partnerCommission: '',
    internalManagerId: '',
    notifyBefore30Days: true,
    notifyBefore7Days: true,
    notifyOnExpiry: false,
    memo: '',
  });

  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [contractProducts, setContractProducts] = useState<Array<{
    productId: string;
    productOptionId: string;
    quantity: number;
    notes: string;
  }>>([{ productId: '', productOptionId: '', quantity: 1, notes: '' }]);

  const [partyBContacts, setPartyBContacts] = useState<Array<{
    platform: string;
    name: string;
    email: string;
  }>>([{ platform: '', name: '', email: '' }]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetching(true);

        const [productsData, contract] = await Promise.all([
          productsApi.list(),
          contractsApi.get(contractId),
        ]);

        setProducts(productsData || []);
        setContractTitle(contract.title);

        // Fetch users
        const usersRes = await fetch('/api/v1/users', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(Array.isArray(usersData) ? usersData : []);
        }

        // Map contract data to form
        setFormData({
          title: contract.title || '',
          contractNumber: contract.contractNumber || '',
          contractType: contract.contractType || 'service',
          sourceType: contract.sourceType || 'direct',
          originalVendor: contract.originalVendor || '',
          partyA: contract.partyA || '',
          partyB: contract.partyB || '',
          startDate: toDateString(contract.startDate),
          endDate: toDateString(contract.endDate),
          amount: contract.amount !== undefined && contract.amount !== null ? String(contract.amount) : '',
          currency: contract.currency || 'KRW',
          description: contract.description || '',
          autoRenewal: contract.autoRenewal ?? false,
          renewalNoticeDays: contract.renewalNoticeDays != null ? String(contract.renewalNoticeDays) : '30',
          paymentCycle: contract.paymentCycle || 'annual',
          vatIncluded: contract.vatIncluded ?? true,
          purchasePrice: contract.purchasePrice !== undefined && contract.purchasePrice !== null ? String(contract.purchasePrice) : '',
          purchaseCommissionRate: contract.purchaseCommissionRate != null ? String(contract.purchaseCommissionRate) : '',
          sellingPrice: contract.sellingPrice !== undefined && contract.sellingPrice !== null ? String(contract.sellingPrice) : '',
          hasPartner: contract.hasPartner ?? false,
          partnerName: contract.partnerName || '',
          commissionType: contract.commissionType || 'percentage',
          partnerCommission: contract.partnerCommission != null ? String(contract.partnerCommission) : '',
          internalManagerId: contract.internalManagerId || '',
          notifyBefore30Days: contract.notifyBefore30Days ?? true,
          notifyBefore7Days: contract.notifyBefore7Days ?? true,
          notifyOnExpiry: contract.notifyOnExpiry ?? false,
          memo: contract.memo || '',
        });

        // Map contract products
        if (contract.contractProducts && contract.contractProducts.length > 0) {
          setContractProducts(
            contract.contractProducts.map((cp: any) => ({
              productId: cp.product?.id || '',
              productOptionId: cp.productOption?.id || '',
              quantity: cp.quantity || 1,
              notes: cp.notes || '',
            }))
          );
        }

        // Map partyB contacts
        if (contract.partyBContact && Array.isArray(contract.partyBContact) && contract.partyBContact.length > 0) {
          setPartyBContacts(
            contract.partyBContact.map((c: any) => ({
              platform: c.platform || '',
              name: c.name || '',
              email: c.email || '',
            }))
          );
        }
      } catch (err: any) {
        console.error('Failed to fetch contract:', err);
        setError(err.message || '계약 정보를 불러오는데 실패했습니다.');
        toast.error('계약 정보를 불러오는데 실패했습니다.');
      } finally {
        setFetching(false);
      }
    };

    fetchData();
  }, [contractId]);

  const financeCalculations = useMemo(() => {
    const purchasePrice = parseFloat(formData.purchasePrice) || 0;
    const purchaseCommissionRate = parseFloat(formData.purchaseCommissionRate) || 0;
    const sellingPrice = parseFloat(formData.sellingPrice) || 0;
    const partnerCommission = parseFloat(formData.partnerCommission) || 0;

    const actualPurchasePrice = purchasePrice * (1 + purchaseCommissionRate / 100);

    let actualSellingPrice = sellingPrice;
    if (formData.hasPartner && partnerCommission > 0) {
      if (formData.commissionType === 'percentage') {
        actualSellingPrice = sellingPrice * (1 - partnerCommission / 100);
      } else {
        actualSellingPrice = sellingPrice - partnerCommission;
      }
    }

    const baseMarginRate = purchasePrice > 0 ? ((sellingPrice - purchasePrice) / sellingPrice * 100) : 0;
    const actualMarginRate = actualSellingPrice > 0 ? ((actualSellingPrice - actualPurchasePrice) / actualSellingPrice * 100) : 0;
    const actualMarginAmount = actualSellingPrice - actualPurchasePrice;

    return {
      actualPurchasePrice,
      actualSellingPrice,
      baseMarginRate,
      actualMarginRate,
      actualMarginAmount,
    };
  }, [
    formData.purchasePrice,
    formData.purchaseCommissionRate,
    formData.sellingPrice,
    formData.hasPartner,
    formData.commissionType,
    formData.partnerCommission,
  ]);

  const addContractProduct = () => {
    setContractProducts([...contractProducts, { productId: '', productOptionId: '', quantity: 1, notes: '' }]);
  };

  const removeContractProduct = (index: number) => {
    if (contractProducts.length <= 1) return;
    setContractProducts(contractProducts.filter((_, i) => i !== index));
  };

  const updateContractProduct = (index: number, field: string, value: any) => {
    const updated = [...contractProducts];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'productId') {
      updated[index].productOptionId = '';
    }
    setContractProducts(updated);
  };

  const addContact = () => {
    setPartyBContacts([...partyBContacts, { platform: '', name: '', email: '' }]);
  };

  const removeContact = (index: number) => {
    if (partyBContacts.length <= 1) return;
    setPartyBContacts(partyBContacts.filter((_, i) => i !== index));
  };

  const updateContact = (index: number, field: string, value: string) => {
    const updated = [...partyBContacts];
    updated[index] = { ...updated[index], [field]: value };
    setPartyBContacts(updated);
  };

  const getProductOptions = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.options || [];
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '계약명을 입력하세요.';
    }
    if (!formData.contractType) {
      newErrors.contractType = '계약 유형을 선택하세요.';
    }
    if (!formData.partyA.trim()) {
      newErrors.partyA = '공급사를 입력하세요.';
    }
    if (!formData.partyB.trim()) {
      newErrors.partyB = '고객사를 입력하세요.';
    }
    if (!formData.startDate) {
      newErrors.startDate = '계약 시작일을 입력하세요.';
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
        contractType: formData.contractType,
        sourceType: formData.sourceType,
        partyA: formData.partyA.trim(),
        partyB: formData.partyB.trim(),
        startDate: formData.startDate,
        autoRenewal: formData.autoRenewal,
      };

      if (formData.sourceType !== 'direct' && formData.originalVendor.trim()) {
        payload.originalVendor = formData.originalVendor.trim();
      }

      if (formData.contractNumber.trim()) {
        payload.contractNumber = formData.contractNumber.trim();
      }
      if (formData.endDate) {
        payload.endDate = formData.endDate;
      }
      if (formData.amount && !isNaN(parseFloat(formData.amount))) {
        payload.amount = parseFloat(formData.amount);
      }
      if (formData.currency) {
        payload.currency = formData.currency;
      }
      if (formData.description.trim()) {
        payload.description = formData.description.trim();
      }
      if (formData.renewalNoticeDays && !isNaN(parseInt(formData.renewalNoticeDays))) {
        payload.renewalNoticeDays = parseInt(formData.renewalNoticeDays);
      }

      const validProducts = contractProducts.filter(p => p.productId);
      if (validProducts.length > 0) {
        payload.products = validProducts;
      }

      if (formData.paymentCycle) {
        payload.paymentCycle = formData.paymentCycle;
      }
      payload.vatIncluded = formData.vatIncluded;

      if (isFinanceUser) {
        if (formData.purchasePrice && !isNaN(parseFloat(formData.purchasePrice))) {
          payload.purchasePrice = parseFloat(formData.purchasePrice);
        }
        if (formData.purchaseCommissionRate && !isNaN(parseFloat(formData.purchaseCommissionRate))) {
          payload.purchaseCommissionRate = parseFloat(formData.purchaseCommissionRate);
        }
        if (formData.sellingPrice && !isNaN(parseFloat(formData.sellingPrice))) {
          payload.sellingPrice = parseFloat(formData.sellingPrice);
        }
        payload.hasPartner = formData.hasPartner;
        if (formData.hasPartner) {
          if (formData.partnerName.trim()) {
            payload.partnerName = formData.partnerName.trim();
          }
          if (formData.commissionType) {
            payload.commissionType = formData.commissionType;
          }
          if (formData.partnerCommission && !isNaN(parseFloat(formData.partnerCommission))) {
            payload.partnerCommission = parseFloat(formData.partnerCommission);
          }
        }
      }

      if (formData.internalManagerId) {
        payload.internalManagerId = formData.internalManagerId;
      }
      const validContacts = partyBContacts.filter(c => c.platform.trim() || c.name.trim() || c.email.trim());
      if (validContacts.length > 0) {
        payload.partyBContact = validContacts.map(c => ({
          platform: c.platform.trim(),
          name: c.name.trim(),
          email: c.email.trim(),
        }));
      }

      payload.notifyBefore30Days = formData.notifyBefore30Days;
      payload.notifyBefore7Days = formData.notifyBefore7Days;
      payload.notifyOnExpiry = formData.notifyOnExpiry;

      if (formData.memo.trim()) {
        payload.memo = formData.memo.trim();
      }

      await contractsApi.update(contractId, payload);
      toast.success('계약이 수정되었습니다.');
      router.push(`/contracts/${contractId}`);
    } catch (err: any) {
      console.error('Contract update error:', err);
      const message = err.message || '계약 수정에 실패했습니다.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (error && !formData.title) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card className="bg-red-50 border-2 border-red-700">
          <p className="text-sm text-red-800">{error}</p>
          <Button variant="secondary" size="sm" onClick={() => router.back()} className="mt-4">
            돌아가기
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Breadcrumb
        items={[
          { label: '계약 관리', href: '/contracts' },
          { label: contractTitle, href: `/contracts/${contractId}` },
          { label: '수정' },
        ]}
      />
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">계약 수정</h1>
        </div>
      </div>

      {error && (
        <Card className="bg-red-50 border-2 border-red-700 mb-6">
          <p className="text-sm text-red-800">{error}</p>
        </Card>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="계약명"
            required
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            error={errors.title}
            placeholder="예: 2024년도 보안관제 서비스 계약"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="계약번호"
              value={formData.contractNumber}
              onChange={(e) => handleChange('contractNumber', e.target.value)}
              placeholder="예: CTR-2024-001"
            />

            <Select
              label="계약 유형"
              required
              value={formData.contractType}
              onChange={(e) => handleChange('contractType', e.target.value)}
              error={errors.contractType}
              options={[
                { value: 'service', label: '서비스 계약' },
                { value: 'license', label: '라이선스' },
                { value: 'maintenance', label: '유지보수' },
                { value: 'nda', label: 'NDA' },
                { value: 'mou', label: 'MOU' },
                { value: 'other', label: '기타' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="거래 유형"
              value={formData.sourceType}
              onChange={(e) => handleChange('sourceType', e.target.value)}
              options={[
                { value: 'direct', label: '직접 판매' },
                { value: 'reselling', label: '리셀링' },
                { value: 'vendor_direct', label: '벤더 직계약' },
              ]}
            />
            <Input
              label="공급사"
              required
              value={formData.partyA}
              onChange={(e) => handleChange('partyA', e.target.value)}
              error={errors.partyA}
              placeholder="예: 주식회사 오타이상"
            />
            <Input
              label="고객사"
              required
              value={formData.partyB}
              onChange={(e) => handleChange('partyB', e.target.value)}
              error={errors.partyB}
              placeholder="예: 삼성전자 주식회사"
            />
          </div>

          {formData.sourceType !== 'direct' && (
            <Input
              label={formData.sourceType === 'reselling' ? '원 벤더 (제조사)' : '원 벤더'}
              value={formData.originalVendor}
              onChange={(e) => handleChange('originalVendor', e.target.value)}
              placeholder="예: RSA Security, NSHC"
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="계약 시작일"
              type="date"
              required
              value={formData.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              error={errors.startDate}
            />

            <Input
              label="계약 종료일"
              type="date"
              value={formData.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="계약 금액"
              type="number"
              value={formData.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              placeholder="0"
            />

            <Select
              label="통화"
              value={formData.currency}
              onChange={(e) => handleChange('currency', e.target.value)}
              options={[
                { value: 'KRW', label: 'KRW (원)' },
                { value: 'USD', label: 'USD ($)' },
                { value: 'EUR', label: 'EUR (€)' },
                { value: 'JPY', label: 'JPY (¥)' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="결제 주기"
              value={formData.paymentCycle}
              onChange={(e) => handleChange('paymentCycle', e.target.value)}
              options={[
                { value: 'lump_sum', label: '일시불' },
                { value: 'monthly', label: '월납' },
                { value: 'quarterly', label: '분기납' },
                { value: 'annual', label: '연납' },
              ]}
            />

            <div className="flex items-center pt-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.vatIncluded}
                  onChange={(e) => handleChange('vatIncluded', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">VAT 포함 (10%)</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.autoRenewal}
                onChange={(e) => handleChange('autoRenewal', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">자동 갱신</span>
            </label>
          </div>

          {formData.autoRenewal && (
            <Input
              label="갱신 알림 일수"
              type="number"
              value={formData.renewalNoticeDays}
              onChange={(e) => handleChange('renewalNoticeDays', e.target.value)}
              placeholder="30"
            />
          )}

          {isFinanceUser && (
            <div className="border-t-2 border-gray-800 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">재무 정보 (Admin 권한)</h3>

              <div className="bg-blue-50 border-2 border-blue-700 rounded-md p-4 mb-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-3">매입 정보</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="기본 매입가"
                    type="number"
                    value={formData.purchasePrice}
                    onChange={(e) => handleChange('purchasePrice', e.target.value)}
                    placeholder="0"
                  />
                  <Input
                    label="매입 수수료율 (%)"
                    type="number"
                    value={formData.purchaseCommissionRate}
                    onChange={(e) => handleChange('purchaseCommissionRate', e.target.value)}
                    placeholder="0"
                  />
                  <Input
                    label="실제 매입가"
                    type="text"
                    value={financeCalculations.actualPurchasePrice.toLocaleString()}
                    disabled
                  />
                </div>
              </div>

              <div className="bg-green-50 border-2 border-green-700 rounded-md p-4 mb-4">
                <h4 className="text-sm font-semibold text-green-900 mb-3">판매 정보</h4>
                <div className="space-y-4">
                  <Input
                    label="기본 판매가"
                    type="number"
                    value={formData.sellingPrice}
                    onChange={(e) => handleChange('sellingPrice', e.target.value)}
                    placeholder="0"
                  />

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.hasPartner}
                      onChange={(e) => handleChange('hasPartner', e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">파트너사 포함</span>
                  </label>

                  {formData.hasPartner && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6 border-l-2 border-green-700">
                      <Input
                        label="파트너사명"
                        value={formData.partnerName}
                        onChange={(e) => handleChange('partnerName', e.target.value)}
                        placeholder="예: ABC파트너"
                      />
                      <Select
                        label="수수료 방식"
                        value={formData.commissionType}
                        onChange={(e) => handleChange('commissionType', e.target.value)}
                        options={[
                          { value: 'percentage', label: '비율 (%)' },
                          { value: 'amount', label: '금액 (원)' },
                        ]}
                      />
                      <Input
                        label={`파트너 수수료 (${formData.commissionType === 'percentage' ? '%' : '원'})`}
                        type="number"
                        value={formData.partnerCommission}
                        onChange={(e) => handleChange('partnerCommission', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  )}

                  <Input
                    label="실제 판매가 (수령액)"
                    type="text"
                    value={financeCalculations.actualSellingPrice.toLocaleString()}
                    disabled
                  />
                </div>
              </div>

              <div className="bg-purple-50 border-2 border-purple-700 rounded-md p-4">
                <h4 className="text-sm font-semibold text-purple-900 mb-3">마진 분석</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">기본 마진율</p>
                    <p className="text-lg font-semibold text-gray-700">
                      {financeCalculations.baseMarginRate.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">실제 마진율</p>
                    <p className={cn(
                      "text-2xl font-bold",
                      financeCalculations.actualMarginRate < 0 ? "text-red-600" :
                      financeCalculations.actualMarginRate >= 20 ? "text-green-600" :
                      "text-orange-600"
                    )}>
                      {financeCalculations.actualMarginRate.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">실제 마진액</p>
                    <p className={cn(
                      "text-lg font-semibold",
                      financeCalculations.actualMarginAmount < 0 ? "text-red-600" : "text-gray-900"
                    )}>
                      {financeCalculations.actualMarginAmount.toLocaleString()} 원
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="border-t-2 border-gray-800 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">공급 제품 및 파생제품</h3>
            <p className="text-sm text-gray-600 mb-4">계약에 포함되는 제품과 파생제품을 선택하세요.</p>

            <div className="space-y-4">
              {contractProducts.map((item, index) => (
                <div key={index} className="bg-gray-50 border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-gray-800">항목 {index + 1}</h4>
                    {contractProducts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeContractProduct(index)}
                        className="text-red-500 hover:text-red-700 text-xl font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="제품"
                      value={item.productId}
                      onChange={(e) => updateContractProduct(index, 'productId', e.target.value)}
                      options={[
                        { value: '', label: '선택하세요' },
                        ...products.map(p => ({ value: p.id, label: `${p.name} (${p.code})` }))
                      ]}
                    />

                    <Select
                      label="파생제품"
                      value={item.productOptionId}
                      onChange={(e) => updateContractProduct(index, 'productOptionId', e.target.value)}
                      disabled={!item.productId}
                      options={[
                        { value: '', label: item.productId ? '선택하세요' : '제품을 먼저 선택하세요' },
                        ...getProductOptions(item.productId).map((opt: any) => ({
                          value: opt.id,
                          label: `${opt.type ? `[${opt.type}] ` : ''}${opt.name} (${opt.code})`
                        }))
                      ]}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <Input
                      label="수량"
                      type="number"
                      min="1"
                      value={item.quantity.toString()}
                      onChange={(e) => updateContractProduct(index, 'quantity', parseInt(e.target.value) || 1)}
                    />

                    <Input
                      label="비고"
                      value={item.notes}
                      onChange={(e) => updateContractProduct(index, 'notes', e.target.value)}
                      placeholder="추가 정보 입력"
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addContractProduct}
              className="mt-4"
            >
              + 제품 추가
            </Button>
          </div>

          <div className="border-t-2 border-gray-800 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">담당자 정보</h3>

            <div className="mb-6">
              <Select
                label="사내 담당자"
                value={formData.internalManagerId}
                onChange={(e) => handleChange('internalManagerId', e.target.value)}
                options={[
                  { value: '', label: '선택하세요' },
                  ...users.map(u => ({ value: u.id, label: `${u.name} (${u.email})` }))
                ]}
              />
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">고객사 담당자</h4>
              <div className="space-y-3">
                {partyBContacts.map((contact, index) => (
                  <div key={index} className="bg-gray-50 border-2 border-gray-800 rounded-md p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-gray-800">담당자 {index + 1}</span>
                      {partyBContacts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeContact(index)}
                          className="text-red-500 hover:text-red-700 text-xl font-bold"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        label="플랫폼"
                        value={contact.platform}
                        onChange={(e) => updateContact(index, 'platform', e.target.value)}
                        placeholder="예: 카카오톡, 이메일, 전화"
                      />
                      <Input
                        label="담당자명"
                        value={contact.name}
                        onChange={(e) => updateContact(index, 'name', e.target.value)}
                        placeholder="예: 홍길동"
                      />
                      <Input
                        label="연락처"
                        type="email"
                        value={contact.email}
                        onChange={(e) => updateContact(index, 'email', e.target.value)}
                        placeholder="예: hong@example.com"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addContact}
                className="mt-3"
              >
                + 담당자 추가
              </Button>
            </div>
          </div>

          <div className="border-t-2 border-gray-800 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">알림 설정</h3>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.notifyBefore30Days}
                  onChange={(e) => handleChange('notifyBefore30Days', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">만료 30일 전 알림</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.notifyBefore7Days}
                  onChange={(e) => handleChange('notifyBefore7Days', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">만료 7일 전 알림</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.notifyOnExpiry}
                  onChange={(e) => handleChange('notifyOnExpiry', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">만료일 당일 알림</span>
              </label>
            </div>
          </div>

          <MarkdownEditor
            label="계약 내용"
            placeholder="계약 내용을 입력하세요."
            value={formData.description}
            onChange={(val) => handleChange('description', val)}
          />

          <MarkdownEditor
            label="메모"
            placeholder="내부 메모를 입력하세요."
            value={formData.memo}
            onChange={(val) => handleChange('memo', val)}
            minHeight="120px"
          />

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              취소
            </Button>
            <Button type="submit" loading={loading}>
              저장
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
