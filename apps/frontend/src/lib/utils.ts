export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getWeekNumber(date: Date = new Date()): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear =
    (date.getTime() - startOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    review: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
    draft: 'bg-gray-100 text-gray-800',
    published: 'bg-green-100 text-green-800',
    active: 'bg-green-100 text-green-800',
    expired: 'bg-red-100 text-red-800',
    terminated: 'bg-red-100 text-red-800',
    renewed: 'bg-blue-100 text-blue-800',
    poc_demo: 'bg-purple-100 text-purple-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800',
  };
  return colors[priority] || 'bg-gray-100 text-gray-800';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: '대기',
    in_progress: '진행 중',
    review: '검토',
    completed: '완료',
    cancelled: '취소',
    draft: '초안',
    published: '발행됨',
    active: '활성',
    expired: '만료',
    terminated: '해지',
    renewed: '갱신됨',
    poc_demo: 'PoC/Demo',
  };
  return labels[status] || status;
}

export function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    critical: '최상',
    high: '높음',
    medium: '보통',
    low: '낮음',
  };
  return labels[priority] || priority;
}

/**
 * HTML 문자열에서 위험한 태그와 속성을 제거합니다.
 * DOMPurify 화이트리스트 기반 sanitization으로 XSS를 방어합니다.
 */
export function sanitizeHtml(dirty: string): string {
  // Lazy require: top-level import of isomorphic-dompurify initializes jsdom
  // which conflicts with tiptap's SSR detection during static page generation
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const DOMPurify = require('isomorphic-dompurify').default;
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'ul', 'ol', 'li', 'h2', 'h3', 'a', 'blockquote', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  });
}
