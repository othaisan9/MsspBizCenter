'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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

export default function NewContractPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isFinanceUser = user && ['owner', 'admin'].includes(user.role);

  const [formData, setFormData] = useState({
    title: '',
    contractNumber: '',
    contractType: 'service',
    partyA: '',
    partyB: '',
    startDate: '',
    endDate: '',
    amount: '',
    currency: 'KRW',
    description: '',
    autoRenewal: false,
    renewalNoticeDays: '30',
    // A-1. 결제 정보
    paymentCycle: 'annual',
    vatIncluded: true,
    // A-2. 재무 정보
    purchasePrice: '',
    purchaseCommissionRate: '',
    sellingPrice: '',
    hasPartner: false,
    partnerName: '',
    commissionType: 'percentage',
    partnerCommission: '',
    // A-3. 담당자 정보
    internalManagerId: '',
    partyBContactName: '',
    partyBContactPhone: '',
    partyBContactEmail: '',
    // A-4. 알림 설정
    notifyBefore30Days: true,
    notifyBefore7Days: true,
    notifyOnExpiry: false,
    // A-5. 메모
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

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    productsApi.list().then(setProducts).catch(console.error);
    // Fetch users for internal manager dropdown
    fetch('/api/v1/users', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => setUsers(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  // 재무 정보 자동 계산
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

  const getProductOptions = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.productOptions || [];
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
      newErrors.partyA = '계약 주체(갑)를 입력하세요.';
    }
    if (!formData.partyB.trim()) {
      newErrors.partyB = '계약 상대방(을)을 입력하세요.';
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
        partyA: formData.partyA.trim(),
        partyB: formData.partyB.trim(),
        startDate: formData.startDate,
        autoRenewal: formData.autoRenewal,
      };

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

      // A-1. 결제 정보
      if (formData.paymentCycle) {
        payload.paymentCycle = formData.paymentCycle;
      }
      payload.vatIncluded = formData.vatIncluded;

      // A-2. 재무 정보 (Admin/Owner만)
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

      // A-3. 담당자 정보
      if (formData.internalManagerId) {
        payload.internalManagerId = formData.internalManagerId;
      }
      if (formData.partyBContactName.trim() || formData.partyBContactEmail.trim() || formData.partyBContactPhone.trim()) {
        payload.partyBContact = {
          name: formData.partyBContactName.trim(),
          email: formData.partyBContactEmail.trim(),
          phone: formData.partyBContactPhone.trim(),
        };
      }

      // A-4. 알림 설정
      payload.notifyBefore30Days = formData.notifyBefore30Days;
      payload.notifyBefore7Days = formData.notifyBefore7Days;
      payload.notifyOnExpiry = formData.notifyOnExpiry;

      // A-5. 메모
      if (formData.memo.trim()) {
        payload.memo = formData.memo.trim();
      }

      await contractsApi.create(payload);
      toast.success('계약이 등록되었습니다.');
      router.push('/contracts');
    } catch (err: any) {
      console.error('Contract creation error:', err);
      const message = err.message || '계약 생성에 실패했습니다.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Breadcrumb
        items={[
          { label: '계약 관리', href: '/contracts' },
          { label: '새 계약' },
        ]}
      />
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">새 계약 등록</h1>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="계약 주체 (갑)"
              required
              value={formData.partyA}
              onChange={(e) => handleChange('partyA', e.target.value)}
              error={errors.partyA}
              placeholder="예: 주식회사 오타이상"
            />

            <Input
              label="계약 상대방 (을)"
              required
              value={formData.partyB}
              onChange={(e) => handleChange('partyB', e.target.value)}
              error={errors.partyB}
              placeholder="예: 주식회사 고객사"
            />
          </div>

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="사내 담당자"
                value={formData.internalManagerId}
                onChange={(e) => handleChange('internalManagerId', e.target.value)}
                options={[
                  { value: '', label: '선택하세요' },
                  ...users.map(u => ({ value: u.id, label: `${u.name} (${u.email})` }))
                ]}
              />
              <Input
                label="업체 담당자명"
                value={formData.partyBContactName}
                onChange={(e) => handleChange('partyBContactName', e.target.value)}
                placeholder="예: 홍길동"
              />
              <Input
                label="업체 연락처"
                type="tel"
                value={formData.partyBContactPhone}
                onChange={(e) => handleChange('partyBContactPhone', e.target.value)}
                placeholder="예: 010-1234-5678"
              />
              <Input
                label="업체 이메일"
                type="email"
                value={formData.partyBContactEmail}
                onChange={(e) => handleChange('partyBContactEmail', e.target.value)}
                placeholder="예: contact@example.com"
              />
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

          <div className="border-t-2 border-gray-800 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">첨부 파일</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    계약 저장 후 첨부파일을 추가할 수 있습니다.
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    계약을 먼저 등록한 후, 상세 페이지에서 파일을 업로드하세요.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              취소
            </Button>
            <Button type="submit" loading={loading}>
              등록
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
