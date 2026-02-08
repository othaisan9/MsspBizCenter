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
              <span className="text-gray-400">/</span>
            )}
            {isLast ? (
              <span className="font-semibold text-gray-900">{item.label}</span>
            ) : item.href ? (
              <button
                onClick={() => router.push(item.href!)}
                className="text-primary-600 hover:underline focus:outline-none"
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
