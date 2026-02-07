'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { contractsApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';

export default function NewContractPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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

      await contractsApi.create(payload);
      router.push('/contracts');
    } catch (err: any) {
      setError(err.message || '계약 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
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
        <Card className="bg-red-50 border-red-200 mb-6">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              계약 내용
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={6}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="계약 내용을 입력하세요."
            />
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
