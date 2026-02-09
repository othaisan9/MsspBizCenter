'use client';

import { useState, useEffect } from 'react';
import { authApi } from '@/lib/api';
import { MasterDataTab } from '@/components/settings/MasterDataTab';
import { FinanceTab } from '@/components/settings/FinanceTab';
import { UsersTab } from '@/components/settings/UsersTab';
import { PartnersTab } from '@/components/settings/PartnersTab';
import { AiTab } from '@/components/settings/AiTab';
import { DataManagementTab } from '@/components/settings/DataManagementTab';
import { User } from '@/components/settings/types';

const TABS = [
  { key: 'master-data', label: '마스터 데이터' },
  { key: 'finance', label: '계약 재무 관리' },
  { key: 'users', label: '사용자 관리' },
  { key: 'partners', label: '파트너사 관리' },
  { key: 'ai', label: 'AI 어시스턴트' },
  { key: 'data-management', label: '데이터 관리' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('master-data');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await authApi.getProfile();
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to fetch current user:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">설정</h1>
        <p className="text-gray-600 mt-1">시스템 설정을 관리합니다</p>
      </div>

      {/* Tabs */}
      <div className="border-b-2 border-gray-800 mb-6">
        <nav className="flex space-x-8">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.key
                  ? 'border-primary-600 text-primary-600 font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-400'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'master-data' && <MasterDataTab />}
      {activeTab === 'finance' && <FinanceTab currentUser={currentUser} />}
      {activeTab === 'users' && <UsersTab currentUser={currentUser} />}
      {activeTab === 'partners' && <PartnersTab />}
      {activeTab === 'ai' && <AiTab currentUser={currentUser} />}
      {activeTab === 'data-management' && <DataManagementTab currentUser={currentUser} />}
    </div>
  );
}
