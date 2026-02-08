'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { getPriorityColor, getPriorityLabel, formatDate } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: string;
  assignee?: { id: string; name: string };
  dueDate?: string;
  tags?: string[];
}

interface KanbanCardProps {
  task: Task;
}

export function KanbanCard({ task }: KanbanCardProps) {
  const router = useRouter();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleClick = (e: React.MouseEvent) => {
    // 드래그 중이 아닐 때만 클릭 이벤트 처리
    if (!isDragging) {
      router.push(`/tasks/${task.id}`);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className="bg-white rounded-lg border border-gray-200 p-4 mb-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
            {task.title}
          </h4>
          {task.description && (
            <p className="mt-1 text-xs text-gray-500 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Badge color={getPriorityColor(task.priority)}>
            {getPriorityLabel(task.priority)}
          </Badge>

          {task.assignee && (
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-xs font-medium text-primary-700">
                  {task.assignee.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </div>

        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-700 rounded border border-blue-200">
                {tag}
              </span>
            ))}
            {task.tags.length > 3 && (
              <span className="px-1.5 py-0.5 text-[10px] text-gray-500">
                +{task.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {task.dueDate && (
          <div className="flex items-center text-xs text-gray-500">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(task.dueDate)}
          </div>
        )}
      </div>
    </div>
  );
}
