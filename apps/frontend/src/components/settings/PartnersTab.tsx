'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { usersApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  User,
  Partner,
  CommissionType,
  ROLE_COLORS,
  ROLE_LABELS,
  COMMISSION_TYPE_OPTIONS,
  COMMISSION_TYPE_LABELS,
} from './types';

export function PartnersTab() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [salesReps, setSalesReps] = useState<Set<string>>(new Set());
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Partner modal
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [partnerForm, setPartnerForm] = useState({
    name: '',
    contactName: '',
    contactPhone: '',
    email: '',
    commissionType: 'percentage' as CommissionType,
    commissionValue: 0,
    notes: '',
  });

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('msspbiz_partners');
      if (stored) setPartners(JSON.parse(stored));
    } catch (error) {
      console.error('Failed to load partners:', error);
    }

    try {
      const stored = localStorage.getItem('msspbiz_sales_reps');
      if (stored) setSalesReps(new Set(JSON.parse(stored)));
    } catch (error) {
      console.error('Failed to load sales reps:', error);
    }
  }, []);

  // Save partners to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('msspbiz_partners', JSON.stringify(partners));
    } catch (error) {
      console.error('Failed to save partners:', error);
    }
  }, [partners]);

  // Save sales reps to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('msspbiz_sales_reps', JSON.stringify(Array.from(salesReps)));
    } catch (error) {
      console.error('Failed to save sales reps:', error);
    }
  }, [salesReps]);

  const fetchUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const data = await usersApi.list();
      setUsers(data.items || data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddPartner = () => {
    setEditingPartner(null);
    setPartnerForm({
      name: '',
      contactName: '',
      contactPhone: '',
      email: '',
      commissionType: 'percentage',
      commissionValue: 0,
      notes: '',
    });
    setPartnerModalOpen(true);
  };

  const handleEditPartner = (partner: Partner) => {
    setEditingPartner(partner);
    setPartnerForm({
      name: partner.name,
      contactName: partner.contactName,
      contactPhone: partner.contactPhone,
      email: partner.email,
      commissionType: partner.commissionType,
      commissionValue: partner.commissionValue,
      notes: partner.notes,
    });
    setPartnerModalOpen(true);
  };

  const handleSavePartner = () => {
    if (!partnerForm.name) {
      toast.error('파트너사명을 입력하세요');
      return;
    }

    if (editingPartner) {
      setPartners(partners.map(p => p.id === editingPartner.id ? { ...editingPartner, ...partnerForm } : p));
      toast.success('파트너사가 수정되었습니다');
    } else {
      const newPartner: Partner = {
        id: Date.now().toString(),
        ...partnerForm,
      };
      setPartners([...partners, newPartner]);
      toast.success('파트너사가 추가되었습니다');
    }
    setPartnerModalOpen(false);
  };

  const handleDeletePartner = (partnerId: string) => {
    setPartners(partners.filter(p => p.id !== partnerId));
    toast.success('파트너사가 삭제되었습니다');
  };

  const toggleSalesRep = (userId: string) => {
    const newSalesReps = new Set(salesReps);
    if (newSalesReps.has(userId)) {
      newSalesReps.delete(userId);
    } else {
      newSalesReps.add(userId);
    }
    setSalesReps(newSalesReps);
  };

  return (
    <>
      <div className="space-y-8">
        {/* Partners Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">파트너사 목록</h2>
              <p className="text-sm text-gray-600 mt-1">총 {partners.length}개의 파트너사</p>
            </div>
            <Button onClick={handleAddPartner}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              파트너사 추가
            </Button>
          </div>

          {partners.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">파트너사가 없습니다</h3>
                <p className="mt-1 text-sm text-gray-500">새 파트너사를 추가하여 시작하세요</p>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">파트너사명</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">담당자명</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">연락처</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">수수료 유형</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">수수료</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">비고</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y-2 divide-gray-800">
                    {partners.map((partner) => (
                      <tr key={partner.id} className="hover:bg-gray-100">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{partner.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{partner.contactName || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{partner.contactPhone || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{partner.email || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <Badge color="bg-blue-100 text-blue-800">
                            {COMMISSION_TYPE_LABELS[partner.commissionType]}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {partner.commissionType === 'percentage'
                            ? `${partner.commissionValue}%`
                            : `${partner.commissionValue.toLocaleString('ko-KR')}원`}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{partner.notes || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button size="sm" variant="ghost" onClick={() => handleEditPartner(partner)}>
                              수정
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeletePartner(partner.id)}>
                              <span className="text-red-600">삭제</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        {/* Sales Reps Section */}
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">영업 담당자 지정</h2>
            <p className="text-sm text-gray-600 mt-1">시스템에 등록된 사용자 중 영업 담당자를 선택합니다</p>
          </div>

          {usersLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : (
            <Card>
              <div className="space-y-2">
                {users.map((user) => (
                  <label
                    key={user.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={salesReps.has(user.id)}
                      onChange={() => toggleSalesRep(user.id)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{user.name}</span>
                        <Badge color={ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-800'}>
                          {ROLE_LABELS[user.role] || user.role}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500">{user.email}</span>
                    </div>
                  </label>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Partner Modal */}
      <Modal
        open={partnerModalOpen}
        onClose={() => setPartnerModalOpen(false)}
        title={editingPartner ? '파트너사 수정' : '파트너사 추가'}
      >
        <div className="space-y-4">
          <Input
            label="파트너사명"
            value={partnerForm.name}
            onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
            placeholder="예: ABC 솔루션"
            required
          />
          <Input
            label="담당자명"
            value={partnerForm.contactName}
            onChange={(e) => setPartnerForm({ ...partnerForm, contactName: e.target.value })}
            placeholder="홍길동"
          />
          <Input
            label="연락처"
            value={partnerForm.contactPhone}
            onChange={(e) => setPartnerForm({ ...partnerForm, contactPhone: e.target.value })}
            placeholder="010-0000-0000"
          />
          <Input
            label="이메일"
            type="email"
            value={partnerForm.email}
            onChange={(e) => setPartnerForm({ ...partnerForm, email: e.target.value })}
            placeholder="contact@partner.com"
          />
          <Select
            label="수수료 유형"
            value={partnerForm.commissionType}
            onChange={(e) => setPartnerForm({ ...partnerForm, commissionType: e.target.value as CommissionType })}
            options={COMMISSION_TYPE_OPTIONS}
            required
          />
          <Input
            label={partnerForm.commissionType === 'percentage' ? '수수료율(%)' : '수수료 고정금액'}
            type="number"
            value={partnerForm.commissionValue}
            onChange={(e) => setPartnerForm({ ...partnerForm, commissionValue: parseFloat(e.target.value) || 0 })}
            placeholder={partnerForm.commissionType === 'percentage' ? '10' : '1000000'}
          />
          <Textarea
            label="비고"
            value={partnerForm.notes}
            onChange={(e) => setPartnerForm({ ...partnerForm, notes: e.target.value })}
            placeholder="추가 정보나 메모를 입력하세요"
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setPartnerModalOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSavePartner}>
              {editingPartner ? '수정' : '추가'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
