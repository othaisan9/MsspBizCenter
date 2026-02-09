'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { usersApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { User, ROLE_COLORS, ROLE_LABELS, ROLE_OPTIONS, AFFILIATION_LABELS, AFFILIATION_OPTIONS } from './types';

interface UsersTabProps {
  currentUser: User | null;
}

export function UsersTab({ currentUser }: UsersTabProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Edit user modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserSaving, setEditUserSaving] = useState(false);
  const [editUserForm, setEditUserForm] = useState({
    name: '',
    role: '',
    affiliation: 'internal',
    affiliationName: '',
  });

  // Add user modal
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [addUserSaving, setAddUserSaving] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    email: '',
    name: '',
    password: '',
    role: 'viewer',
    affiliation: 'internal',
    affiliationName: '',
  });

  // Delete confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const canManageUsers = currentUser?.role === 'owner' || currentUser?.role === 'admin';

  const fetchUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const data = await usersApi.list();
      setUsers(data.items || data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('사용자 목록을 불러오는데 실패했습니다');
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canManageUsers) {
      fetchUsers();
    }
  }, [canManageUsers, fetchUsers]);

  const handleAddUser = async () => {
    if (!addUserForm.email || !addUserForm.name || !addUserForm.password) {
      toast.error('이메일, 이름, 비밀번호를 모두 입력하세요');
      return;
    }
    if (addUserForm.password.length < 8) {
      toast.error('비밀번호는 8자 이상이어야 합니다');
      return;
    }

    try {
      setAddUserSaving(true);
      await usersApi.create(addUserForm);
      toast.success('사용자가 추가되었습니다');
      setAddUserModalOpen(false);
      setAddUserForm({ email: '', name: '', password: '', role: 'viewer', affiliation: 'internal', affiliationName: '' });
      fetchUsers();
    } catch (err: any) {
      const message = err.message || '사용자 추가에 실패했습니다';
      toast.error(message);
    } finally {
      setAddUserSaving(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditUserForm({
      name: user.name,
      role: user.role,
      affiliation: user.affiliation || 'internal',
      affiliationName: user.affiliationName || '',
    });
    setEditModalOpen(true);
  };

  const handleSaveEditUser = async () => {
    if (!editingUser) return;
    if (!editUserForm.name.trim()) {
      toast.error('이름을 입력하세요');
      return;
    }

    try {
      setEditUserSaving(true);
      const payload: Record<string, unknown> = {
        name: editUserForm.name.trim(),
        role: editUserForm.role,
        affiliation: editUserForm.affiliation,
        affiliationName: editUserForm.affiliation !== 'internal' ? editUserForm.affiliationName.trim() || null : null,
      };
      await usersApi.update(editingUser.id, payload);
      toast.success('사용자 정보가 수정되었습니다');
      setEditModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error('사용자 수정에 실패했습니다');
    } finally {
      setEditUserSaving(false);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setDeleteUserId(userId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteUserId) return;

    try {
      await usersApi.delete(deleteUserId);
      toast.success('사용자가 비활성화되었습니다');
      fetchUsers();
      setDeleteModalOpen(false);
      setDeleteUserId(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error('삭제에 실패했습니다');
    }
  };

  if (!canManageUsers) {
    return (
      <Card>
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">권한이 없습니다</h3>
          <p className="mt-1 text-sm text-gray-500">사용자 관리는 Owner 또는 Admin만 접근할 수 있습니다</p>
        </div>
      </Card>
    );
  }

  if (usersLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <>
      <div>
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-600">
            총 {users.length}명의 사용자
          </p>
          <Button onClick={() => setAddUserModalOpen(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            사용자 추가
          </Button>
        </div>
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y-2 divide-gray-800">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">소속</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">역할</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">최근 로그인</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y-2 divide-gray-800">
                {users.map((user) => {
                  const isSelf = currentUser?.id === user.id;

                  return (
                    <tr key={user.id} className="hover:bg-gray-100">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.name}
                        {isSelf && <span className="ml-2 text-xs text-gray-500">(나)</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        {AFFILIATION_LABELS[user.affiliation] || '자사'}
                        {user.affiliationName && (
                          <span className="ml-1 text-gray-500">({user.affiliationName})</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Badge color={ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-800'}>
                          {ROLE_LABELS[user.role] || user.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Badge color={user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {user.isActive ? '활성' : '비활성'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('ko-KR') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isSelf}
                            onClick={() => handleEditUser(user)}
                          >
                            수정
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isSelf || !user.isActive}
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <span className="text-red-600">비활성화</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Edit User Modal */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="사용자 수정"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            <strong>{editingUser?.email}</strong>
          </p>
          <Input
            label="이름"
            value={editUserForm.name}
            onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
            placeholder="홍길동"
            required
          />
          <Select
            label="역할"
            value={editUserForm.role}
            onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })}
            options={ROLE_OPTIONS}
            required
          />
          <Select
            label="소속"
            value={editUserForm.affiliation}
            onChange={(e) => setEditUserForm({ ...editUserForm, affiliation: e.target.value, affiliationName: e.target.value === 'internal' ? '' : editUserForm.affiliationName })}
            options={AFFILIATION_OPTIONS}
            required
          />
          {editUserForm.affiliation !== 'internal' && (
            <Input
              label="소속명"
              value={editUserForm.affiliationName}
              onChange={(e) => setEditUserForm({ ...editUserForm, affiliationName: e.target.value })}
              placeholder={editUserForm.affiliation === 'vendor' ? '벤더사명 입력' : editUserForm.affiliation === 'partner' ? '파트너사명 입력' : '고객사명 입력'}
            />
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSaveEditUser} disabled={editUserSaving}>
              {editUserSaving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add User Modal */}
      <Modal
        open={addUserModalOpen}
        onClose={() => setAddUserModalOpen(false)}
        title="사용자 추가"
      >
        <div className="space-y-4">
          <Input
            label="이메일"
            type="email"
            value={addUserForm.email}
            onChange={(e) => setAddUserForm({ ...addUserForm, email: e.target.value })}
            placeholder="user@example.com"
            required
          />
          <Input
            label="이름"
            value={addUserForm.name}
            onChange={(e) => setAddUserForm({ ...addUserForm, name: e.target.value })}
            placeholder="홍길동"
            required
          />
          <Input
            label="임시 비밀번호"
            type="password"
            value={addUserForm.password}
            onChange={(e) => setAddUserForm({ ...addUserForm, password: e.target.value })}
            placeholder="8자 이상"
            required
          />
          <Select
            label="역할"
            value={addUserForm.role}
            onChange={(e) => setAddUserForm({ ...addUserForm, role: e.target.value })}
            options={ROLE_OPTIONS}
            required
          />
          <Select
            label="소속"
            value={addUserForm.affiliation}
            onChange={(e) => setAddUserForm({ ...addUserForm, affiliation: e.target.value, affiliationName: e.target.value === 'internal' ? '' : addUserForm.affiliationName })}
            options={AFFILIATION_OPTIONS}
            required
          />
          {addUserForm.affiliation !== 'internal' && (
            <Input
              label="소속명"
              value={addUserForm.affiliationName}
              onChange={(e) => setAddUserForm({ ...addUserForm, affiliationName: e.target.value })}
              placeholder={addUserForm.affiliation === 'vendor' ? '벤더사명 입력' : addUserForm.affiliation === 'partner' ? '파트너사명 입력' : '고객사명 입력'}
            />
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setAddUserModalOpen(false)}>
              취소
            </Button>
            <Button onClick={handleAddUser} disabled={addUserSaving}>
              {addUserSaving ? '추가 중...' : '추가'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="삭제 확인"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            이 사용자를 비활성화하시겠습니까?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              취소
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              비활성화
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
