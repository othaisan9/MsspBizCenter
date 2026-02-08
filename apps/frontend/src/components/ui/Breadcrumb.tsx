'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  const router = useRouter();

  return (
    <nav className="flex items-center space-x-2 text-sm mb-4">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="flex items-center space-x-2">
            {index > 0 && (
              <span className="text-gray-600 font-bold">/</span>
            )}
            {isLast ? (
              <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-800">{item.label}</span>
            ) : item.href ? (
              <button
                onClick={() => router.push(item.href!)}
                className="text-primary-700 font-medium hover:bg-primary-50 px-2 py-0.5 rounded-md transition-colors focus:outline-none"
              >
                {item.label}
              </button>
            ) : (
              <span className="text-gray-500">{item.label}</span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
