'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { contractsApi } from '@/lib/api';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  divider?: boolean;
}

const navigation: NavigationItem[] = [
  {
    name: '대시보드',
    href: '/',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    name: '업무 관리',
    href: '/tasks',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    name: '회의록',
    href: '/meetings',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    name: '계약 관리',
    href: '/contracts',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    name: '설정',
    href: '/settings',
    divider: true,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [expiringWithin7, setExpiringWithin7] = useState(0);
  const [expiringWithin30, setExpiringWithin30] = useState(0);

  const loadExpiringContracts = useCallback(async () => {
    if (!user) return;

    try {
      const [within7Data, within30Data] = await Promise.all([
        contractsApi.expiring(7),
        contractsApi.expiring(30),
      ]);

      setExpiringWithin7(Array.isArray(within7Data) ? within7Data.length : 0);
      setExpiringWithin30(Array.isArray(within30Data) ? within30Data.length : 0);
    } catch (error) {
      console.error('Failed to load expiring contracts:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    loadExpiringContracts();
  }, [loadExpiringContracts]);

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r-2 border-gray-800">
      <div className="flex items-center h-16 px-6 border-b-2 border-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-md border-2 border-gray-800 flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="text-lg font-bold text-gray-900">MsspBiz</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          const isContractMenu = item.href === '/contracts';
          const badgeCount = expiringWithin7 > 0 ? expiringWithin7 : expiringWithin30;
          const badgeColor = expiringWithin7 > 0 ? 'bg-red-500' : 'bg-yellow-500';
          const showBadge = isContractMenu && badgeCount > 0;

          return (
            <div key={item.name}>
              {item.divider && <div className="border-t-2 border-gray-800 my-2" />}
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-100 text-primary-800 border-2 border-gray-800 shadow-brutal-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                )}
              >
                {item.icon}
                <span className="flex-1">{item.name}</span>
                {showBadge && (
                  <span className={cn(
                    'w-5 h-5 text-xs font-bold text-white rounded-md flex items-center justify-center',
                    badgeColor
                  )}>
                    {badgeCount}
                  </span>
                )}
              </Link>
            </div>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t-2 border-gray-800">
        <p className="text-xs text-gray-400">v0.1.0-alpha.9</p>
      </div>
    </aside>
  );
}
