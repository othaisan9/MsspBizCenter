'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';
import { Badge } from '@/components/ui/Badge';
import type { TaskResponse } from '@msspbiz/shared';

type Task = TaskResponse;

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  headerColor: string;
  badgeColor: string;
}

export function KanbanColumn({ id, title, tasks, headerColor, badgeColor }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex flex-col w-80 flex-shrink-0">
      <div className={`${headerColor} rounded-t-lg px-4 py-3 border-b border-gray-200`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <Badge color={badgeColor} className="font-semibold">
            {tasks.length}
          </Badge>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`
          flex-1 p-3 rounded-b-lg border border-t-0 border-gray-200 bg-gray-50
          min-h-[500px] max-h-[calc(100vh-300px)] overflow-y-auto
          ${isOver ? 'bg-blue-50 border-blue-300' : ''}
        `}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-gray-400">
              업무를 여기로 드래그하세요
            </div>
          ) : (
            tasks.map((task) => <KanbanCard key={task.id} task={task} />)
          )}
        </SortableContext>
      </div>
    </div>
  );
}
